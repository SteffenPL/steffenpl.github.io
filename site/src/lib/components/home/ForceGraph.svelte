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

  // ── Node types and colors ──
  type NodeType = 'research' | 'coding' | 'publication' | 'blog' | 'talk' | 'tag';

  interface GraphNode extends SimulationNodeDatum {
    id: string;
    label: string;
    type: NodeType;
    href?: string;
    radius: number;
    baseRadius: number;
    hidden: boolean;
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

  function addNode(id: string, label: string, type: NodeType, href?: string): GraphNode {
    if (nodeMap.has(id)) return nodeMap.get(id)!;
    const radius = type === 'publication' ? 15 : type === 'coding' ? 12 : type === 'research' ? 12 : type === 'tag' ? TAG_BASE_RADIUS : 6;
    const node: GraphNode = { id, label, type, href, radius, baseRadius: radius, hidden: false };
    nodes.push(node);
    nodeMap.set(id, node);
    return node;
  }

  function addLink(sourceId: string, targetId: string, isTag = false) {
    if (nodeMap.has(sourceId) && nodeMap.has(targetId)) {
      links.push({ source: sourceId, target: targetId, isTag });
    }
  }

  // Research projects
  for (const p of projects.research) addNode(`proj:${p.slug}`, p.title, 'research', '/research');
  // Coding projects
  for (const p of projects.coding) addNode(`proj:${p.slug}`, p.title, 'coding', '/coding');
  // Publications
  const allPubs = [...publications.peer_reviewed, ...publications.preprints, ...publications.theses];
  for (const pub of allPubs) addNode(`pub:${pub.slug}`, pub.title, 'publication', `/publications#${pub.slug}`);
  // Blog posts
  for (const post of blogPosts) addNode(`blog:${post.slug}`, post.title, 'blog', `/blog/${post.slug}`);
  // Talks
  for (const talk of talks as Talk[]) addNode(`talk:${talk.slug}`, talk.title, 'talk', '/talks');
  // Tags
  const allowedTagSet = new Set<string>(allowedTags as string[]);
  for (const tag of allowedTags as string[]) addNode(`tag:${tag}`, tag, 'tag');

  // ── Edges ──
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
  const tagK = 0.5;
  for (const node of nodes) {
    if (node.type !== 'tag') continue;
    const edgeCount = tagEdgeCounts.get(node.id) || 0;
    const logistic = 1 / (1 + Math.exp(-tagK * (edgeCount - tagMidpoint)));
    const scale = 1 + (TAG_MAX_SCALE - 1) * logistic;
    node.radius = TAG_BASE_RADIUS * scale;
    node.baseRadius = node.radius;
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
    research: true,
    coding: true,
    publication: true,
    blog: true,
    talk: true,
    tag: true,
  });

  function updateVisibility() {
    for (const node of nodes) {
      node.hidden = !visibility[node.type];
    }
    if (sim) {
      sim.alpha(0.5).restart();
    }
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
  let camX = 0;
  let camY = 0;
  let zoom = 1;

  function screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - width / 2) / zoom + camX,
      y: (sy - height / 2) / zoom + camY,
    };
  }

  function fitToView() {
    if (nodes.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) {
      if (n.hidden) continue;
      const x = n.x || 0, y = n.y || 0, r = n.radius;
      if (x - r < minX) minX = x - r;
      if (x + r > maxX) maxX = x + r;
      if (y - r < minY) minY = y - r;
      if (y + r > maxY) maxY = y + r;
    }
    if (minX === Infinity) return;
    const padding = 50;
    const graphW = maxX - minX + padding * 2;
    const graphH = maxY - minY + padding * 2;
    camX = (minX + maxX) / 2;
    camY = (minY + maxY) / 2;
    zoom = Math.min(width / graphW, height / graphH, 2);
    zoom = Math.max(0.1, zoom);
  }

  // Interaction state
  let hoveredNode: GraphNode | null = $state(null);
  let draggedNode: GraphNode | null = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragDistance = 0;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let panStartCamX = 0;
  let panStartCamY = 0;

  const typeColors: Record<NodeType, string> = {
    research: '#f97316',
    coding: '#a3e635',
    publication: '#60a5fa',
    blog: '#c084fc',
    talk: '#fb923c',
    tag: '#94a3b8',
  };

  function nodeColor(type: NodeType): string {
    return typeColors[type];
  }

  function findNodeAt(wx: number, wy: number): GraphNode | null {
    const hitBonus = Math.max(4, 6 / zoom);
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (n.hidden) continue;
      const dx = (n.x || 0) - wx;
      const dy = (n.y || 0) - wy;
      const hitRadius = n.radius + hitBonus;
      if (dx * dx + dy * dy < hitRadius * hitRadius) return n;
    }
    return null;
  }

  function canvasCoords(e: MouseEvent): { sx: number; sy: number } {
    const rect = canvas.getBoundingClientRect();
    return { sx: e.clientX - rect.left, sy: e.clientY - rect.top };
  }

  // ── Mouse handlers ──
  function handleMouseMove(e: MouseEvent) {
    const { sx, sy } = canvasCoords(e);
    const world = screenToWorld(sx, sy);
    if (draggedNode) {
      draggedNode.fx = world.x;
      draggedNode.fy = world.y;
      dragDistance = Math.sqrt((sx - dragStartX) ** 2 + (sy - dragStartY) ** 2);
      sim.alpha(0.3).restart();
      return;
    }
    if (isPanning) {
      const dx = (sx - panStartX) / zoom;
      const dy = (sy - panStartY) / zoom;
      camX = panStartCamX - dx;
      camY = panStartCamY - dy;
      draw();
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
      draggedNode = found;
      found.fx = world.x;
      found.fy = world.y;
      dragStartX = sx;
      dragStartY = sy;
      dragDistance = 0;
      sim.alphaTarget(0.3).restart();
    } else {
      isPanning = true;
      panStartX = sx;
      panStartY = sy;
      panStartCamX = camX;
      panStartCamY = camY;
      canvas.style.cursor = 'grabbing';
    }
  }

  function handleMouseUp() {
    if (draggedNode) {
      const wasDragged = dragDistance > 50;
      const node = draggedNode;
      draggedNode.fx = null;
      draggedNode.fy = null;
      sim.alphaTarget(0);
      draggedNode = null;
      if (node?.href && !wasDragged) window.location.href = node.href;
    }
    if (isPanning) {
      isPanning = false;
      canvas.style.cursor = 'grab';
    }
  }

  function handleMouseLeave() {
    hoveredNode = null;
    canvas.style.cursor = 'default';
    if (draggedNode) {
      draggedNode.fx = null;
      draggedNode.fy = null;
      sim.alphaTarget(0);
      draggedNode = null;
    }
    isPanning = false;
  }

  // ── Touch support ──
  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const sx = touch.clientX - rect.left;
    const sy = touch.clientY - rect.top;
    const world = screenToWorld(sx, sy);
    const found = findNodeAt(world.x, world.y);
    if (found) {
      e.preventDefault();
      draggedNode = found;
      found.fx = world.x;
      found.fy = world.y;
      dragStartX = sx;
      dragStartY = sy;
      dragDistance = 0;
      hoveredNode = found;
      sim.alphaTarget(0.3).restart();
    } else {
      isPanning = true;
      panStartX = sx;
      panStartY = sy;
      panStartCamX = camX;
      panStartCamY = camY;
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const sx = touch.clientX - rect.left;
    const sy = touch.clientY - rect.top;
    if (draggedNode) {
      e.preventDefault();
      const world = screenToWorld(sx, sy);
      draggedNode.fx = world.x;
      draggedNode.fy = world.y;
      dragDistance = Math.sqrt((sx - dragStartX) ** 2 + (sy - dragStartY) ** 2);
    } else if (isPanning) {
      e.preventDefault();
      const dx = (sx - panStartX) / zoom;
      const dy = (sy - panStartY) / zoom;
      camX = panStartCamX - dx;
      camY = panStartCamY - dy;
      draw();
    }
  }

  function handleTouchEnd() {
    if (draggedNode) {
      const wasDragged = dragDistance > 50;
      if (hoveredNode?.href && !wasDragged) window.location.href = hoveredNode.href;
      draggedNode.fx = null;
      draggedNode.fy = null;
      sim.alphaTarget(0);
      draggedNode = null;
    }
    isPanning = false;
    hoveredNode = null;
  }

  // ── Slow noise drift ──
  const noisePhases: { px: number; py: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    noisePhases.push({ px: Math.random() * Math.PI * 200, py: Math.random() * Math.PI * 200 });
  }
  const NOISE_SPEED = 0.0375;
  const NOISE_AMOUNT = 0.016;

  function applyNoiseDrift(now: number) {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.fx != null || n.fy != null || n.hidden) continue;
      const t = now * NOISE_SPEED;
      n.vx = (n.vx || 0) + Math.sin(t + noisePhases[i].px) * NOISE_AMOUNT;
      n.vy = (n.vy || 0) + Math.cos(t + noisePhases[i].py) * NOISE_AMOUNT;
    }
  }

  // ── Tag label rotation system ──
  const TAG_FONT_SIZE = 18;
  const NUM_VISIBLE_TAGS = 5;
  const TAG_MAX_AGE = 10;

  interface TagSlot {
    node: GraphNode;
    age: number;
    opacity: number;
    fading: boolean;
  }

  const tagNodes = nodes.filter(n => n.type === 'tag');
  let tagSlots: TagSlot[] = [];
  let usedTagIds = new Set<string>();
  let lastTickTime = 0;

  function tagScreenRect(node: GraphNode): { x: number; y: number; w: number; h: number } {
    const wx = node.x || 0;
    const wy = (node.y || 0) + node.radius + 2;
    const w = node.label.length * TAG_FONT_SIZE * 0.55;
    const h = TAG_FONT_SIZE * 1.3;
    return { x: wx - w / (2 * zoom), y: wy, w: w / zoom, h: h / zoom };
  }

  function rectsOverlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
    return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
  }

  function pickOverlapFreeTag(): GraphNode | null {
    const currentRects = tagSlots.map(s => tagScreenRect(s.node));
    const candidates = tagNodes.filter(n => !usedTagIds.has(n.id) && !n.hidden);
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    for (const candidate of candidates) {
      const rect = tagScreenRect(candidate);
      let overlaps = false;
      for (const existing of currentRects) {
        if (rectsOverlap(rect, existing)) { overlaps = true; break; }
      }
      if (!overlaps) return candidate;
    }
    return candidates[0] || null;
  }

  function initTagSlots() {
    tagSlots = [];
    usedTagIds.clear();
    for (let i = 0; i < Math.min(NUM_VISIBLE_TAGS, tagNodes.length); i++) {
      const node = pickOverlapFreeTag();
      if (node) {
        tagSlots.push({ node, age: i * 2, opacity: 1, fading: false });
        usedTagIds.add(node.id);
      }
    }
  }

  function updateTagSlots(dt: number) {
    for (const slot of tagSlots) {
      slot.age += dt;
      if (!slot.fading && slot.age >= TAG_MAX_AGE) slot.fading = true;
      if (slot.fading) {
        slot.opacity = Math.max(0, slot.opacity - dt);
        if (slot.opacity <= 0) {
          usedTagIds.delete(slot.node.id);
          const newNode = pickOverlapFreeTag();
          if (newNode) { slot.node = newNode; usedTagIds.add(newNode.id); }
          slot.age = 0;
          slot.opacity = 0;
          slot.fading = false;
        }
      } else if (slot.opacity < 1) {
        slot.opacity = Math.min(1, slot.opacity + dt);
      }
    }
  }

  // ── Rendering ──
  function draw() {
    if (!ctx) return;
    const colors = getColors();

    const now = performance.now() / 1000;
    const dt = lastTickTime === 0 ? 0 : Math.min(now - lastTickTime, 0.1);
    lastTickTime = now;
    if (tagSlots.length > 0 && visibility.tag) updateTagSlots(dt);

    const activeTagMap = new Map<string, number>();
    for (const slot of tagSlots) {
      if (slot.opacity > 0 && !slot.node.hidden) activeTagMap.set(slot.node.id, slot.opacity);
    }

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-camX, -camY);

    // Draw links
    ctx.strokeStyle = `rgba(148, 163, 184, 0.25)`;
    ctx.lineWidth = 1.5 / zoom;
    for (const link of links) {
      const s = link.source as GraphNode;
      const t = link.target as GraphNode;
      if (s.hidden || t.hidden) continue;
      ctx.beginPath();
      ctx.moveTo(s.x || 0, s.y || 0);
      ctx.lineTo(t.x || 0, t.y || 0);
      ctx.stroke();
    }

    // Draw nodes
    for (const node of nodes) {
      if (node.hidden) continue;
      const x = node.x || 0;
      const y = node.y || 0;
      const isHovered = node === hoveredNode;
      const tagOpacity = activeTagMap.get(node.id);
      const isActiveTag = tagOpacity !== undefined && tagOpacity > 0;
      const r = isHovered ? node.radius + 2 : node.radius;
      const color = nodeColor(node.type);

      if (isActiveTag) {
        const glowAlpha = Math.round(tagOpacity * 60).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(x, y, r + 5, 0, Math.PI * 2);
        ctx.fillStyle = color + glowAlpha;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = isHovered || isActiveTag ? color : color + 'aa';
      ctx.fill();

      if (isHovered) {
        ctx.beginPath();
        ctx.arc(x, y, r + 3, 0, Math.PI * 2);
        ctx.strokeStyle = color + '66';
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();
      }
    }

    // Tag labels: place near node but pushed outward from center
    const newTagInfos: TagLabelInfo[] = [];
    if (visibility.tag) {
      const margin = 60; // min distance label is pushed from node
      const labelOffset = 80; // how far label sits from node

      for (const slot of tagSlots) {
        if (slot.opacity <= 0 || slot.node.hidden) continue;
        const node = slot.node;
        const nx = node.x || 0;
        const ny = node.y || 0;

        // Node screen position
        const snx = (nx - camX) * zoom + width / 2;
        const sny = (ny - camY) * zoom + height / 2;

        // Direction from center of canvas outward
        let dx = snx - width / 2;
        let dy = sny - height / 2;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        dx /= dist;
        dy /= dist;

        // Place label offset away from node, along the outward direction
        let lx = snx + dx * labelOffset;
        let ly = sny + dy * labelOffset;

        // Clamp to canvas bounds with padding
        lx = Math.max(margin, Math.min(width - margin, lx));
        ly = Math.max(24, Math.min(height - 24, ly));

        const align = lx > snx ? 'left' : 'right';

        newTagInfos.push({
          label: node.label,
          opacity: slot.opacity,
          nodeScreenX: snx,
          nodeScreenY: sny,
          labelX: lx,
          labelY: ly,
          align,
        });

        // Draw curved arrow from label to node (screen space)
        ctx.restore();
        ctx.save();

        const alpha = slot.opacity;
        const nodeR = (node.radius + 3) * zoom;

        // Arrow start: near label
        const asx = align === 'left' ? lx - 4 : lx + 4;
        const asy = ly;

        // Arrow end: on node edge
        const toNodeDx = snx - asx;
        const toNodeDy = sny - asy;
        const toNodeDist = Math.sqrt(toNodeDx * toNodeDx + toNodeDy * toNodeDy) || 1;
        const aex = snx - (toNodeDx / toNodeDist) * nodeR;
        const aey = sny - (toNodeDy / toNodeDist) * nodeR;

        // Control point: perpendicular offset for curve
        const midX = (asx + aex) / 2;
        const midY = (asy + aey) / 2;
        const perpX = -(asy - aey);
        const perpY = asx - aex;
        const perpDist = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
        const curvature = 25;
        const cpx = midX + (perpX / perpDist) * curvature;
        const cpy = midY + (perpY / perpDist) * curvature;

        ctx.beginPath();
        ctx.moveTo(asx, asy);
        ctx.quadraticCurveTo(cpx, cpy, aex, aey);
        ctx.strokeStyle = colors.accent;
        ctx.globalAlpha = alpha * 0.5;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrowhead
        const t = 0.94;
        const prevX = (1 - t) * (1 - t) * asx + 2 * (1 - t) * t * cpx + t * t * aex;
        const prevY = (1 - t) * (1 - t) * asy + 2 * (1 - t) * t * cpy + t * t * aey;
        const headAngle = Math.atan2(aey - prevY, aex - prevX);
        const headLen = 5;
        ctx.beginPath();
        ctx.moveTo(aex, aey);
        ctx.lineTo(aex - headLen * Math.cos(headAngle - 0.4), aey - headLen * Math.sin(headAngle - 0.4));
        ctx.moveTo(aex, aey);
        ctx.lineTo(aex - headLen * Math.cos(headAngle + 0.4), aey - headLen * Math.sin(headAngle + 0.4));
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.restore();

        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-camX, -camY);
      }
    }
    tagLabelInfos = newTagInfos;

    ctx.restore();
  }

  function getColors() {
    if (typeof getComputedStyle === 'undefined' || !canvas) {
      return { accent: '#f97316', secondary: '#a3e635', text: '#f0f0f0', muted: '#94a3b8', bg: '#0c1222', cardBorder: 'rgba(255,255,255,0.08)' };
    }
    const style = getComputedStyle(canvas);
    return {
      accent: style.getPropertyValue('--accent').trim() || '#f97316',
      secondary: style.getPropertyValue('--accent-secondary').trim() || '#a3e635',
      text: style.getPropertyValue('--text').trim() || '#f0f0f0',
      muted: style.getPropertyValue('--text-muted').trim() || '#94a3b8',
      bg: style.getPropertyValue('--bg').trim() || '#0c1222',
      cardBorder: style.getPropertyValue('--bg-card-border').trim() || 'rgba(255,255,255,0.08)',
    };
  }

  // ── Setup ──
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
    if (sim) sim.alpha(0.1).restart();
  }

  let hasFittedOnce = false;

  onMount(() => {
    resize();

    sim = forceSimulation<GraphNode>(nodes)
      .force('link', forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(45)
        .strength((d: GraphLink) => d.isTag ? linkStrength * 0.5 : linkStrength))
      .force('charge', forceManyBody()
        .strength(d => -repulsion * ((d as GraphNode).radius / 6)))
      .force('collide', forceCollide<GraphNode>()
        .radius(d => d.radius + 2))
      .force('center', forceCenter(0, 0))
      .force('x', forceX(0).strength(centerForce))
      .force('y', forceY(0).strength(centerForce))
      .alphaDecay(0.02)
      .on('tick', () => {
        if (!hasFittedOnce || sim.alpha() > 0.5) fitToView();
        if (sim.alpha() < 0.05 && !hasFittedOnce) {
          fitToView();
          hasFittedOnce = true;
          initTagSlots();
        }
        draw();
      });

    fitToView();

    let animId: number;
    function animLoop() {
      const now = performance.now() / 1000;
      applyNoiseDrift(now);
      if (sim.alpha() < 0.01) sim.alpha(0.01).restart();
      draw();
      animId = requestAnimationFrame(animLoop);
    }
    animId = requestAnimationFrame(animLoop);

    const onResize = () => { resize(); fitToView(); };
    window.addEventListener('resize', onResize);

    return () => {
      sim.stop();
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  });

  const typeLabels: Record<NodeType, string> = {
    research: 'Research',
    coding: 'Software',
    publication: 'Publication',
    blog: 'Blog',
    talk: 'Talk',
    tag: 'Tag',
  };

  const allTypes: NodeType[] = ['research', 'coding', 'publication', 'blog', 'talk', 'tag'];

  // ── Tag label screen positions for HTML overlay + arrows ──
  interface TagLabelInfo {
    label: string;
    opacity: number;
    nodeScreenX: number;
    nodeScreenY: number;
    labelX: number;  // screen-space label anchor
    labelY: number;
    align: 'left' | 'right';
  }
  let tagLabelInfos: TagLabelInfo[] = $state([]);
</script>

<div class="force-graph-wrap">
  <!-- Controls bar (desktop only) -->
  <div class="controls-bar">
    <button
      class="controls-toggle"
      onclick={() => showControls = !showControls}
      aria-label="Toggle graph controls"
    >
      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
      {showControls ? 'Hide controls' : 'Controls'}
    </button>

    {#if showControls}
      <div class="controls-panel">
        <div class="controls-section">
          <span class="controls-label">Categories</span>
          <div class="controls-toggles">
            {#each allTypes as type}
              <button
                class="cat-btn"
                class:cat-btn--off={!visibility[type]}
                onclick={() => { visibility[type] = !visibility[type]; updateVisibility(); }}
              >
                <span class="cat-dot" style="background: {typeColors[type]}; {!visibility[type] ? 'opacity: 0.3;' : ''}"></span>
                {typeLabels[type]}
              </button>
            {/each}
          </div>
        </div>

        <div class="controls-divider"></div>

        <button class="controls-toggle randomize-btn" onclick={() => {
          for (const n of nodes) {
            n.x = (Math.random() - 0.5) * 400;
            n.y = (Math.random() - 0.5) * 400;
            n.vx = 0;
            n.vy = 0;
          }
          hasFittedOnce = false;
          sim.alpha(1).restart();
          initTagSlots();
        }}>
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          Randomize
        </button>

        <div class="controls-divider"></div>

        <div class="controls-section">
          <span class="controls-label">Forces</span>
          <div class="controls-sliders">
            <label class="slider-row">
              <span class="slider-name">Links</span>
              <input type="range" min="0.01" max="1.0" step="0.01"
                bind:value={linkStrength}
                oninput={() => updateForces()} />
              <span class="slider-val">{linkStrength.toFixed(2)}</span>
            </label>
            <label class="slider-row">
              <span class="slider-name">Repulsion</span>
              <input type="range" min="5" max="200" step="1"
                bind:value={repulsion}
                oninput={() => updateForces()} />
              <span class="slider-val">{repulsion}</span>
            </label>
            <label class="slider-row">
              <span class="slider-name">Center</span>
              <input type="range" min="0.01" max="0.5" step="0.01"
                bind:value={centerForce}
                oninput={() => updateForces()} />
              <span class="slider-val">{centerForce.toFixed(2)}</span>
            </label>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <canvas
    bind:this={canvas}
    class="force-graph-canvas"
    onmousemove={handleMouseMove}
    onmousedown={handleMouseDown}
    onmouseup={handleMouseUp}
    onmouseleave={handleMouseLeave}
    ontouchstart={handleTouchStart}
    ontouchmove={handleTouchMove}
    ontouchend={handleTouchEnd}
  ></canvas>

  <!-- Legend (bottom-left) -->
  <div class="legend">
    {#each allTypes as type}
      {#if visibility[type]}
        <span class="legend-item">
          <span class="legend-dot" style="background: {typeColors[type]};"></span>
          {typeLabels[type]}
        </span>
      {/if}
    {/each}
  </div>

  <!-- Tag labels (positioned near their nodes) -->
  {#if visibility.tag}
    {#each tagLabelInfos as info}
      <span
        class="tag-label"
        style="
          left: {info.labelX}px;
          top: {info.labelY}px;
          opacity: {info.opacity};
          text-align: {info.align};
          transform: translate({info.align === 'left' ? '0' : '-100%'}, -50%);
        "
      >
        {info.label}
      </span>
    {/each}
  {/if}

  <!-- Preview (top-left, below controls) -->
  {#if hoveredNode}
    <div class="graph-preview">
      <span class="preview-type" style="color: {typeColors[hoveredNode.type]};">
        {typeLabels[hoveredNode.type]}
      </span>
      <span class="preview-label">{hoveredNode.label}</span>
      {#if hoveredNode.href}
        <span class="preview-hint">Click to navigate</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .force-graph-wrap {
    position: relative;
    width: 100%;
    height: 70vh;
    min-height: 400px;
    max-height: 800px;
    border-radius: 12px;
    border: 1px solid var(--bg-card-border);
    background: var(--bg-card);
    box-shadow: var(--shadow-card);
    overflow: hidden;
  }

  .force-graph-canvas {
    width: 100%;
    height: 100%;
    display: block;
    cursor: grab;
  }

  /* ─── Controls ─── */
  .controls-bar {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    z-index: 50;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .controls-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.65rem;
    font-family: var(--font-display);
    font-size: 0.65rem;
    font-weight: 500;
    color: var(--text-muted);
    background: var(--bg-card);
    backdrop-filter: blur(12px);
    border: 1px solid var(--bg-card-border);
    border-radius: 6px;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s;
    letter-spacing: 0.03em;
  }

  .controls-toggle:hover {
    color: var(--text);
    border-color: var(--accent);
  }

  .controls-panel {
    background: var(--bg-card);
    backdrop-filter: blur(16px);
    border: 1px solid var(--bg-card-border);
    border-radius: 8px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    min-width: 240px;
    box-shadow: var(--shadow-card);
  }

  .controls-section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .controls-label {
    font-family: var(--font-display);
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
  }

  .controls-toggles {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .cat-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.2rem 0.5rem;
    font-family: var(--font-body);
    font-size: 0.65rem;
    font-weight: 500;
    color: var(--text);
    background: transparent;
    border: 1px solid var(--bg-card-border);
    border-radius: 4px;
    cursor: pointer;
    transition: opacity 0.2s, border-color 0.2s;
  }

  .cat-btn:hover {
    border-color: var(--accent);
  }

  .cat-btn--off {
    opacity: 0.4;
  }

  .cat-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .randomize-btn {
    width: 100%;
    justify-content: center;
  }

  .controls-divider {
    height: 1px;
    background: var(--bg-card-border);
  }

  .controls-sliders {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .slider-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    cursor: default;
  }

  .slider-name {
    font-size: 0.6rem;
    font-weight: 500;
    color: var(--text-muted);
    width: 52px;
    flex-shrink: 0;
  }

  .slider-row input[type="range"] {
    flex: 1;
    height: 3px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--bg-card-border);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }

  .slider-row input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--accent);
    border: none;
    cursor: pointer;
  }

  .slider-row input[type="range"]::-moz-range-thumb {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--accent);
    border: none;
    cursor: pointer;
  }

  .slider-val {
    font-family: var(--font-display);
    font-size: 0.55rem;
    color: var(--text-muted);
    width: 28px;
    text-align: right;
    flex-shrink: 0;
  }

  /* Hide controls on small screens */
  @media (max-width: 768px) {
    .controls-bar {
      display: none;
    }
  }

  /* ─── Legend ─── */
  .legend {
    position: absolute;
    bottom: 0.75rem;
    left: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    font-size: 0.7rem;
    font-family: var(--font-display);
    color: var(--text-muted);
    pointer-events: none;
    background: var(--bg-card);
    backdrop-filter: blur(12px);
    border: 1px solid var(--bg-card-border);
    border-radius: 6px;
    padding: 0.5rem 0.7rem;
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ─── Tag labels ─── */
  .tag-label {
    position: absolute;
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
    pointer-events: none;
    z-index: 10;
    color: var(--accent);
    transition: opacity 0.3s;
  }

  /* ─── Preview ─── */
  .graph-preview {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    z-index: 100;
    pointer-events: none;
    background: var(--bg-card);
    backdrop-filter: blur(12px);
    border: 1px solid var(--bg-card-border);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    max-width: 300px;
    box-shadow: var(--shadow-card);
  }

  .preview-type {
    font-family: var(--font-display);
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }

  .preview-label {
    font-size: 0.78rem;
    color: var(--text);
    line-height: 1.3;
  }

  .preview-hint {
    font-size: 0.6rem;
    color: var(--text-muted);
    font-style: italic;
  }

  @media (max-width: 640px) {
    .force-graph-wrap {
      height: 50vh;
      min-height: 300px;
    }
  }
</style>
