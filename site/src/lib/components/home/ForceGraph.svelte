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

  for (const p of projects.research) addNode(`proj:${p.slug}`, p.title, 'research', '/research');
  for (const p of projects.coding) addNode(`proj:${p.slug}`, p.title, 'coding', '/coding');
  const allPubs = [...publications.peer_reviewed, ...publications.preprints, ...publications.theses];
  for (const pub of allPubs) addNode(`pub:${pub.slug}`, pub.title, 'publication', `/publications#${pub.slug}`);
  for (const post of blogPosts) addNode(`blog:${post.slug}`, post.title, 'blog', `/blog/${post.slug}`);
  for (const talk of talks as Talk[]) addNode(`talk:${talk.slug}`, talk.title, 'talk', '/talks');
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
  let camX = 0;
  let camY = 0;
  let zoom = 1;

  function screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return { x: (sx - width / 2) / zoom + camX, y: (sy - height / 2) / zoom + camY };
  }

  function worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return { x: (wx - camX) * zoom + width / 2, y: (wy - camY) * zoom + height / 2 };
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
    camX = (minX + maxX) / 2;
    camY = (minY + maxY) / 2;
    zoom = Math.min(width / (maxX - minX + padding * 2), height / (maxY - minY + padding * 2), 2);
    zoom = Math.max(0.1, zoom);
  }

  // ── Interaction state ──
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
    research: '#f97316', coding: '#a3e635', publication: '#60a5fa',
    blog: '#c084fc', talk: '#fb923c', tag: '#94a3b8',
  };

  function nodeColor(type: NodeType): string { return typeColors[type]; }

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

  function canvasCoords(e: MouseEvent): { sx: number; sy: number } {
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
      draw(); return;
    }
    const found = findNodeAt(world.x, world.y);
    if (found !== hoveredNode) hoverNeedsPreIterate = true;
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
      draw();
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

  // ── Animated label rotation system ──
  // 5 tag labels (accent) + 3 general labels (secondary), freeze during hover
  const LABEL_FONT_SIZE = 18;
  const LABEL_MAX_AGE = 30;

  interface AnimLabel {
    node: GraphNode;
    age: number;
    opacity: number;
    fading: boolean;
    kind: 'tag' | 'general';
  }

  let animLabels: AnimLabel[] = [];
  let usedAnimIds = new Set<string>();
  let lastTickTime = 0;

  const tagNodes = nodes.filter(n => n.type === 'tag');
  const nonTagNodes = nodes.filter(n => n.type !== 'tag');

  function pickAnimOverlapFree(pool: GraphNode[]): GraphNode | null {
    const candidates = pool.filter(n => !usedAnimIds.has(n.id) && !n.hidden);
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    return candidates[0] || null;
  }

  function initAnimLabels() {
    animLabels = [];
    usedAnimIds.clear();
    const totalSlots = Math.min(5, tagNodes.length) + Math.min(3, nonTagNodes.length);
    const stagger = totalSlots > 0 ? LABEL_MAX_AGE / totalSlots : 0;
    let slotIdx = 0;
    for (let i = 0; i < Math.min(5, tagNodes.length); i++) {
      const node = pickAnimOverlapFree(tagNodes);
      if (node) { animLabels.push({ node, age: slotIdx * stagger, opacity: 1, fading: false, kind: 'tag' }); usedAnimIds.add(node.id); slotIdx++; }
    }
    for (let i = 0; i < Math.min(3, nonTagNodes.length); i++) {
      const node = pickAnimOverlapFree(nonTagNodes);
      if (node) { animLabels.push({ node, age: slotIdx * stagger, opacity: 1, fading: false, kind: 'general' }); usedAnimIds.add(node.id); slotIdx++; }
    }
  }

  function updateAnimLabels(dt: number) {
    // Freeze during hover
    if (hoveredNode) return;
    for (const slot of animLabels) {
      slot.age += dt;
      if (!slot.fading && slot.age >= LABEL_MAX_AGE) slot.fading = true;
      if (slot.fading) {
        slot.opacity = Math.max(0, slot.opacity - dt * 0.33); // 3s fade out
        if (slot.opacity <= 0) {
          usedAnimIds.delete(slot.node.id);
          const pool = slot.kind === 'tag' ? tagNodes : nonTagNodes;
          const newNode = pickAnimOverlapFree(pool);
          if (newNode) { slot.node = newNode; usedAnimIds.add(newNode.id); }
          slot.age = 0; slot.opacity = 0; slot.fading = false;
        }
      } else if (slot.opacity < 1) {
        slot.opacity = Math.min(1, slot.opacity + dt * 0.33); // 3s fade in
      }
    }
  }

  // ── Label placement force simulation ──
  // Labels are nodes that repel each other but are pulled toward their anchor (graph node screen pos).
  interface LabelNode extends SimulationNodeDatum {
    id: string;
    anchorX: number;
    anchorY: number;
    opacity: number;
  }

  interface FloatingLabel {
    label: string;
    color: string;
    opacity: number;
    nodeScreenX: number;
    nodeScreenY: number;
    labelX: number;
    labelY: number;
    align: 'left' | 'right';
    isHoveredLabel?: boolean;
  }
  let floatingLabels: FloatingLabel[] = $state([]);
  let animLabelInfos: FloatingLabel[] = $state([]);

  // ── Hover label cycling (when >10 neighbors) ──
  const MAX_HOVER_LABELS = 7;
  const HOVER_CYCLE_AGE = 30; // same as animated labels

  interface HoverCycleSlot {
    nodeId: string;
    age: number;
    opacity: number;
    fading: boolean;
  }

  let hoverCycleSlots: HoverCycleSlot[] = [];
  let hoverCycleUsedIds = new Set<string>();
  let lastHoveredId: string | null = null;
  let hoverNeedsPreIterate = false; // flag to pre-iterate label sim on hover start

  function initHoverCycle(allNeighborIds: string[]) {
    hoverCycleSlots = [];
    hoverCycleUsedIds.clear();
    const shuffled = [...allNeighborIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const count = Math.min(MAX_HOVER_LABELS, shuffled.length);
    const stagger = count > 0 ? HOVER_CYCLE_AGE / count : 0;
    for (let i = 0; i < count; i++) {
      hoverCycleSlots.push({ nodeId: shuffled[i], age: i * stagger, opacity: 1, fading: false });
      hoverCycleUsedIds.add(shuffled[i]);
    }
  }

  function updateHoverCycle(dt: number, allNeighborIds: string[]) {
    for (const slot of hoverCycleSlots) {
      slot.age += dt;
      if (!slot.fading && slot.age >= HOVER_CYCLE_AGE) slot.fading = true;
      if (slot.fading) {
        slot.opacity = Math.max(0, slot.opacity - dt * 0.33); // 3s fade out
        if (slot.opacity <= 0) {
          hoverCycleUsedIds.delete(slot.nodeId);
          const candidates = allNeighborIds.filter(id => !hoverCycleUsedIds.has(id));
          if (candidates.length > 0) {
            const pick = candidates[Math.floor(Math.random() * candidates.length)];
            slot.nodeId = pick;
            hoverCycleUsedIds.add(pick);
          }
          slot.age = 0; slot.opacity = 0; slot.fading = false;
        }
      } else if (slot.opacity < 1) {
        slot.opacity = Math.min(1, slot.opacity + dt * 0.33); // 3s fade in
      }
    }
  }

  let labelSimNodes: LabelNode[] = [];
  let labelSim: Simulation<LabelNode, never> | null = null;

  function rebuildLabelSim(entries: { id: string; anchorX: number; anchorY: number; opacity: number }[]) {
    const oldMap = new Map<string, LabelNode>();
    for (const n of labelSimNodes) oldMap.set(n.id, n);

    labelSimNodes = entries.map(e => {
      const old = oldMap.get(e.id);
      return {
        id: e.id,
        anchorX: e.anchorX,
        anchorY: e.anchorY,
        opacity: e.opacity,
        x: old?.x ?? e.anchorX + (Math.random() - 0.5) * 20,
        y: old?.y ?? e.anchorY - 60 + (Math.random() - 0.5) * 20,
      };
    });

    if (labelSim) labelSim.stop();

    labelSim = forceSimulation<LabelNode>(labelSimNodes)
      .force('repel', forceManyBody<LabelNode>()
        .strength(d => -200 * (d as LabelNode).opacity)
        .distanceMax(200))
      .force('anchor', () => {
        for (const n of labelSimNodes) {
          const dx = n.anchorX - (n.x || 0);
          const dy = n.anchorY - (n.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 80 * n.opacity; // fading labels collapse toward anchor
          const force = (dist - targetDist) * 0.05 * Math.max(n.opacity, 0.1);
          n.vx = (n.vx || 0) + dx / dist * force;
          n.vy = (n.vy || 0) + dy / dist * force;
        }
      })
      .force('bounds', () => {
        const margin = 40;
        for (const n of labelSimNodes) {
          if ((n.x || 0) < margin) n.vx = (n.vx || 0) + 2;
          if ((n.x || 0) > width - margin) n.vx = (n.vx || 0) - 2;
          if ((n.y || 0) < 20) n.vy = (n.vy || 0) + 2;
          if ((n.y || 0) > height - 20) n.vy = (n.vy || 0) - 2;
        }
      })
      .velocityDecay(0.5)
      .alphaDecay(0.05)
      .alpha(0.5);
  }

  function updateLabelAnchors(entries: { id: string; anchorX: number; anchorY: number; opacity: number }[]) {
    for (const e of entries) {
      const n = labelSimNodes.find(ln => ln.id === e.id);
      if (n) { n.anchorX = e.anchorX; n.anchorY = e.anchorY; n.opacity = e.opacity; }
    }
    if (labelSim && labelSim.alpha() < 0.05) labelSim.alpha(0.1).restart();
  }

  function drawCurvedArrow(
    ctx: CanvasRenderingContext2D,
    fromX: number, fromY: number,
    toX: number, toY: number,
    nodeR: number,
    color: string, alpha: number
  ) {
    // End at node edge
    const tdx = toX - fromX, tdy = toY - fromY;
    const tdist = Math.sqrt(tdx * tdx + tdy * tdy) || 1;
    const aex = toX - (tdx / tdist) * nodeR;
    const aey = toY - (tdy / tdist) * nodeR;
    const asx = fromX;
    const asy = fromY;

    // Perpendicular control point (2x curvature)
    const midX = (asx + aex) / 2, midY = (asy + aey) / 2;
    const perpX = -(asy - aey), perpY = asx - aex;
    const perpDist = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
    const cpx = midX + (perpX / perpDist) * 50;
    const cpy = midY + (perpY / perpDist) * 50;

    ctx.beginPath();
    ctx.moveTo(asx, asy);
    ctx.quadraticCurveTo(cpx, cpy, aex, aey);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrowhead (2x size)
    const t = 0.94;
    const prevX = (1 - t) ** 2 * asx + 2 * (1 - t) * t * cpx + t * t * aex;
    const prevY = (1 - t) ** 2 * asy + 2 * (1 - t) * t * cpy + t * t * aey;
    const angle = Math.atan2(aey - prevY, aex - prevX);
    const hl = 10;
    ctx.beginPath();
    ctx.moveTo(aex, aey);
    ctx.lineTo(aex - hl * Math.cos(angle - 0.4), aey - hl * Math.sin(angle - 0.4));
    ctx.moveTo(aex, aey);
    ctx.lineTo(aex - hl * Math.cos(angle + 0.4), aey - hl * Math.sin(angle + 0.4));
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ── Rendering ──
  function draw() {
    if (!ctx) return;
    const colors = getColors();

    // Update animated labels
    const now = performance.now() / 1000;
    const dt = lastTickTime === 0 ? 0 : Math.min(now - lastTickTime, 0.1);
    lastTickTime = now;
    if (animLabels.length > 0) updateAnimLabels(dt);

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-camX, -camY);

    const hovered = isPanning ? null : (draggedNode || hoveredNode);
    const hasHover = hovered !== null && !hovered.hidden;
    const neighborIds = hasHover ? getNeighborIds(hovered.id) : new Set<string>();

    // ── Links ──
    // Pass 1: non-highlighted
    for (const link of links) {
      const s = link.source as GraphNode, t = link.target as GraphNode;
      if (s.hidden || t.hidden) continue;
      if (hasHover && (s.id === hovered!.id || t.id === hovered!.id)) continue;
      ctx.beginPath();
      ctx.moveTo(s.x || 0, s.y || 0);
      ctx.lineTo(t.x || 0, t.y || 0);
      ctx.strokeStyle = hasHover ? `rgba(148, 163, 184, 0.10)` : `rgba(148, 163, 184, 0.25)`;
      ctx.lineWidth = 1.5 / zoom;
      ctx.stroke();
    }
    // Pass 2: highlighted edges (connected to hovered)
    if (hasHover) {
      for (const link of links) {
        const s = link.source as GraphNode, t = link.target as GraphNode;
        if (s.hidden || t.hidden) continue;
        if (s.id !== hovered!.id && t.id !== hovered!.id) continue;
        ctx.beginPath();
        ctx.moveTo(s.x || 0, s.y || 0);
        ctx.lineTo(t.x || 0, t.y || 0);
        const other = s.id === hovered!.id ? t : s;
        ctx.strokeStyle = nodeColor(other.type);
        ctx.lineWidth = 2.5 / zoom;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // ── Nodes (draw hovered last so it's always on top) ──
    function drawNode(node: GraphNode) {
      const x = node.x || 0, y = node.y || 0;
      const isHov = node === hovered;
      const isNeighbor = hasHover && neighborIds.has(node.id);
      const isDimmed = hasHover && !isHov && !isNeighbor;
      const r = isHov ? node.radius + 3 : node.radius;
      const color = nodeColor(node.type);

      // Glow for hovered node
      if (isHov) {
        ctx.beginPath();
        ctx.arc(x, y, r + 8, 0, Math.PI * 2);
        ctx.fillStyle = color + '30';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = isDimmed ? color + '33' : (isHov || isNeighbor) ? color : color + 'aa';
      ctx.fill();

      if (isHov) {
        ctx.beginPath();
        ctx.arc(x, y, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5 / zoom;
        ctx.stroke();
      }
      if (isNeighbor && !isHov) {
        ctx.beginPath();
        ctx.arc(x, y, r + 2, 0, Math.PI * 2);
        ctx.strokeStyle = color + '55';
        ctx.lineWidth = 1 / zoom;
        ctx.stroke();
      }
    }

    // Draw non-hovered nodes first
    for (const node of nodes) {
      if (node.hidden || node === hovered) continue;
      drawNode(node);
    }
    // Draw hovered node on top
    if (hovered && !hovered.hidden) drawNode(hovered);

    ctx.restore();

    // ── Collect all label entries for the label force sim ──
    interface LabelEntry {
      id: string;
      graphNode: GraphNode;
      anchorX: number;
      anchorY: number;
      color: string;
      opacity: number;
      source: 'hover' | 'anim';
    }
    const allLabelEntries: LabelEntry[] = [];

    // Hovered node label + neighbor labels (instant, pre-iterated)
    if (hasHover) {
      const hovScr = worldToScreen(hovered!.x || 0, hovered!.y || 0);
      allLabelEntries.push({
        id: `hovered:${hovered!.id}`, graphNode: hovered!,
        anchorX: hovScr.x, anchorY: hovScr.y,
        color: colors.text, opacity: 1, source: 'hover',
      });

      const visibleNeighborIds = [...neighborIds].filter(id => {
        const n = nodeMap.get(id);
        return n && !n.hidden;
      });

      if (visibleNeighborIds.length <= MAX_HOVER_LABELS) {
        lastHoveredId = null;
        for (const nId of visibleNeighborIds) {
          const neighbor = nodeMap.get(nId)!;
          const scr = worldToScreen(neighbor.x || 0, neighbor.y || 0);
          allLabelEntries.push({
            id: `hover:${neighbor.id}`, graphNode: neighbor,
            anchorX: scr.x, anchorY: scr.y,
            color: nodeColor(neighbor.type), opacity: 1, source: 'hover',
          });
        }
      } else {
        if (lastHoveredId !== hovered!.id) {
          lastHoveredId = hovered!.id;
          initHoverCycle(visibleNeighborIds);
        }
        updateHoverCycle(dt, visibleNeighborIds);

        for (const slot of hoverCycleSlots) {
          if (slot.opacity <= 0) continue;
          const neighbor = nodeMap.get(slot.nodeId);
          if (!neighbor || neighbor.hidden) continue;
          const scr = worldToScreen(neighbor.x || 0, neighbor.y || 0);
          allLabelEntries.push({
            id: `hover:${neighbor.id}`, graphNode: neighbor,
            anchorX: scr.x, anchorY: scr.y,
            color: nodeColor(neighbor.type), opacity: slot.opacity, source: 'hover',
          });
        }
      }
    } else {
      lastHoveredId = null;
    }

    // Animated labels (hidden during hover/drag)
    for (const slot of animLabels) {
      if (hasHover) break;
      if (slot.opacity <= 0 || slot.node.hidden) continue;
      const scr = worldToScreen(slot.node.x || 0, slot.node.y || 0);
      allLabelEntries.push({
        id: `anim:${slot.node.id}`, graphNode: slot.node,
        anchorX: scr.x, anchorY: scr.y,
        color: slot.kind === 'tag' ? colors.accent : colors.secondary,
        opacity: slot.opacity, source: 'anim',
      });
    }

    // Rebuild or update label sim
    const currentIds = new Set(allLabelEntries.map(e => e.id));
    const simIds = new Set(labelSimNodes.map(n => n.id));
    const needsRebuild = allLabelEntries.length !== labelSimNodes.length ||
      allLabelEntries.some(e => !simIds.has(e.id));

    if (needsRebuild) {
      rebuildLabelSim(allLabelEntries.map(e => ({ id: e.id, anchorX: e.anchorX, anchorY: e.anchorY, opacity: e.opacity })));
    } else {
      updateLabelAnchors(allLabelEntries.map(e => ({ id: e.id, anchorX: e.anchorX, anchorY: e.anchorY, opacity: e.opacity })));
    }

    // Tick the label sim
    if (labelSim) {
      if (hoverNeedsPreIterate && needsRebuild) {
        // Pre-iterate to settled positions before first display
        labelSim.alpha(1);
        for (let i = 0; i < 60; i++) labelSim.tick();
        hoverNeedsPreIterate = false;
      } else {
        for (let i = 0; i < 3; i++) labelSim.tick();
      }
    }

    // Read positions from label sim and build FloatingLabel arrays
    const labelPosMap = new Map<string, { x: number; y: number }>();
    for (const ln of labelSimNodes) {
      labelPosMap.set(ln.id, { x: ln.x || ln.anchorX, y: ln.y || ln.anchorY });
    }

    const newHoverLabels: FloatingLabel[] = [];
    const newAnimInfos: FloatingLabel[] = [];

    // Draw arrows + build label data
    for (const entry of allLabelEntries) {
      const pos = labelPosMap.get(entry.id);
      if (!pos) continue;
      const lx = pos.x, ly = pos.y;
      const snx = entry.anchorX, sny = entry.anchorY;
      const align = lx > snx ? 'left' : 'right';
      const isHoveredLabel = entry.id.startsWith('hovered:');

      const info: FloatingLabel = {
        label: entry.graphNode.label, color: entry.color, opacity: entry.opacity,
        nodeScreenX: snx, nodeScreenY: sny, labelX: lx, labelY: ly, align,
        isHoveredLabel,
      };

      // Draw arrow
      const startX = align === 'left' ? lx - 4 : lx + 4;
      const arrowAlpha = entry.source === 'hover' ? 0.55 : entry.opacity * 0.4;
      drawCurvedArrow(ctx, startX, ly, snx, sny,
        (entry.graphNode.radius + 3) * zoom, entry.color, arrowAlpha);

      if (entry.source === 'hover') newHoverLabels.push(info);
      else newAnimInfos.push(info);
    }

    floatingLabels = newHoverLabels;
    animLabelInfos = newAnimInfos;
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
        if (sim.alpha() < 0.05 && !hasFittedOnce) { fitToView(); hasFittedOnce = true; initAnimLabels(); }
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

  const typeLabels: Record<NodeType, string> = {
    research: 'Research', coding: 'Software', publication: 'Publication',
    blog: 'Blog', talk: 'Talk', tag: 'Tag',
  };

  const allTypes: NodeType[] = ['research', 'coding', 'publication', 'blog', 'talk', 'tag'];
</script>

<div class="force-graph-wrap">
  <!-- Controls bar (desktop only) -->
  <div class="controls-bar">
    <button class="controls-toggle" onclick={() => showControls = !showControls} aria-label="Toggle graph controls">
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
              <button class="cat-btn" class:cat-btn--off={!visibility[type]}
                onclick={() => { visibility[type] = !visibility[type]; updateVisibility(); }}>
                <span class="cat-dot" style="background: {typeColors[type]}; {!visibility[type] ? 'opacity: 0.3;' : ''}"></span>
                {typeLabels[type]}
              </button>
            {/each}
          </div>
        </div>
        <div class="controls-divider"></div>
        <button class="controls-toggle randomize-btn" onclick={() => {
          for (const n of nodes) { n.x = (Math.random() - 0.5) * 400; n.y = (Math.random() - 0.5) * 400; n.vx = 0; n.vy = 0; }
          hasFittedOnce = false; sim.alpha(1).restart();
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
              <input type="range" min="0.01" max="1.0" step="0.01" bind:value={linkStrength} oninput={() => updateForces()} />
              <span class="slider-val">{linkStrength.toFixed(2)}</span>
            </label>
            <label class="slider-row">
              <span class="slider-name">Repulsion</span>
              <input type="range" min="5" max="200" step="1" bind:value={repulsion} oninput={() => updateForces()} />
              <span class="slider-val">{repulsion}</span>
            </label>
            <label class="slider-row">
              <span class="slider-name">Center</span>
              <input type="range" min="0.01" max="0.5" step="0.01" bind:value={centerForce} oninput={() => updateForces()} />
              <span class="slider-val">{centerForce.toFixed(2)}</span>
            </label>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <canvas bind:this={canvas} class="force-graph-canvas"
    onmousemove={handleMouseMove} onmousedown={handleMouseDown}
    onmouseup={handleMouseUp} onmouseleave={handleMouseLeave}
    ontouchstart={handleTouchStart} ontouchmove={handleTouchMove}
    ontouchend={handleTouchEnd}></canvas>

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

  <!-- Animated labels (idle) -->
  {#each animLabelInfos as info}
    <span class="floating-label"
      style="left: {info.labelX}px; top: {info.labelY}px;
        opacity: {info.opacity}; text-align: {info.align}; color: {info.color};
        transform: translate({info.align === 'left' ? '0' : '-100%'}, -50%);">
      {info.label}
    </span>
  {/each}

  <!-- Hover labels (neighbors + hovered node) -->
  {#each floatingLabels as info}
    <span class="floating-label {info.isHoveredLabel ? 'floating-label--hovered' : ''}"
      style="left: {info.labelX}px; top: {info.labelY}px;
        text-align: {info.align}; color: {info.isHoveredLabel ? 'var(--text)' : info.color};
        transform: translate({info.align === 'left' ? '0' : '-100%'}, -50%);">
      {info.label}
    </span>
  {/each}
</div>

<style>
  .force-graph-wrap {
    position: relative; width: 100%; height: 70vh;
    min-height: 400px; max-height: 800px;
    border-radius: 12px; border: 1px solid var(--bg-card-border);
    background: var(--bg-card); box-shadow: var(--shadow-card); overflow: hidden;
  }
  .force-graph-canvas { width: 100%; height: 100%; display: block; cursor: grab; }

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
  .slider-row input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; border-radius: 50%; background: var(--accent); border: none; cursor: pointer; }
  .slider-row input[type="range"]::-moz-range-thumb { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); border: none; cursor: pointer; }
  .slider-val { font-family: var(--font-display); font-size: 0.55rem; color: var(--text-muted); width: 28px; text-align: right; flex-shrink: 0; }
  @media (max-width: 768px) { .controls-bar { display: none; } }

  /* ─── Legend ─── */
  .legend {
    position: absolute; bottom: 0.75rem; left: 0.75rem;
    display: flex; flex-direction: column; gap: 0.4rem;
    font-size: 0.7rem; font-family: var(--font-display); color: var(--text-muted);
    pointer-events: none; background: var(--bg-card); backdrop-filter: blur(12px);
    border: 1px solid var(--bg-card-border); border-radius: 6px; padding: 0.5rem 0.7rem;
  }
  .legend-item { display: inline-flex; align-items: center; gap: 0.35rem; }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  /* ─── Floating labels ─── */
  .floating-label {
    position: absolute; font-family: var(--font-display);
    font-size: 0.75rem; font-weight: 600; letter-spacing: 0.02em;
    max-width: 400px; word-wrap: break-word; overflow-wrap: break-word;
    white-space: normal; pointer-events: none; z-index: 10;
    background: color-mix(in srgb, var(--bg) 60%, transparent);
    backdrop-filter: blur(6px); padding: 0.15rem 0.45rem;
    border-radius: 4px; line-height: 1.3;
  }

  .floating-label--hovered {
    font-size: 1.05rem;
    font-weight: 700;
    z-index: 20;
    background: color-mix(in srgb, var(--bg) 80%, transparent);
    backdrop-filter: blur(10px);
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
  }

  @media (max-width: 640px) { .force-graph-wrap { height: 50vh; min-height: 300px; } }
</style>
