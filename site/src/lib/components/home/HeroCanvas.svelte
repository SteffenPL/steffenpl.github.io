<script lang="ts">
  import { onMount } from 'svelte';

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let animationId: number;
  let scrollY = $state(0);
  let mouseX = $state(-9999);
  let mouseY = $state(-9999);
  let lastMouseMoveTime = 0;
  let chemoFade = 0;  // 0..1, smoothly fades out after mouse stops

  // ──────────────────────────────────────────────
  // Simulation parameters — easy to update at runtime
  // ──────────────────────────────────────────────
  const params = {
    // Cell geometry
    cellCount: 60,
    radius: 16,            // hard radius (µm)
    radiusSoft: 32,        // soft/interaction radius
    radiusSpread: 6.4,     // heterogeneity in size (~10% of radiusSoft)

    // Movement speeds
    runSpeed: 1.2,
    tumbleSpeed: 0.5,
    cilSpeed: 0.7,
    clusterSpeed: 0.8,

    // Stochastic durations (higher = longer average stay)
    runDuration: 15,
    tumbleDuration: 6,
    rotationDuration: 2,
    cilDuration: 5,
    contactDuration: 1,
    newAdhDuration: 3,
    breakAdhDuration: 12,

    // Physics
    diffCoef: 0.02,
    adhStiffness: 0.02,
    softRepulsion: 0.2,
    wallRepulsion: 0.2,
    mu: 2,
    substeps: 10,

    // Plithotaxis
    plithoAlign: 80,
    plithoMax: 50,
    plithoMin: 0.1,
    plithoSpread: Math.PI / 1.5,
    plithoDuration: 3,

    // Chemotaxis toward mouse pointer
    chemoStrength: 0.033,    // 0 = off, higher = cells turn toward mouse faster

    // Rendering
    cellAlpha: 0.55,
    bondAlpha: 0.25,
    polarityAlpha: 0.7,    // polarity indicator opacity (0 = hidden)
    polarityLength: 0.8,   // fraction of hard radius for line length
    forceLineAlpha: 0,     // set >0 to debug forces
    polarityLineAlpha: 0,  // set >0 to debug polarity (raw)
  };

  // ──────────────────────────────────────────────
  // Vector helpers (avoid allocations in hot loops)
  // ──────────────────────────────────────────────
  interface Vec2 { x: number; y: number }

  function vDist(a: Vec2, b: Vec2): number {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function vMag(v: Vec2): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }
  function vDot(a: Vec2, b: Vec2): number {
    return a.x * b.x + a.y * b.y;
  }

  // ──────────────────────────────────────────────
  // Cell and contact state
  // ──────────────────────────────────────────────
  const MODE_RUN = 0, MODE_TUMBLE = 1, MODE_CIL = 2, MODE_CLUSTER = 3;

  interface Cell {
    pos: Vec2;
    pol: Vec2;       // polarity (direction + speed magnitude)
    f: Vec2;         // force accumulator
    rHard: number;
    rSoft: number;
    rand: number;
    mode: number;
  }

  let cells: Cell[] = [];
  let contacts: boolean[][] = [];
  let simW = 800;   // internal simulation width (adjusted on resize)
  let simH = 600;   // internal simulation height (adjusted on resize)
  let simScale = 1; // pixels per sim-unit (uniform in x and y)
  let canvasW = 0;
  let canvasH = 0;
  let firstStep = true;
  const TF = 1000;

  // Walls: pos + normal + half-length
  interface Wall { pos: Vec2; normal: Vec2; halfLen: number }
  let walls: Wall[] = [];

  function initSim() {
    firstStep = true;
    const N = params.cellCount;

    // Walls (box)
    walls = [
      { pos: { x: simW / 2, y: 10 },       normal: { x: 0, y: 1 },  halfLen: (simW - 20) / 2 },
      { pos: { x: simW / 2, y: simH - 10 }, normal: { x: 0, y: -1 }, halfLen: (simW - 20) / 2 },
      { pos: { x: 10,       y: simH / 2 },  normal: { x: 1, y: 0 },  halfLen: (simH - 20) / 2 },
      { pos: { x: simW - 10, y: simH / 2 }, normal: { x: -1, y: 0 }, halfLen: (simH - 20) / 2 },
    ];

    cells = [];
    for (let i = 0; i < N; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rand = Math.random();
      const rSoft = params.radiusSoft + params.radiusSpread * (rand * rand - 0.5);
      cells.push({
        pos: { x: Math.random() * simW * 0.5, y: simH * 0.25 + Math.random() * simH * 0.5 },
        pol: { x: Math.sin(angle) * params.runSpeed, y: Math.cos(angle) * params.runSpeed },
        f: { x: 0, y: 0 },
        rHard: rSoft / 2,
        rSoft,
        rand,
        mode: MODE_RUN,
      });
    }

    // Contact matrix
    contacts = [];
    for (let i = 0; i < N; i++) {
      contacts[i] = new Array(N).fill(false);
    }
  }

  function expRand(rate: number, dt: number): boolean {
    return Math.random() <= 1.0 - Math.exp(-dt / (rate * TF));
  }

  function randomGaussian(): number {
    // Box-Muller
    const u1 = Math.random(), u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  function stepSim(frameDt: number) {
    const P = params;
    const N = cells.length;
    const dt = Math.min(frameDt / P.substeps, 50 / P.substeps);

    // Update radii based on current params
    for (let i = 0; i < N; i++) {
      cells[i].rSoft = P.radiusSoft + P.radiusSpread * (cells[i].rand * cells[i].rand - 0.5);
      cells[i].rHard = cells[i].rSoft / 2;
    }

    for (let step = 0; step < P.substeps; step++) {
      // ── Remove contacts stochastically ──
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < i; j++) {
          if (contacts[i][j] && expRand(P.breakAdhDuration, dt)) {
            contacts[i][j] = contacts[j][i] = false;
          }
        }
      }

      // ── Add contacts stochastically ──
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < i; j++) {
          const Rij = cells[i].rSoft + cells[j].rSoft;
          if (vDist(cells[i].pos, cells[j].pos) < Rij && expRand(P.newAdhDuration, dt)) {
            contacts[i][j] = contacts[j][i] = true;
          }
        }
      }

      // ── Mode switching ──
      for (let i = 0; i < N; i++) {
        let nContacts = 0, lastJ = 0;
        for (let k = 0; k < N; k++) {
          if (contacts[i][k]) { nContacts++; lastJ = k; }
        }

        const mi = cells[i].mode;
        const ci = cells[i];
        const mag = vMag(ci.pol);

        if ((mi === MODE_RUN || mi === MODE_TUMBLE) && nContacts > 0 && expRand(P.contactDuration, dt)) {
          if (nContacts === 1) {
            ci.mode = MODE_CIL;
            if (mag > 0) { ci.pol.x = ci.pol.x / mag * P.cilSpeed; ci.pol.y = ci.pol.y / mag * P.cilSpeed; }
          } else {
            ci.mode = MODE_CLUSTER;
            if (mag > 0) { ci.pol.x = ci.pol.x / mag * P.clusterSpeed; ci.pol.y = ci.pol.y / mag * P.clusterSpeed; }
          }
        } else if (mi === MODE_RUN) {
          if (expRand(P.runDuration, dt)) {
            ci.mode = MODE_TUMBLE;
            if (mag > 0) { ci.pol.x = ci.pol.x / mag * P.tumbleSpeed; ci.pol.y = ci.pol.y / mag * P.tumbleSpeed; }
          }
        } else if (mi === MODE_TUMBLE) {
          if (expRand(P.tumbleDuration, dt)) {
            ci.mode = MODE_RUN;
            if (mag > 0) { ci.pol.x = ci.pol.x / mag * P.runSpeed; ci.pol.y = ci.pol.y / mag * P.runSpeed; }
          } else if (expRand(P.rotationDuration, dt)) {
            const a = Math.random() * Math.PI * 2;
            ci.pol.x = Math.sin(a) * P.runSpeed;
            ci.pol.y = Math.cos(a) * P.runSpeed;
          }
        } else if (mi === MODE_CIL) {
          if (nContacts > 1) {
            ci.mode = MODE_CLUSTER;
            if (mag > 0) { ci.pol.x = ci.pol.x / mag * P.clusterSpeed; ci.pol.y = ci.pol.y / mag * P.clusterSpeed; }
          } else if (expRand(P.cilDuration, dt)) {
            if (nContacts >= 1) {
              contacts[i][lastJ] = contacts[lastJ][i] = false;
              const dx = cells[lastJ].pos.x - ci.pos.x;
              const dy = cells[lastJ].pos.y - ci.pos.y;
              const d = Math.sqrt(dx * dx + dy * dy) || 1;
              cells[lastJ].mode = MODE_RUN;
              cells[lastJ].pol.x = dx / d * P.runSpeed;
              cells[lastJ].pol.y = dy / d * P.runSpeed;
              ci.pol.x = -dx / d * P.runSpeed;
              ci.pol.y = -dy / d * P.runSpeed;
            }
            ci.mode = MODE_RUN;
            const m2 = vMag(ci.pol) || 1;
            ci.pol.x = ci.pol.x / m2 * P.runSpeed;
            ci.pol.y = ci.pol.y / m2 * P.runSpeed;
          }
        } else if (mi === MODE_CLUSTER) {
          if (nContacts === 0) {
            ci.mode = MODE_RUN;
            const m2 = mag || 1;
            ci.pol.x = ci.pol.x / m2 * P.runSpeed;
            ci.pol.y = ci.pol.y / m2 * P.runSpeed;
          } else if (nContacts === 1) {
            ci.mode = MODE_CIL;
            const m2 = mag || 1;
            ci.pol.x = ci.pol.x / m2 * P.cilSpeed;
            ci.pol.y = ci.pol.y / m2 * P.cilSpeed;
          } else {
            // Plithotaxis: realign polarity toward net force
            const s = mag;
            let rate = P.plithoDuration;
            if (s > 0) {
              rate += P.plithoAlign / P.mu * vDot(ci.pol, ci.f) / s;
            }
            rate = Math.min(P.plithoMax, Math.max(P.plithoMin, rate));
            if (expRand(rate, dt)) {
              const fm = vMag(ci.f) || 1;
              const angle = Math.atan2(ci.f.y, ci.f.x) + (Math.random() * 2 - 1) * P.plithoSpread;
              ci.pol.x = Math.cos(angle) * P.clusterSpeed;
              ci.pol.y = Math.sin(angle) * P.clusterSpeed;
            }
          }
        }
      }

      // ── Compute forces ──
      const muF = 0.1;
      for (let i = 0; i < N; i++) {
        cells[i].f.x = 0; cells[i].f.y = 0;
      }

      // ── Chemotaxis: rotate polarity toward mouse (only while moving) ──
      const chemoEff = P.chemoStrength * chemoFade;
      if (chemoEff > 0.001 && mouseX > -999 && mouseY > -999) {
        const targetX = mouseX / simScale;
        const targetY = mouseY / simScale;
        for (let i = 0; i < N; i++) {
          const ci = cells[i];
          const toMouseX = targetX - ci.pos.x;
          const toMouseY = targetY - ci.pos.y;
          const toMouseMag = Math.sqrt(toMouseX * toMouseX + toMouseY * toMouseY);
          const polMag = vMag(ci.pol);
          if (toMouseMag > 1 && polMag > 0) {
            // Signed angle between polarity and direction to mouse
            const cross = ci.pol.x * toMouseY - ci.pol.y * toMouseX;
            const dot = ci.pol.x * toMouseX + ci.pol.y * toMouseY;
            const angle = Math.atan2(cross, dot);
            // Rotate polarity toward mouse
            const heading = Math.atan2(ci.pol.y, ci.pol.x);
            const newHeading = heading + dt / 100 * chemoEff * angle;
            ci.pol.x = Math.cos(newHeading) * polMag;
            ci.pol.y = Math.sin(newHeading) * polMag;
          }
        }
      }

      for (let i = 0; i < N; i++) {
        const ci = cells[i];
        ci.f.x += ci.pol.x * P.mu;
        ci.f.y += ci.pol.y * P.mu;

        for (let j = 0; j < i; j++) {
          const cj = cells[j];
          const dx = cj.pos.x - ci.pos.x;
          const dy = cj.pos.y - ci.pos.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          // Adhesion
          if (contacts[i][j]) {
            ci.f.x += dx * P.adhStiffness;
            ci.f.y += dy * P.adhStiffness;
            cj.f.x -= dx * P.adhStiffness;
            cj.f.y -= dy * P.adhStiffness;
          }

          // Soft repulsion
          const Rij = ci.rSoft + cj.rSoft;
          if (d < Rij && d > Rij / 10) {
            const rep = -P.softRepulsion * (Rij - d) / d;
            ci.f.x += dx * rep;
            ci.f.y += dy * rep;
            cj.f.x -= dx * rep;
            cj.f.y -= dy * rep;
          }
        }

        // Wall forces
        for (const wall of walls) {
          const wx = ci.pos.x - wall.pos.x;
          const wy = ci.pos.y - wall.pos.y;
          const dd = wx * wall.normal.x + wy * wall.normal.y;
          const distToWall = Math.sqrt(wx * wx + wy * wy);
          if (distToWall < wall.halfLen + ci.rHard) {
            if (dd > 0 && Math.abs(dd) < ci.rSoft) {
              ci.f.x -= wall.normal.x * (Math.abs(dd) - ci.rSoft) * P.softRepulsion;
              ci.f.y -= wall.normal.y * (Math.abs(dd) - ci.rSoft) * P.softRepulsion;
            }
            if (dd < 0 && Math.abs(dd) < ci.rSoft) {
              ci.f.x += wall.normal.x * (Math.abs(dd) - ci.rSoft) * P.softRepulsion;
              ci.f.y += wall.normal.y * (Math.abs(dd) - ci.rSoft) * P.softRepulsion;
            }
          }
        }
      }

      // ── Integration ──
      const sqrtDt = Math.sqrt(dt);
      for (let i = 0; i < N; i++) {
        const ci = cells[i];
        ci.pos.x += sqrtDt * P.diffCoef * randomGaussian();
        ci.pos.y += sqrtDt * P.diffCoef * randomGaussian();
        ci.pos.x += muF * dt * ci.f.x / P.mu;
        ci.pos.y += muF * dt * ci.f.y / P.mu;
      }

      // ── Hard-body position correction ──
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < i; j++) {
          const Rij = cells[i].rHard + cells[j].rHard;
          const dx = cells[i].pos.x - cells[j].pos.x;
          const dy = cells[i].pos.y - cells[j].pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const overlap = dist - Rij;
          if (overlap < 0 && dist > 0) {
            const corr = 0.5 * overlap / dist;
            cells[i].pos.x -= dx * corr;
            cells[i].pos.y -= dy * corr;
            cells[j].pos.x += dx * corr;
            cells[j].pos.y += dy * corr;
          }
        }

        // Wall constraints
        for (const wall of walls) {
          const wx = cells[i].pos.x - wall.pos.x;
          const wy = cells[i].pos.y - wall.pos.y;
          const d = wx * wall.normal.x + wy * wall.normal.y;
          if (!firstStep) {
            if (d < cells[i].rHard) {
              cells[i].pos.x -= wall.normal.x * (d - cells[i].rHard);
              cells[i].pos.y -= wall.normal.y * (d - cells[i].rHard);
            }
          } else {
            const pen = d - cells[i].rHard;
            if (pen < 0) {
              cells[i].pos.x -= wall.normal.x * pen;
              cells[i].pos.y -= wall.normal.y * pen;
            }
          }
        }

      }
    }

    firstStep = false;
  }

  // ──────────────────────────────────────────────
  // Rendering
  // ──────────────────────────────────────────────
  function getParticleColor(): { r: number; g: number; b: number } {
    if (typeof getComputedStyle === 'undefined') return { r: 249, g: 115, b: 22 };
    const raw = getComputedStyle(canvas).getPropertyValue('--particle-color').trim();
    const match = raw.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (match) return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    return { r: 249, g: 115, b: 22 };
  }

  // Reference: how many sim-units the larger canvas dimension spans
  const simRefSize = 800;

  function resize() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvasW = rect.width;
    canvasH = rect.height;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);

    // Uniform scaling: 1 sim-unit = same pixel size in x and y
    const maxDim = Math.max(canvasW, canvasH);
    simScale = maxDim / simRefSize;
    simW = canvasW / simScale;
    simH = canvasH / simScale;

    // Update walls to match new sim dimensions
    walls = [
      { pos: { x: simW / 2, y: 10 },       normal: { x: 0, y: 1 },  halfLen: (simW - 20) / 2 },
      { pos: { x: simW / 2, y: simH - 10 }, normal: { x: 0, y: -1 }, halfLen: (simW - 20) / 2 },
      { pos: { x: 10,       y: simH / 2 },  normal: { x: 1, y: 0 },  halfLen: (simH - 20) / 2 },
      { pos: { x: simW - 10, y: simH / 2 }, normal: { x: -1, y: 0 }, halfLen: (simH - 20) / 2 },
    ];
  }

  let lastTime = 0;

  function animate(timestamp: number) {
    if (!ctx) {
      animationId = requestAnimationFrame(animate);
      return;
    }

    // Cap delta to avoid huge jumps on tab switch
    const frameDt = lastTime === 0 ? 33 : Math.min(timestamp - lastTime, 100);
    lastTime = timestamp;

    // Fade chemotaxis: active only while mouse is moving
    const timeSinceMove = timestamp - lastMouseMoveTime;
    const fadeMs = 400;
    chemoFade = Math.max(0, 1 - timeSinceMove / fadeMs);

    // Run physics
    stepSim(frameDt);

    // Handle mouse dragging in sim space
    if (dragging && dragIndex >= 0 && dragIndex < cells.length) {
      cells[dragIndex].pos.x = mouseX / simScale;
      cells[dragIndex].pos.y = mouseY / simScale;
    }

    // Draw
    ctx.clearRect(0, 0, canvasW, canvasH);
    const { r, g, b } = getParticleColor();
    const s = simScale;

    const parallaxY = scrollY * 0.3;

    // Subtle chemotaxis glow at mouse position
    if (chemoFade > 0.01 && mouseX > -999) {
      const glowRadius = 160 * s;
      const grad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, glowRadius);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.25 * chemoFade})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Adhesion bonds
    if (params.bondAlpha > 0) {
      ctx.lineWidth = 1.5 * s;
      const bondA = params.bondAlpha;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${bondA})`;
      ctx.beginPath();
      for (let i = 0; i < cells.length; i++) {
        for (let j = 0; j < i; j++) {
          if (contacts[i][j]) {
            ctx.moveTo(cells[i].pos.x * s, cells[i].pos.y * s - parallaxY);
            ctx.lineTo(cells[j].pos.x * s, cells[j].pos.y * s - parallaxY);
          }
        }
      }
      ctx.stroke();
    }

    // Cells
    for (const cell of cells) {
      const cx = cell.pos.x * s;
      const cy = cell.pos.y * s - parallaxY;

      // Soft radius (transparent)
      ctx.beginPath();
      ctx.arc(cx, cy, cell.rSoft * s, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${params.cellAlpha * 0.25})`;
      ctx.fill();

      // Hard radius (solid)
      ctx.beginPath();
      ctx.arc(cx, cy, cell.rHard * s, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${params.cellAlpha})`;
      ctx.fill();

      // Polarity indicator: line from center toward leading edge
      if (params.polarityAlpha > 0) {
        const polMag = vMag(cell.pol);
        if (polMag > 0.01) {
          const nx = cell.pol.x / polMag;
          const ny = cell.pol.y / polMag;
          const len = cell.rHard * s * params.polarityLength;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + nx * len, cy + ny * len);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${params.polarityAlpha})`;
          ctx.lineWidth = 2.5 * s;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      // Debug: polarity line
      if (params.polarityLineAlpha > 0) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 0, 0, ${params.polarityLineAlpha})`;
        ctx.lineWidth = 1;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + cell.pol.x * cell.rSoft * s / (vMag(cell.pol) || 1), cy + cell.pol.y * cell.rSoft * s / (vMag(cell.pol) || 1));
        ctx.stroke();
      }
    }

    animationId = requestAnimationFrame(animate);
  }

  // ──────────────────────────────────────────────
  // Mouse interaction (drag cells)
  // ──────────────────────────────────────────────
  let dragging = false;
  let dragIndex = -1;

  function handleMouseMove(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    lastMouseMoveTime = performance.now();
  }

  function handleMouseDown(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const simMx = mx / simScale;
    const simMy = my / simScale;

    let bestDist = Infinity;
    let bestIdx = -1;
    for (let i = 0; i < cells.length; i++) {
      const dx = cells[i].pos.x - simMx;
      const dy = cells[i].pos.y - simMy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }

    if (bestIdx >= 0 && bestDist <= cells[bestIdx].rSoft) {
      dragging = true;
      dragIndex = bestIdx;
    }
    mouseX = mx;
    mouseY = my;
  }

  function handleMouseUp() {
    dragging = false;
    dragIndex = -1;
  }

  function handleMouseLeave() {
    mouseX = -9999;
    mouseY = -9999;
    dragging = false;
    dragIndex = -1;
  }

  function handleScroll() {
    scrollY = window.scrollY;
  }

  // ──────────────────────────────────────────────
  // Lifecycle
  // ──────────────────────────────────────────────
  onMount(() => {
    resize();
    initSim();
    animationId = requestAnimationFrame(animate);

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', handleScroll);
    };
  });
</script>

<canvas
  bind:this={canvas}
  class="hero-canvas"
  onmousemove={handleMouseMove}
  onmousedown={handleMouseDown}
  onmouseup={handleMouseUp}
  onmouseleave={handleMouseLeave}
></canvas>

<style>
  .hero-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }
</style>
