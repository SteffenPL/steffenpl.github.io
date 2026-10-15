<script lang="ts">
	import { onMount } from 'svelte';

	type Disk = { x: number; y: number; px: number; py: number; r: number; color: number };
	let canvas: HTMLCanvasElement;
	let running = $state(true);
	let r = $state(12);
	let l = $state(31);
	let spread = $state(2.2);
	let strength = $state(75);
	let dt = $state(0.018);
	let time = $state(0);
	let disks = $state.raw<Disk[]>([]);
	let frame = 0;
	let last = 0;
	let accumulator = 0;
	let width = 0;
	let height = 0;
	let scale = 1;
	let dragging = -1;
	let pointerId = -1;
	let contacts = $state(0);

	const N = 300;
	const H = 900;
	const colors = ['#c76545', '#d77e59', '#b95a41', '#e09a71'];

	function reset() {
		disks = [];
		const cols = 14;
		const spacing = 2 * (r + spread) + 2;
		for (let i = 0; i < N; i++) {
			const col = i % cols;
			const row = Math.floor(i / cols);
			const radius = Math.max(3, r + (Math.random() * 2 - 1) * spread);
			const x = (col - (cols - 1) / 2) * spacing + (row % 2) * spacing * 0.5 + (Math.random() - .5) * 1.4;
			const y = -row * spacing * .86 - 60 + (Math.random() - .5) * 1.4;
			disks.push({ x, y, px: x, py: y, r: radius, color: Math.floor(Math.random() * colors.length) });
		}
		time = 0;
		accumulator = 0;
	}

	function resize() {
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		width = rect.width;
		height = rect.height;
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		const ctx = canvas.getContext('2d');
		if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		scale = Math.min(width / 560, height / 900);
	}

	function project() {
		contacts = 0;
		// Gauss–Seidel projection of disk non-overlap constraints.
		for (let i = 0; i < N; i++) {
			const a = disks[i];
			for (let j = i + 1; j < N; j++) {
				const b = disks[j];
				let dx = b.x - a.x, dy = b.y - a.y;
				const minD = a.r + b.r;
				const d2 = dx * dx + dy * dy;
				if (d2 < minD * minD) {
					let d = Math.sqrt(d2);
					if (d < 1e-8) { dx = .001; dy = 0; d = .001; }
					const push = (minD - d) * .505;
					dx /= d; dy /= d;
					a.x -= dx * push; a.y -= dy * push;
					b.x += dx * push; b.y += dy * push;
					contacts++;
				}
			}
		}
		for (const p of disks) {
			// Side walls; the horizontal sill is two finite hard segments.
			p.x = Math.max(-230 + p.r, Math.min(230 - p.r, p.x));
			for (const [x1, x2] of [[-230, -l], [l, 230]]) {
				const cx = Math.max(x1, Math.min(x2, p.x));
				const dx = p.x - cx, dy = p.y;
				const d2 = dx * dx + dy * dy;
				if (d2 < p.r * p.r) {
					const d = Math.sqrt(d2) || 1e-6;
					p.x += (dx / d) * (p.r - d);
					p.y += (dy / d) * (p.r - d);
				}
			}
			// Keep disks inside the visible domain; a soft ceiling replenishes the flow.
			if (p.y < -560 + p.r) p.y = -560 + p.r;
		}
	}

	function step(h: number) {
		for (let i = 0; i < N; i++) {
			const p = disks[i];
			if (i === dragging) { p.px = p.x; p.py = p.y; continue; }
			let fx = 0;
			if (p.y < 0) fx = -Math.tanh(p.x / 72) * strength;
			const fy = strength;
			const vx = p.x - p.px, vy = p.y - p.py;
			p.px = p.x; p.py = p.y;
			p.x += vx + fx * h * h;
			p.y += vy + fy * h * h;
		}
		project();
		time += h;
	}

	function draw() {
		const ctx = canvas?.getContext('2d');
		if (!ctx) return;
		ctx.clearRect(0, 0, width, height);
		ctx.save();
		ctx.translate(width / 2, 38);
		ctx.scale(scale, scale);
		// Light, unobtrusive vertical guide marks.
		ctx.strokeStyle = '#e8e4dc'; ctx.lineWidth = 1 / scale;
		for (let y = -450; y <= 800; y += 50) {
			ctx.beginPath(); ctx.moveTo(-230, y); ctx.lineTo(230, y); ctx.stroke();
		}
		// Door sill: two wall segments with a clear opening.
		ctx.strokeStyle = '#23231f'; ctx.lineWidth = 3 / scale; ctx.lineCap = 'round';
		ctx.beginPath(); ctx.moveTo(-230, 0); ctx.lineTo(-l, 0); ctx.moveTo(l, 0); ctx.lineTo(230, 0); ctx.stroke();
		ctx.fillStyle = '#77746c'; ctx.font = `${11 / scale}px system-ui`; ctx.textAlign = 'center';
		ctx.fillText('DOOR', 0, -12);
		ctx.fillStyle = '#a5a197'; ctx.font = `${10 / scale}px ui-monospace, monospace`;
		ctx.fillText(`${(2 * l).toFixed(0)} units`, 0, 17);
		// Direction field: converge above; descend below.
		ctx.strokeStyle = 'rgba(115, 139, 119, .36)'; ctx.lineWidth = 1 / scale;
		for (let x = -180; x <= 180; x += 60) {
			const startY = -120;
			ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x * .58, -15); ctx.lineTo(x * .58, 95); ctx.stroke();
			ctx.beginPath(); ctx.moveTo(x * .58 - 3, 90); ctx.lineTo(x * .58, 96); ctx.lineTo(x * .58 + 3, 90); ctx.stroke();
		}
		for (const p of disks) {
			ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
			ctx.fillStyle = colors[p.color]; ctx.fill();
			ctx.strokeStyle = 'rgba(91, 44, 32, .24)'; ctx.lineWidth = .8 / scale; ctx.stroke();
			ctx.beginPath(); ctx.arc(p.x - p.r * .28, p.y - p.r * .3, p.r * .2, 0, Math.PI * 2);
			ctx.fillStyle = 'rgba(255,255,255,.23)'; ctx.fill();
		}
		ctx.restore();
	}

	function loop(now: number) {
		frame = requestAnimationFrame(loop);
		if (!last) last = now;
		const elapsed = Math.min((now - last) / 1000, .05); last = now;
		if (running) {
			accumulator += elapsed;
			const h = dt;
			let count = 0;
			while (accumulator >= h && count++ < 6) { step(h); accumulator -= h; }
		}
		draw();
	}

	function point(e: PointerEvent) {
		const rect = canvas.getBoundingClientRect();
		return { x: (e.clientX - rect.left - width / 2) / scale, y: (e.clientY - rect.top - 38) / scale };
	}
	function pointerDown(e: PointerEvent) {
		const q = point(e);
		let best = -1, bestD = Infinity;
		for (let i = 0; i < N; i++) {
			const p = disks[i], d = (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
			if (d < p.r * p.r && d < bestD) { best = i; bestD = d; }
		}
		if (best >= 0) { dragging = best; pointerId = e.pointerId; canvas.setPointerCapture(e.pointerId); }
	}
	function pointerMove(e: PointerEvent) {
		if (dragging < 0 || e.pointerId !== pointerId) return;
		const q = point(e), p = disks[dragging];
		p.x = q.x; p.y = q.y; p.px = q.x; p.py = q.y;
	}
	function pointerUp() { dragging = -1; pointerId = -1; }

	onMount(() => {
		reset(); resize();
		const observer = new ResizeObserver(resize); observer.observe(canvas);
		frame = requestAnimationFrame(loop);
		return () => { cancelAnimationFrame(frame); observer.disconnect(); };
	});
</script>

<svelte:head>
	<title>Blocking at a door — Position-based dynamics</title>
	<meta name="description" content="An interactive position-based dynamics experiment: 300 hard disks flowing through a narrow door." />
</svelte:head>

<svelte:window onresize={resize} />

<section class="page">
	<header class="topline"><a href="/">← Steffen Plunder</a><span>COMPUTATIONAL EXPERIMENT · 01</span></header>
	<div class="intro">
		<p class="eyebrow">POSITION-BASED DYNAMICS / CROWD FLOW</p>
		<h1>Blocking<br /><em>at a door.</em></h1>
		<p class="dek">Three hundred hard disks, one narrow opening. Adjust the geometry and the driving field; watch order give way to blockage.</p>
	</div>
	<div class="workspace">
		<section class="simulation" aria-label="Disk simulation">
			<div class="sim-head"><div><span class="live-dot" class:paused={!running}></span><strong>{running ? 'RUNNING' : 'PAUSED'}</strong><span class="sim-meta">{N} disks · PBD</span></div><span class="sim-time">t = {time.toFixed(1)}</span></div>
			<div class="canvas-wrap"><canvas bind:this={canvas} onpointerdown={pointerDown} onpointermove={pointerMove} onpointerup={pointerUp} onpointercancel={pointerUp} aria-label="Simulation canvas. Drag disks to reposition them."></canvas>
				<div class="axis-label top">UPSTREAM</div><div class="axis-label bottom">DOWNSTREAM ↓</div>
			</div>
			<div class="sim-foot"><span><i class="swatch"></i> disk radius r ± s</span><span>{contacts} active contacts</span><span>drag disks to reposition</span></div>
		</section>
		<aside class="controls">
			<div class="control-heading"><span>EXPERIMENT</span><span class="mono">N = 300</span></div>
			<div class="control-group"><label for="radius">Mean radius <output>{r.toFixed(1)}</output></label><input id="radius" type="range" min="7" max="18" step="0.5" bind:value={r} oninput={reset} /><div class="range-notes"><span>compact</span><span>large</span></div></div>
			<div class="control-group"><label for="door">Door half-width <output>{l.toFixed(0)}</output></label><input id="door" type="range" min="14" max="70" step="1" bind:value={l} /><div class="range-notes"><span>narrow</span><span>wide</span></div></div>
			<div class="control-group"><label for="spread">Radius spread <output>±{spread.toFixed(1)}</output></label><input id="spread" type="range" min="0" max="6" step="0.1" bind:value={spread} oninput={reset} /><div class="range-notes"><span>uniform</span><span>varied</span></div></div>
			<div class="control-group"><label for="force">Field strength <output>{strength.toFixed(0)}</output></label><input id="force" type="range" min="10" max="180" step="1" bind:value={strength} /><div class="range-notes"><span>gentle</span><span>strong</span></div></div>
			<div class="control-group"><label for="dt">Time step <output>{dt.toFixed(3)}</output></label><input id="dt" type="range" min="0.004" max="0.04" step="0.001" bind:value={dt} /><div class="range-notes"><span>fine</span><span>coarse</span></div></div>
			<div class="actions"><button class="primary" onclick={() => running = !running}>{running ? 'Ⅱ　Pause' : '▶　Resume'}</button><button class="reset" onclick={reset} aria-label="Reset simulation">↺</button></div>
			<p class="hint">Pause to place a disk. Reset to draw a fresh packing.</p>
			<div class="model"><p class="eyebrow">THE MODEL</p><p>Above the sill, the field steers disks toward the opening. Below it, the drive points straight down. A single sequential projection sweep resolves overlaps each step.</p><div class="equation">x<sub>k+1</sub> = P<sub>C</sub>(x<sub>k</sub> + Δt v<sub>k</sub>)</div></div>
		</aside>
	</div>
	<footer class="credit"><span>Inspired by hard-disk blockage experiments</span><span>After Bertrand Maury · numerical illustration, not calibrated data</span></footer>
</section>

<style>
	:global(body) { background: #f7f6f2; }
	.page { max-width: 1240px; margin: 0 auto; padding: 30px 54px 42px; color: #25251f; }
	.topline { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #dedbd2; padding-bottom:14px; color:#77756d; font:10px/1.2 'Source Code Pro',monospace; letter-spacing:.08em; }
	.topline a { color:#55534c; text-decoration:none; letter-spacing:0; font:13px system-ui,sans-serif; }
	.intro { max-width:650px; padding:54px 0 35px; }
	.eyebrow { margin:0 0 15px; color:#89867c; font:10px 'Source Code Pro',monospace; letter-spacing:.14em; }
	h1 { margin:0; font:500 clamp(48px,7vw,82px)/.92 Georgia,'Times New Roman',serif; letter-spacing:-.055em; }
	h1 em { color:#bd6348; font-weight:400; }
	.dek { max-width:440px; margin:21px 0 0; color:#6f6c63; font:15px/1.65 system-ui,sans-serif; }
	.workspace { display:grid; grid-template-columns:minmax(0,1fr) 280px; gap:50px; align-items:start; }
	.simulation { min-width:0; border-top:1px solid #dcd9d1; }
	.sim-head { height:44px; display:flex; justify-content:space-between; align-items:center; color:#5f5d55; font:10px 'Source Code Pro',monospace; letter-spacing:.06em; }
	.sim-head>div { display:flex; gap:9px; align-items:center; }
	.sim-head strong { font-size:9px; font-weight:500; }
	.live-dot { width:7px;height:7px;border-radius:50%;background:#788d75; }.live-dot.paused { background:#c17d56; }
	.sim-meta { margin-left:5px;color:#918e85;letter-spacing:0; }
	.sim-time { color:#77746c; }
	.canvas-wrap { position:relative; height:min(66vh,820px); min-height:520px; overflow:hidden; background:#f2f0e9; border:1px solid #e4e1d8; }
	canvas { width:100%;height:100%;display:block;touch-action:none;cursor:grab; } canvas:active { cursor:grabbing; }
	.axis-label { position:absolute; left:12px; color:#aaa69b; font:9px 'Source Code Pro',monospace; letter-spacing:.08em; pointer-events:none; }.axis-label.top { top:12px; }.axis-label.bottom { bottom:12px; }
	.sim-foot { display:flex; justify-content:space-between; gap:10px; padding-top:12px; color:#88857c; font:9px 'Source Code Pro',monospace; }
	.swatch { display:inline-block;width:7px;height:7px;border-radius:50%;background:#c76545;vertical-align:0;margin-right:5px; }
	.controls { padding-top:0; }
	.control-heading { display:flex; justify-content:space-between; border-top:1px solid #dcd9d1; padding:15px 0 20px; color:#55534b; font:10px 'Source Code Pro',monospace; letter-spacing:.1em; }.mono { color:#98958b;letter-spacing:0; }
	.control-group { margin-bottom:22px; }
	.control-group label { display:flex; justify-content:space-between; color:#535149; font:12px system-ui,sans-serif; }
	output { color:#a85740; font:11px 'Source Code Pro',monospace; }
	input[type=range] { width:100%; height:14px; margin:10px 0 0; appearance:none; background:transparent; cursor:pointer; }
	input[type=range]::-webkit-slider-runnable-track { height:2px;background:#d5d1c7; } input[type=range]::-moz-range-track { height:2px;background:#d5d1c7; }
	input[type=range]::-webkit-slider-thumb { appearance:none;width:11px;height:11px;margin-top:-4.5px;border-radius:50%;background:#bd6348;border:1px solid #f7f6f2;box-shadow:0 0 0 1px #bd6348; } input[type=range]::-moz-range-thumb { width:9px;height:9px;border-radius:50%;background:#bd6348;border:1px solid #f7f6f2;box-shadow:0 0 0 1px #bd6348; }
	.range-notes { display:flex;justify-content:space-between;color:#aaa69b;font:9px 'Source Code Pro',monospace; }
	.actions { display:flex;gap:8px;margin-top:29px; }.actions button { height:40px;border:0;cursor:pointer;font:12px system-ui,sans-serif; }
	.primary { flex:1;background:#bd6348;color:#fff9f3; }.primary:hover { background:#a9533c; }.reset { width:42px;background:#e8e5dc;color:#5a584f;font-size:20px!important; }
	.hint { margin:10px 0 28px;color:#97948a;font:10px/1.5 system-ui,sans-serif; }
	.model { border-top:1px solid #dcd9d1;padding-top:16px; }.model .eyebrow { margin-bottom:10px; }.model p:not(.eyebrow) { color:#737067;font:11px/1.6 system-ui,sans-serif;margin:0; }
	.equation { margin-top:13px;color:#8a5948;font:14px Georgia,serif; }
	.credit { display:flex;justify-content:space-between;gap:12px;margin-top:29px;padding-top:13px;border-top:1px solid #dedbd2;color:#969288;font:9px 'Source Code Pro',monospace; }
	@media(max-width:850px) { .page{padding:24px 24px 34px}.workspace{grid-template-columns:minmax(0,1fr) 235px;gap:28px}.intro{padding-top:42px}.canvas-wrap{min-height:470px} }
	@media(max-width:650px) { .page{padding:20px 17px 28px}.topline span{font-size:8px}.intro{padding:38px 0 26px}.dek{font-size:14px}.workspace{grid-template-columns:1fr;gap:30px}.canvas-wrap{height:68vh;min-height:460px}.controls{display:grid;grid-template-columns:1fr 1fr;column-gap:20px}.control-heading,.actions,.hint,.model{grid-column:1/-1}.control-group{margin-bottom:16px}.sim-foot{font-size:8px}.credit{flex-direction:column} }
</style>
