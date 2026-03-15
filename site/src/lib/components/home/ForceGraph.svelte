<script lang="ts">
  import { onMount } from 'svelte';
  import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY } from 'd3-force';
  import type { Simulation, SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
  import projects from '$lib/data/projects.yaml';
  import publications from '$lib/data/publications.yaml';
  import talks from '$lib/data/talks.yaml';
  import allowedTags from '$lib/data/tags.yaml';
  import type { Talk } from '$lib/types';

  // ── Gather blog post metadata ──
  const blogModules = import.meta.glob('/src/content/blog/*.md', { eager: true });
  const blogPosts: { slug: string; title: string; date: string }[] = [];
  for (const [path, mod] of Object.entries(blogModules)) {
    const slug = path.split('/').pop()?.replace('.md', '') || '';
    const meta = (mod as any).metadata || {};
    blogPosts.push({ slug, title: meta.title || slug, date: meta.date || '' });
  }

  // ── Node types ──
  type NodeType = 'research' | 'coding' | 'publication' | 'blog' | 'talk' | 'tag';

  interface GraphNode extends SimulationNodeDatum {
    id: string;
    label: string;
    type: NodeType;
    href?: string;
    radius: number;
    baseRadius: number;
    hidden: boolean;
    desc?: string;
  }

  interface GraphLink extends SimulationLinkDatum<GraphNode> {
    isTag: boolean;
  }

  // ── Build graph data ──
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeMap = new Map<string, GraphNode>();

  const TAG_BASE_RADIUS = 4;
  const TAG_MAX_SCALE = 4;

  function addNode(id: string, label: string, type: NodeType, href?: string, desc?: string): GraphNode {
    if (nodeMap.has(id)) return nodeMap.get(id)!;
    const radius = type === 'publication' ? 15 : type === 'coding' ? 12 : type === 'research' ? 12 : type === 'tag' ? TAG_BASE_RADIUS : 6;
    const node: GraphNode = { id, label, type, href, radius, baseRadius: radius, hidden: false, desc };
    nodes.push(node);
    nodeMap.set(id, node);
    return node;
  }

  function addLink(sourceId: string, targetId: string, isTag = false) {
    if (nodeMap.has(sourceId) && nodeMap.has(targetId)) {
      links.push({ source: sourceId, target: targetId, isTag });
    }
  }

  for (const p of projects.research) addNode(`proj:${p.slug}`, p.title, 'research', '/research', p.desc);
  for (const p of projects.coding) addNode(`proj:${p.slug}`, p.title, 'coding', '/coding', p.desc);
  const allPubs = [...publications.peer_reviewed, ...publications.preprints, ...publications.theses];
  for (const pub of allPubs) addNode(`pub:${pub.slug}`, pub.title, 'publication', `/publications#${pub.slug}`, pub.journal);
  for (const post of blogPosts) addNode(`blog:${post.slug}`, post.title, 'blog', `/blog/${post.slug}`);
  for (const talk of talks as Talk[]) addNode(`talk:${talk.slug}`, talk.title, 'talk', '/talks', talk.venue);
  const allowedTagSet = new Set<string>(allowedTags as string[]);
  for (const tag of allowedTags as string[]) addNode(`tag:${tag}`, tag, 'tag');

  for (const p of [...projects.research, ...projects.coding]) {
    for (const pubSlug of p.publications) addLink(`proj:${p.slug}`, `pub:${pubSlug}`);
    for (const blogSlug of p.blogs) addLink(`proj:${p.slug}`, `blog:${blogSlug}`);
    if (nodeMap.has(`blog:${p.slug}`)) addLink(`proj:${p.slug}`, `blog:${p.slug}`);
    for (const tag of p.tags) {
      if (allowedTagSet.has(tag)) addLink(`proj:${p.slug}`, `tag:${tag}`, true);
    }
  }
  for (const talk of talks as Talk[]) {
    for (const projSlug of talk.projects) addLink(`talk:${talk.slug}`, `proj:${projSlug}`);
    for (const tag of talk.tags || []) {
      if (allowedTagSet.has(tag)) addLink(`talk:${talk.slug}`, `tag:${tag}`, true);
    }
  }

  // ── Tag sizes (logistic growth) ──
  const tagEdgeCounts = new Map<string, number>();
  for (const link of links) {
    const sId = typeof link.source === 'string' ? link.source : (link.source as GraphNode).id;
    const tId = typeof link.target === 'string' ? link.target : (link.target as GraphNode).id;
    if (sId.startsWith('tag:')) tagEdgeCounts.set(sId, (tagEdgeCounts.get(sId) || 0) + 1);
    if (tId.startsWith('tag:')) tagEdgeCounts.set(tId, (tagEdgeCounts.get(tId) || 0) + 1);
  }
  const counts = [...tagEdgeCounts.values()];
  const tagMidpoint = counts.length > 0 ? counts.sort((a, b) => a - b)[Math.floor(counts.length / 2)] : 3;
  for (const node of nodes) {
    if (node.type !== 'tag') continue;
    const edgeCount = tagEdgeCounts.get(node.id) || 0;
    const logistic = 1 / (1 + Math.exp(-0.5 * (edgeCount - tagMidpoint)));
    node.radius = TAG_BASE_RADIUS * (1 + (TAG_MAX_SCALE - 1) * logistic);
    node.baseRadius = node.radius;
  }

  // ── Adjacency map ──
  const adjacency = new Map<string, Set<string>>();
  for (const node of nodes) adjacency.set(node.id, new Set());
  for (const link of links) {
    const sId = typeof link.source === 'string' ? link.source : (link.source as GraphNode).id;
    const tId = typeof link.target === 'string' ? link.target : (link.target as GraphNode).id;
    adjacency.get(sId)?.add(tId);
    adjacency.get(tId)?.add(sId);
  }

  function getNeighborIds(nodeId: string): Set<string> {
    return adjacency.get(nodeId) || new Set();
  }

  // ── Canvas state ──
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let sim: Simulation<GraphNode, GraphLink>;
  let width = 0;
  let height = 0;

  // ── Controls state ──
  let linkStrength = $state(0.5);
  let repulsion = $state(80);
  let centerForce = $state(0.1);
  let showControls = $state(false);

  let visibility: Record<NodeType, boolean> = $state({
    research: true, coding: true, publication: true, blog: true, talk: true, tag: true,
  });

  function updateVisibility() {
    for (const node of nodes) node.hidden = !visibility[node.type];
    if (sim) sim.alpha(0.5).restart();
  }

  function updateForces() {
    if (!sim) return;
    (sim.force('link') as any)?.strength((d: any) => d.isTag ? linkStrength * 0.5 : linkStrength);
    (sim.force('charge') as any)?.strength((d: any) => -repulsion * (d.radius / 6));
    (sim.force('x') as any)?.strength(centerForce);
    (sim.force('y') as any)?.strength(centerForce);
    sim.alpha(0.3).restart();
  }

  // ── Camera ──
  let camX = 0, camY = 0, zoom = 1;

  function screenToWorld(sx: number, sy: number) {
    return { x: (sx - width / 2) / zoom + camX, y: (sy - height / 2) / zoom + camY };
  }
  function worldToScreen(wx: number, wy: number) {
    return { x: (wx - camX) * zoom + width / 2, y: (wy - camY) * zoom + height / 2 };
  }

  function fitToView() {
    if (nodes.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) {
      if (n.hidden) continue;
      const x = n.x || 0, y = n.y || 0, r = n.radius;
      if (x - r < minX) minX = x - r; if (x + r > maxX) maxX = x + r;
      if (y - r < minY) minY = y - r; if (y + r > maxY) maxY = y + r;
    }
    if (minX === Infinity) return;
    const pad = 50;
    camX = (minX + maxX) / 2; camY = (minY + maxY) / 2;
    zoom = Math.min(width / (maxX - minX + pad * 2), height / (maxY - minY + pad * 2), 2);
    zoom = Math.max(0.1, zoom);
  }

  // ── Selection: hover OR auto-focus ──
  let hoveredNode: GraphNode | null = $state(null);
  let autoFocusNode: GraphNode | null = $state(null);
  let autoFocusTimer = 0;
  const AUTO_FOCUS_INTERVAL = 5; // seconds

  // The "selected" node is hover (priority) or auto-focus
  let selectedNode: GraphNode | null = $derived(hoveredNode || autoFocusNode);

  function pickRandomNode(): GraphNode | null {
    const visible = nodes.filter(n => !n.hidden && n.type !== 'tag');
    if (visible.length === 0) return null;
    return visible[Math.floor(Math.random() * visible.length)];
  }

  // ── Interaction state ──
  let draggedNode: GraphNode | null = null;
  let dragStartX = 0, dragStartY = 0, dragDistance = 0;
  let isPanning = false;
  let panStartX = 0, panStartY = 0, panStartCamX = 0, panStartCamY = 0;

  // Resolved at runtime for canvas compatibility
  let resolvedAccent = '#f97316';
  let resolvedSecondary = '#a3e635';

  function resolveThemeColors() {
    if (typeof getComputedStyle === 'undefined' || !canvas) return;
    const s = getComputedStyle(canvas);
    resolvedAccent = s.getPropertyValue('--accent').trim() || '#f97316';
    resolvedSecondary = s.getPropertyValue('--accent-secondary').trim() || '#a3e635';
  }

  function getTypeColors(): Record<NodeType, string> {
    return {
      tag: resolvedAccent,
      research: resolvedSecondary,
      coding: '#38bdf8',        // sky blue
      publication: '#a78bfa',   // violet
      blog: '#f472b6',          // pink
      talk: '#fbbf24',          // amber
    };
  }
  const typeLabels: Record<NodeType, string> = {
    research: 'Research', coding: 'Software', publication: 'Publication',
    blog: 'Blog', talk: 'Talk', tag: 'Tag',
  };

  function nodeColor(type: NodeType) { return getTypeColors()[type]; }

  function findNodeAt(wx: number, wy: number): GraphNode | null {
    const hitBonus = Math.max(4, 6 / zoom);
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (n.hidden) continue;
      const dx = (n.x || 0) - wx, dy = (n.y || 0) - wy;
      if (dx * dx + dy * dy < (n.radius + hitBonus) ** 2) return n;
    }
    return null;
  }

  function canvasCoords(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    return { sx: e.clientX - rect.left, sy: e.clientY - rect.top };
  }

  // ── Mouse handlers ──
  function handleMouseMove(e: MouseEvent) {
    const { sx, sy } = canvasCoords(e);
    const world = screenToWorld(sx, sy);
    if (draggedNode) {
      draggedNode.fx = world.x; draggedNode.fy = world.y;
      dragDistance = Math.sqrt((sx - dragStartX) ** 2 + (sy - dragStartY) ** 2);
      sim.alpha(0.3).restart(); return;
    }
    if (isPanning) {
      camX = panStartCamX - (sx - panStartX) / zoom;
      camY = panStartCamY - (sy - panStartY) / zoom;
      return;
    }
    const found = findNodeAt(world.x, world.y);
    hoveredNode = found;
    canvas.style.cursor = found ? 'pointer' : 'grab';
  }

  function handleMouseDown(e: MouseEvent) {
    const { sx, sy } = canvasCoords(e);
    const world = screenToWorld(sx, sy);
    const found = findNodeAt(world.x, world.y);
    if (found) {
      draggedNode = found; found.fx = world.x; found.fy = world.y;
      dragStartX = sx; dragStartY = sy; dragDistance = 0;
      hoveredNode = found;
      sim.alphaTarget(0.3).restart();
    } else {
      isPanning = true; panStartX = sx; panStartY = sy;
      panStartCamX = camX; panStartCamY = camY;
      canvas.style.cursor = 'grabbing';
    }
  }

  function handleMouseUp() {
    if (draggedNode) {
      const wasDragged = dragDistance > 50;
      const node = draggedNode;
      draggedNode.fx = null; draggedNode.fy = null;
      sim.alphaTarget(0); draggedNode = null;
      if (node?.href && !wasDragged) window.location.href = node.href;
    }
    if (isPanning) { isPanning = false; canvas.style.cursor = 'grab'; }
  }

  function handleMouseLeave() {
    hoveredNode = null; canvas.style.cursor = 'default';
    if (draggedNode) { draggedNode.fx = null; draggedNode.fy = null; sim.alphaTarget(0); draggedNode = null; }
    isPanning = false;
  }

  // ── Touch support ──
  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0]; const rect = canvas.getBoundingClientRect();
    const sx = touch.clientX - rect.left, sy = touch.clientY - rect.top;
    const world = screenToWorld(sx, sy); const found = findNodeAt(world.x, world.y);
    if (found) {
      e.preventDefault(); draggedNode = found; found.fx = world.x; found.fy = world.y;
      dragStartX = sx; dragStartY = sy; dragDistance = 0; hoveredNode = found;
      sim.alphaTarget(0.3).restart();
    } else {
      isPanning = true; panStartX = sx; panStartY = sy; panStartCamX = camX; panStartCamY = camY;
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0]; const rect = canvas.getBoundingClientRect();
    const sx = touch.clientX - rect.left, sy = touch.clientY - rect.top;
    if (draggedNode) {
      e.preventDefault(); const world = screenToWorld(sx, sy);
      draggedNode.fx = world.x; draggedNode.fy = world.y;
      dragDistance = Math.sqrt((sx - dragStartX) ** 2 + (sy - dragStartY) ** 2);
    } else if (isPanning) {
      e.preventDefault();
      camX = panStartCamX - (sx - panStartX) / zoom;
      camY = panStartCamY - (sy - panStartY) / zoom;
    }
  }

  function handleTouchEnd() {
    if (draggedNode) {
      if (hoveredNode?.href && dragDistance <= 50) window.location.href = hoveredNode.href;
      draggedNode.fx = null; draggedNode.fy = null; sim.alphaTarget(0); draggedNode = null;
    }
    isPanning = false; hoveredNode = null;
  }

  // ── Slow noise drift ──
  const noisePhases: { px: number; py: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    noisePhases.push({ px: Math.random() * Math.PI * 200, py: Math.random() * Math.PI * 200 });
  }

  function applyNoiseDrift(now: number) {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.fx != null || n.fy != null || n.hidden) continue;
      const t = now * 0.0375;
      n.vx = (n.vx || 0) + Math.sin(t + noisePhases[i].px) * 0.016;
      n.vy = (n.vy || 0) + Math.cos(t + noisePhases[i].py) * 0.016;
    }
  }

  // ── Tag labels for selected node (screen-space info) ──
  interface TagLabel {
    label: string;
    screenX: number;
    screenY: number;
    align: 'left' | 'right';
  }
  let tagLabels: TagLabel[] = $state([]);

  let lastDrawTime = 0;

  // ── Rendering ──
  function draw() {
    if (!ctx) return;
    resolveThemeColors();

    // Auto-focus timer (real dt)
    const now = performance.now() / 1000;
    const dt = lastDrawTime === 0 ? 0 : Math.min(now - lastDrawTime, 0.1);
    lastDrawTime = now;

    if (!hoveredNode && !draggedNode) {
      autoFocusTimer += dt;
      if (autoFocusTimer >= AUTO_FOCUS_INTERVAL || !autoFocusNode) {
        autoFocusNode = pickRandomNode();
        autoFocusTimer = 0;
      }
    } else {
      autoFocusTimer = 0;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-camX, -camY);

    const sel = isPanning ? null : (draggedNode || hoveredNode || autoFocusNode);
    const hasSel = sel !== null && !sel.hidden;
    const neighborIds = hasSel ? getNeighborIds(sel!.id) : new Set<string>();

    // ── Links ──
    for (const link of links) {
      const s = link.source as GraphNode, t = link.target as GraphNode;
      if (s.hidden || t.hidden) continue;
      const connectedToSel = hasSel && (s.id === sel!.id || t.id === sel!.id);
      ctx.beginPath();
      ctx.moveTo(s.x || 0, s.y || 0);
      ctx.lineTo(t.x || 0, t.y || 0);
      if (connectedToSel) {
        const other = s.id === sel!.id ? t : s;
        ctx.strokeStyle = nodeColor(other.type);
        ctx.lineWidth = 2.5 / zoom;
        ctx.globalAlpha = 0.6;
      } else {
        ctx.strokeStyle = hasSel ? `rgba(148, 163, 184, 0.08)` : `rgba(148, 163, 184, 0.25)`;
        ctx.lineWidth = 1.5 / zoom;
        ctx.globalAlpha = 1;
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // ── Nodes ──
    function drawNode(node: GraphNode) {
      const x = node.x || 0, y = node.y || 0;
      const isSel = node.id === sel?.id;
      const isNeighbor = hasSel && neighborIds.has(node.id);
      const isDimmed = hasSel && !isSel && !isNeighbor;
      const r = isSel ? node.radius + 3 : node.radius;
      const color = nodeColor(node.type);

      if (isSel) {
        ctx.beginPath();
        ctx.arc(x, y, r + 8, 0, Math.PI * 2);
        ctx.fillStyle = color + '30';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = isDimmed ? color + '33' : (isSel || isNeighbor) ? color : color + 'aa';
      ctx.fill();

      if (isSel) {
        ctx.beginPath();
        ctx.arc(x, y, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5 / zoom;
        ctx.stroke();
      }
      if (isNeighbor && !isSel) {
        ctx.beginPath();
        ctx.arc(x, y, r + 2, 0, Math.PI * 2);
        ctx.strokeStyle = color + '55';
        ctx.lineWidth = 1 / zoom;
        ctx.stroke();
      }
    }

    for (const node of nodes) {
      if (node.hidden || node.id === sel?.id) continue;
      drawNode(node);
    }
    if (sel && !sel.hidden) drawNode(sel);

    ctx.restore();

    // ── Compute tag labels for selected node ──
    const newTagLabels: TagLabel[] = [];
    if (hasSel) {
      const selScreen = worldToScreen(sel!.x || 0, sel!.y || 0);
      for (const nId of neighborIds) {
        const neighbor = nodeMap.get(nId);
        if (!neighbor || neighbor.hidden || neighbor.type !== 'tag') continue;
        const scr = worldToScreen(neighbor.x || 0, neighbor.y || 0);
        const align = scr.x < selScreen.x ? 'right' : 'left';
        newTagLabels.push({
          label: neighbor.label,
          screenX: scr.x,
          screenY: scr.y,
          align,
        });
      }
    }
    tagLabels = newTagLabels;
  }

  function getColors() {
    if (typeof getComputedStyle === 'undefined' || !canvas) {
      return { accent: '#f97316', text: '#f0f0f0', muted: '#94a3b8', bg: '#0c1222' };
    }
    const style = getComputedStyle(canvas);
    return {
      accent: style.getPropertyValue('--accent').trim() || '#f97316',
      text: style.getPropertyValue('--text').trim() || '#f0f0f0',
      muted: style.getPropertyValue('--text-muted').trim() || '#94a3b8',
      bg: style.getPropertyValue('--bg').trim() || '#0c1222',
    };
  }

  // ── Setup ──
  function resize() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    canvas.width = width * dpr; canvas.height = height * dpr;
    ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
    if (sim) sim.alpha(0.1).restart();
  }

  let hasFittedOnce = false;

  onMount(() => {
    resize();

    sim = forceSimulation<GraphNode>(nodes)
      .force('link', forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id).distance(45)
        .strength((d: GraphLink) => d.isTag ? linkStrength * 0.5 : linkStrength))
      .force('charge', forceManyBody()
        .strength(d => -repulsion * ((d as GraphNode).radius / 6)))
      .force('collide', forceCollide<GraphNode>().radius(d => d.radius + 2))
      .force('center', forceCenter(0, 0))
      .force('x', forceX(0).strength(centerForce))
      .force('y', forceY(0).strength(centerForce))
      .alphaDecay(0.02)
      .on('tick', () => {
        if (!hasFittedOnce || sim.alpha() > 0.5) fitToView();
        if (sim.alpha() < 0.05 && !hasFittedOnce) {
          fitToView(); hasFittedOnce = true;
          autoFocusNode = pickRandomNode();
        }
        draw();
      });

    fitToView();

    let animId: number;
    function animLoop() {
      if (document.hidden) { animId = requestAnimationFrame(animLoop); return; }
      const now = performance.now() / 1000;
      applyNoiseDrift(now);
      if (sim.alpha() < 0.01) sim.alpha(0.01).restart();
      draw();
      animId = requestAnimationFrame(animLoop);
    }
    animId = requestAnimationFrame(animLoop);

    const onResize = () => { resize(); fitToView(); };
    window.addEventListener('resize', onResize);

    return () => { sim.stop(); cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
  });

  const allTypes: NodeType[] = ['research', 'coding', 'publication', 'blog', 'talk', 'tag'];
</script>

<div class="force-graph-outer">
  <div class="force-graph-wrap">
    <!-- Controls (desktop only) -->
    <div class="controls-bar">
      <button class="controls-toggle" onclick={() => showControls = !showControls}>
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        {showControls ? 'Hide' : 'Controls'}
      </button>
      {#if showControls}
        <div class="controls-panel">
          <div class="controls-section">
            <span class="controls-label">Categories</span>
            <div class="controls-toggles">
              {#each allTypes as type}
                <button class="cat-btn" class:cat-btn--off={!visibility[type]}
                  onclick={() => { visibility[type] = !visibility[type]; updateVisibility(); }}>
                  <span class="cat-dot" style="background: {getTypeColors()[type]}; {!visibility[type] ? 'opacity: 0.3;' : ''}"></span>
                  {typeLabels[type]}
                </button>
              {/each}
            </div>
          </div>
          <div class="controls-divider"></div>
          <button class="controls-toggle randomize-btn" onclick={() => {
            for (const n of nodes) { n.x = (Math.random() - 0.5) * 400; n.y = (Math.random() - 0.5) * 400; n.vx = 0; n.vy = 0; }
            hasFittedOnce = false; sim.alpha(1).restart();
          }}>Randomize</button>
          <div class="controls-divider"></div>
          <div class="controls-section">
            <span class="controls-label">Forces</span>
            <div class="controls-sliders">
              <label class="slider-row"><span class="slider-name">Links</span>
                <input type="range" min="0.01" max="1.0" step="0.01" bind:value={linkStrength} oninput={() => updateForces()} />
                <span class="slider-val">{linkStrength.toFixed(2)}</span></label>
              <label class="slider-row"><span class="slider-name">Repulsion</span>
                <input type="range" min="5" max="200" step="1" bind:value={repulsion} oninput={() => updateForces()} />
                <span class="slider-val">{repulsion}</span></label>
              <label class="slider-row"><span class="slider-name">Center</span>
                <input type="range" min="0.01" max="0.5" step="0.01" bind:value={centerForce} oninput={() => updateForces()} />
                <span class="slider-val">{centerForce.toFixed(2)}</span></label>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Legend (top-left, clickable) -->
    <div class="legend">
      {#each allTypes as type}
        <button class="legend-item" class:legend-item--off={!visibility[type]}
          onclick={() => { visibility[type] = !visibility[type]; updateVisibility(); }}>
          <span class="legend-dot" style="background: {getTypeColors()[type]}; {!visibility[type] ? 'opacity: 0.3;' : ''}"></span>
          {typeLabels[type]}
        </button>
      {/each}
    </div>

    <canvas bind:this={canvas} class="force-graph-canvas"
      onmousemove={handleMouseMove} onmousedown={handleMouseDown}
      onmouseup={handleMouseUp} onmouseleave={handleMouseLeave}
      ontouchstart={handleTouchStart} ontouchmove={handleTouchMove}
      ontouchend={handleTouchEnd}></canvas>

    <!-- Tag labels next to tag nodes -->
    {#each tagLabels as tl}
      <span class="tag-label"
        style="left: {tl.screenX}px; top: {tl.screenY}px;
          transform: translate({tl.align === 'left' ? 'calc(8px)' : 'calc(-100% - 8px)'}, -50%);
          text-align: {tl.align};">
        {tl.label}
      </span>
    {/each}

  </div>

  <!-- Detail panel (strictly below graph) -->
  <div class="detail-panel">
    {#if selectedNode}
      <div class="detail-content">
        <span class="detail-type" style="color: {getTypeColors()[selectedNode.type]};">
          {typeLabels[selectedNode.type]}
        </span>
        {#if selectedNode.href}
          <a href={selectedNode.href} class="detail-title detail-title--link">
            {selectedNode.label}
          </a>
        {:else}
          <span class="detail-title">{selectedNode.label}</span>
        {/if}
        {#if selectedNode.desc}
          <span class="detail-desc">{selectedNode.desc}</span>
        {/if}
      </div>
    {:else}
      <div class="detail-content">
        <span class="detail-desc">Hover over a node to explore</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .force-graph-outer { display: flex; flex-direction: column; gap: 0; }

  .force-graph-wrap {
    position: relative; width: 100%; height: 70vh;
    min-height: 400px; max-height: 800px;
    border-radius: 12px 12px 0 0;
    border: 1px solid var(--bg-card-border); border-bottom: none;
    background: var(--bg-card); overflow: hidden;
  }
  .force-graph-canvas { width: 100%; height: 100%; display: block; cursor: grab; }

  /* ─── Detail panel (below graph) ─── */
  .detail-panel {
    height: 7.5rem;
    background: var(--bg-card);
    border: 1px solid var(--bg-card-border); border-top: none;
    border-radius: 0 0 12px 12px;
    box-shadow: var(--shadow-card);
    padding: 1rem 1.25rem;
    display: flex; align-items: flex-start;
  }
  .detail-content { display: flex; flex-direction: column; gap: 0.25rem; }
  .detail-type {
    font-family: var(--font-display); font-size: 0.6rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.1em;
  }
  .detail-title {
    font-family: var(--font-display); font-size: 0.95rem; font-weight: 600;
    color: var(--text); line-height: 1.3;
  }
  .detail-title--link {
    text-decoration: none; cursor: pointer;
    transition: color 0.2s;
  }
  .detail-title--link:hover { color: var(--accent); }
  .detail-desc {
    font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;
  }

  /* ─── Tag labels ─── */
  .tag-label {
    position: absolute;
    font-family: var(--font-display); font-size: 0.7rem; font-weight: 600;
    color: var(--accent); white-space: nowrap;
    pointer-events: none; z-index: 10;
    background: color-mix(in srgb, var(--bg) 70%, transparent);
    backdrop-filter: blur(4px);
    padding: 0.1rem 0.35rem; border-radius: 3px;
    letter-spacing: 0.02em;
  }

  /* ─── Legend ─── */
  .legend {
    position: absolute; top: 0.75rem; left: 0.75rem;
    display: flex; flex-direction: column; gap: 0.2rem;
    font-size: 0.7rem; font-family: var(--font-display); color: var(--text-muted);
    background: var(--bg-card); backdrop-filter: blur(12px);
    border: 1px solid var(--bg-card-border); border-radius: 6px; padding: 0.4rem 0.5rem;
    z-index: 30;
  }
  .legend-item {
    display: inline-flex; align-items: center; gap: 0.35rem;
    background: none; border: none; font: inherit; color: inherit;
    cursor: pointer; padding: 0.1rem 0.2rem; border-radius: 3px;
    transition: opacity 0.2s;
  }
  .legend-item:hover { color: var(--text); }
  .legend-item--off { opacity: 0.35; }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  /* ─── Controls ─── */
  .controls-bar { position: absolute; top: 0.75rem; right: 0.75rem; z-index: 50; display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; }
  .controls-toggle {
    display: inline-flex; align-items: center; gap: 0.35rem;
    padding: 0.3rem 0.65rem; font-family: var(--font-display);
    font-size: 0.65rem; font-weight: 500; color: var(--text-muted);
    background: var(--bg-card); backdrop-filter: blur(12px);
    border: 1px solid var(--bg-card-border); border-radius: 6px;
    cursor: pointer; transition: color 0.2s, border-color 0.2s; letter-spacing: 0.03em;
  }
  .controls-toggle:hover { color: var(--text); border-color: var(--accent); }
  .controls-panel {
    background: var(--bg-card); backdrop-filter: blur(16px);
    border: 1px solid var(--bg-card-border); border-radius: 8px;
    padding: 0.75rem; display: flex; flex-direction: column;
    gap: 0.65rem; min-width: 240px; box-shadow: var(--shadow-card);
  }
  .controls-section { display: flex; flex-direction: column; gap: 0.4rem; }
  .controls-label { font-family: var(--font-display); font-size: 0.6rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); }
  .controls-toggles { display: flex; flex-direction: column; gap: 0.25rem; }
  .cat-btn {
    display: inline-flex; align-items: center; gap: 0.25rem;
    padding: 0.2rem 0.5rem; font-family: var(--font-body);
    font-size: 0.65rem; font-weight: 500; color: var(--text);
    background: transparent; border: 1px solid var(--bg-card-border);
    border-radius: 4px; cursor: pointer; transition: opacity 0.2s, border-color 0.2s;
  }
  .cat-btn:hover { border-color: var(--accent); }
  .cat-btn--off { opacity: 0.4; }
  .cat-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .randomize-btn { width: 100%; justify-content: center; }
  .controls-divider { height: 1px; background: var(--bg-card-border); }
  .controls-sliders { display: flex; flex-direction: column; gap: 0.35rem; }
  .slider-row { display: flex; align-items: center; gap: 0.4rem; cursor: default; }
  .slider-name { font-size: 0.6rem; font-weight: 500; color: var(--text-muted); width: 52px; flex-shrink: 0; }
  .slider-row input[type="range"] {
    flex: 1; height: 3px; -webkit-appearance: none; appearance: none;
    background: var(--bg-card-border); border-radius: 2px; outline: none; cursor: pointer;
  }
  .slider-row input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; border-radius: 50%; background: var(--accent); border: none; }
  .slider-row input[type="range"]::-moz-range-thumb { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); border: none; }
  .slider-val { font-family: var(--font-display); font-size: 0.55rem; color: var(--text-muted); width: 28px; text-align: right; flex-shrink: 0; }
  @media (max-width: 768px) { .controls-bar { display: none; } }

  @media (max-width: 640px) {
    .force-graph-wrap { height: 45vh; min-height: 280px; }
  }
</style>
