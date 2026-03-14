<script>
	import { onMount, onDestroy } from 'svelte';

	let container;
	let p5Instance;

	function init() {
		if (p5Instance) {
			p5Instance.remove();
		}
	}

	onMount(async () => {
		const p5Module = await import('p5');
		const p5 = p5Module.default;

		const sketch = (p) => {
			const pv = p5.Vector;
			const w = 240;
			const h = 320;
			const n_sub = 40;
			const x_0 = w / 2;
			const y_0 = h / 4;
			let cooldown = 0;

			const g = 0.001;
			function f(_z) {
				return p.createVector(0.0, g);
			}

			const R = 20;
			let X = [];
			let V = [];
			let X_old = [];

			function resetSim() {
				X.length = 0;
				V.length = 0;
				X_old.length = 0;
				X[0] = p.createVector(x_0, y_0);
				V[0] = p.createVector(0.0, 0.0);
				cooldown = 0;
			}

			p.setup = function () {
				p.createCanvas(w, h);
				p.frameRate(30);
				resetSim();
			};

			p.draw = function () {
				p.background(255, 255, 255);

				const N = X.length;
				const dt = p.deltaTime / n_sub;

				for (let k = 0; k < n_sub; ++k) {
					for (let i = 0; i < N; ++i) {
						if (X_old.length <= i) {
							X_old[i] = p.createVector(0.0, 0.0);
						}
						X_old[i].set(X[i].x, X[i].y);
					}

					if (cooldown <= 0) {
						for (let i = 0; i < N; ++i) {
							V[i].add(pv.mult(f(X[i]), dt));
							X[i].add(pv.mult(V[i], dt));
						}
					}

					for (let i = 0; i < N; ++i) {
						if (X[i].y > h - R) {
							X[i].y = h - R;
						}
						if (X[i].x > w - R) {
							X[i].x = w - R;
						}
						if (X[i].x < R) {
							X[i].x = R;
						}
					}

					for (let i = 0; i < N; ++i) {
						for (let j = 0; j < i; ++j) {
							let d = pv.dist(X[i], X[j]);
							if (d - 2 * R < 0 && d > 0) {
								const xixj = pv.mult(pv.sub(X[i], X[j]), (0.5 * (d - 2 * R)) / d);
								X[i].sub(xixj);
								X[j].add(xixj);
							}
						}
					}

					if (cooldown <= 0) {
						for (let i = 0; i < N; ++i) {
							V[i] = pv.mult(pv.sub(X[i], X_old[i]), 1.0 / dt);
						}
					} else {
						cooldown = cooldown - 1;
					}
				}

				p.noStroke();
				for (let i = 0; i < N; ++i) {
					p.fill(200, 50, 50);
					p.circle(X[i].x, X[i].y, 2 * R);
					p.fill(30, 150, 30);
					p.triangle(
						X[i].x - 0.1 * R,
						X[i].y - 0.8 * R,
						X[i].x + 0.5 * R,
						X[i].y - 1.1 * R,
						X[i].x + 0.3 * R,
						X[i].y - 1.3 * R
					);
				}
			};

			p.mouseClicked = function () {
				if (p.mouseX < 0 || p.mouseX > w || p.mouseY < 0 || p.mouseY > h) return;
				const N = X.length;
				X[N] = p.createVector(p.mouseX, p.mouseY);
				V[N] = p.createVector(0.0, 0.0);

				cooldown = 0;
				const newN = X.length;
				for (let i = 0; i < newN; ++i) {
					for (let j = 0; j < i; ++j) {
						let d = pv.dist(X[i], X[j]);
						if (d - 2 * R < 0 && d > 0) {
							cooldown = 2 * n_sub;
						}
					}
				}
			};

			// Expose reset for external button
			p._resetSim = resetSim;
		};

		p5Instance = new p5(sketch, container);
	});

	onDestroy(() => {
		if (p5Instance) {
			p5Instance.remove();
		}
	});

	function restart() {
		if (p5Instance && p5Instance._resetSim) {
			p5Instance._resetSim();
		}
	}
</script>

<div class="sim-wrapper">
	<div class="sim-canvas-row">
		<div bind:this={container} class="sim-canvas"></div>
	</div>
	<div class="sim-controls">
		<button class="sim-restart" onclick={restart}>Restart</button>
	</div>
</div>

<style>
	.sim-wrapper {
		max-width: 680px;
		margin: 1.5rem auto;
	}

	.sim-canvas-row {
		display: flex;
		justify-content: center;
	}

	.sim-canvas {
		border: 1px solid var(--bg-card-border);
		border-radius: 0.5rem;
		overflow: hidden;
		width: 240px;
	}

	.sim-controls {
		display: flex;
		justify-content: center;
		margin-top: 0.75rem;
	}

	.sim-restart {
		font-size: 0.8rem;
		padding: 0.3rem 1.2rem;
		border-radius: 0.375rem;
		border: 1px solid var(--bg-card-border);
		background: var(--bg-card);
		color: var(--text-muted);
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s;
	}

	.sim-restart:hover {
		background: var(--accent);
		color: var(--bg);
		border-color: var(--accent);
	}
</style>
