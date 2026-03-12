<script lang="ts">
  import { onMount } from 'svelte';

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let animationId: number;
  let scrollY = $state(0);
  let mouseX = $state(-9999);
  let mouseY = $state(-9999);

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
  }

  const PARTICLE_COUNT = 80;
  const CONNECTION_DIST = 150;
  const MOUSE_REPEL_DIST = 120;
  const MOUSE_REPEL_FORCE = 0.8;

  let particles: Particle[] = [];
  let width = 0;
  let height = 0;

  function initParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      radius: Math.random() * 1.5 + 1
    }));
  }

  function getParticleColor(): string {
    if (typeof getComputedStyle === 'undefined') return 'rgba(100, 200, 255, 1)';
    const style = getComputedStyle(canvas);
    return style.getPropertyValue('--particle-color').trim() || 'rgba(100, 200, 255, 1)';
  }

  function parseColor(color: string): { r: number; g: number; b: number } {
    // Parse rgb/rgba or fallback
    const match = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (match) {
      return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    }
    // Try hex
    const hex = color.replace('#', '');
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      };
    }
    return { r: 100, g: 200, b: 255 };
  }

  function resize() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }

  function animate() {
    if (!ctx) {
      animationId = requestAnimationFrame(animate);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    const colorStr = getParticleColor();
    const { r, g, b } = parseColor(colorStr);

    // Parallax offset
    const parallaxOffsetY = scrollY * 0.3;

    for (const p of particles) {
      // Mouse repulsion
      const dx = p.x - mouseX;
      const dy = p.y - (mouseY + parallaxOffsetY);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_REPEL_DIST && dist > 0) {
        const force = (MOUSE_REPEL_DIST - dist) / MOUSE_REPEL_DIST * MOUSE_REPEL_FORCE;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }

      // Damping
      p.vx *= 0.98;
      p.vy *= 0.98;

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;
    }

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const pi = particles[i];
        const pj = particles[j];
        const dx = pi.x - pj.x;
        const dy = pi.y - pj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DIST) {
          const alpha = (1 - dist / CONNECTION_DIST) * 0.35;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.moveTo(pi.x, pi.y - parallaxOffsetY);
          ctx.lineTo(pj.x, pj.y - parallaxOffsetY);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y - parallaxOffsetY, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.7)`;
      ctx.fill();
    }

    animationId = requestAnimationFrame(animate);
  }

  function handleScroll() {
    scrollY = window.scrollY;
  }

  function handleMouseMove(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }

  function handleMouseLeave() {
    mouseX = -9999;
    mouseY = -9999;
  }

  onMount(() => {
    resize();
    initParticles();
    animate();

    window.addEventListener('resize', () => {
      resize();
    });
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
