<script>
	import { onMount, onDestroy } from 'svelte';

	let container;
	let p5Instance;

	// Reactive slider state
	let slPlitho = $state(50);
	let slConfinement = $state(50);
	let slSoftRep = $state(50);
	let slAdhStiffness = $state(50);
	let slHeterogeneity = $state(50);
	let slChemo = $state(0);
	let slN = $state(90);

	let restartFlag = $state(0);

	/** Parse a CSS color string (hex or rgb) into [r, g, b] */
	function parseColor(str) {
		if (str.startsWith('#')) {
			const hex = str.slice(1);
			const bigint = parseInt(hex, 16);
			return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
		}
		const m = str.match(/\d+/g);
		return m ? m.slice(0, 3).map(Number) : [128, 128, 128];
	}

	/** Read current theme colors from CSS variables */
	function getThemeColors() {
		const s = getComputedStyle(document.documentElement);
		const bg = parseColor(s.getPropertyValue('--bg').trim());
		const text = parseColor(s.getPropertyValue('--text').trim());
		const accent = parseColor(s.getPropertyValue('--accent').trim());
		const accentSec = parseColor(s.getPropertyValue('--accent-secondary').trim());
		const muted = parseColor(s.getPropertyValue('--text-muted').trim());
		const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
		return { bg, text, accent, accentSec, muted, isDark };
	}

	onMount(async () => {
		const p5Module = await import('p5');
		const p5 = p5Module.default;

		const sketch = (p) => {
			const pv = p5.Vector;

			let colors = getThemeColors();

			const p_def = {
				r: 20,
				r_spread: 5,
				chemo: 0.1,
				run_speed: 1.2,
				tumble_speed: 0.5,
				cil_speed: 0.7,
				cluster_speed: 0.8,
				run_dur: 15.0,
				tumble_dur: 6.0,
				rotation_dur: 2.0,
				cil_dur: 5.0,
				new_adh_dur: 3.0,
				break_adh_dur: 12.0,
				cntc_dur: 1.0,
				diff_coef: 0.02,
				adh_stiffness: 0.02,
				plitho_align: 50,
				plitho_max: 50,
				plitho_min: 0.1,
				plitho_spread: 3.14 / 1.5,
				plitho_dur: 3,
				soft_rep: 0.2,
				wall_rep: 0.2,
				n_substeps: 10,
				mu: 2
			};

			let p1 = { ...p_def };
			const w = 800;
			const h = 600;
			const aspect = w / h;
			const game_mode = 1;

			let cells = [],
				walls = [],
				cnts,
				grads;

			class Cell {
				constructor(t) {
					const alpha = p.random(0, 2 * p.PI);
					this.pol = p.createVector(p.sin(alpha), p.cos(alpha));
					this.f = p.createVector(0.0, 0.0);
					this.r_h = 10;
					this.r_s = 20;
					this.rand = p.random(0, 1);
					this.type = t;
					this.mode = 0;
					this.pos = p.createVector(p.random(0, w / 2), p.random(h / 4, (3 * h) / 4));
				}
				draw() {
					const c = colors.accent;
					p.noStroke();
					// Outer soft radius
					p.fill(c[0], c[1], c[2], colors.isDark ? 50 : 60);
					p.circle(this.pos.x, this.pos.y, this.r_s * 2);
					// Inner hard radius
					p.fill(c[0], c[1], c[2], colors.isDark ? 180 : 200);
					p.circle(this.pos.x, this.pos.y, this.r_h * 2);
					// Polarity line
					const m = colors.muted;
					p.stroke(m[0], m[1], m[2], 140);
					p.strokeWeight(1.5);
					p.line(
						this.pos.x,
						this.pos.y,
						this.pos.x + this.r_s * this.pol.x,
						this.pos.y + this.r_s * this.pol.y
					);
					// Force line
					const as = colors.accentSec;
					p.stroke(as[0], as[1], as[2], 90);
					p.line(
						this.pos.x,
						this.pos.y,
						this.pos.x + this.r_s * this.f.x,
						this.pos.y + this.r_s * this.f.y
					);
				}
			}

			class Contacts {
				constructor(N) {
					this.cnts = [];
					for (let i = 0; i < N; ++i) {
						this.cnts[i] = [];
						for (let j = 0; j < N; ++j) {
							this.cnts[i][j] = false;
						}
					}
				}
				addContact(i, j) {
					this.cnts[i][j] = true;
					this.cnts[j][i] = true;
				}
				removeContact(i, j) {
					this.cnts[i][j] = false;
					this.cnts[j][i] = false;
				}
				hasContact(i, j) {
					return this.cnts[i][j];
				}
				draw(cells) {
					const as = colors.accentSec;
					p.strokeWeight(3);
					p.stroke(
						as[0],
						as[1],
						as[2],
						120 * p.map(p1.adh_stiffness, 0, p_def.adh_stiffness * 2, 0, 2)
					);
					for (let i = 0; i < cells.length; ++i) {
						for (let j = 0; j < i; ++j) {
							if (this.cnts[i][j]) {
								p.line(cells[i].pos.x, cells[i].pos.y, cells[j].pos.x, cells[j].pos.y);
							}
						}
					}
				}
			}

			let N = 100;
			let first_step = true;
			let prevRestartFlag = 0;
			let colorRefreshCounter = 0;

			function init() {
				first_step = true;
				walls = [
					{ pos: p.createVector(w / 2, 10), normal: p.createVector(0.0, 1.0), l: w - 20 },
					{
						pos: p.createVector(w / 2, h - 10),
						normal: p.createVector(0.0, -1.0),
						l: w - 20
					},
					{ pos: p.createVector(10, h / 2), normal: p.createVector(1.0, 0.0), l: h - 20 },
					{
						pos: p.createVector(w - 10, h / 2),
						normal: p.createVector(-1.0, 0.0),
						l: h - 20
					}
				];
				grads = { pos: p.createVector(w - 10, 128 + (h - 128) / 2) };

				cells.length = 0;
				for (let i = 0; i < N; i++) {
					cells.push(new Cell(0));
				}

				cnts = new Contacts(cells.length);
				cnts.addContact(0, 1);
			}

			p.setup = function () {
				const width_proposal = container.clientWidth;
				const height_proposal = Math.round(width_proposal / aspect);
				p.createCanvas(width_proposal, height_proposal);
				p.frameRate(30);
				init();
			};

			let t = 0.0;
			const modeRun = 0;
			const modeTumble = 1;
			const modeCIL = 2;
			const modeCluster = 3;
			const tf = 1000;

			function expRand(rate) {
				return p.random() <= 1.0 - p.exp(-p.deltaTime / (rate * tf));
			}

			function P(i) {
				return p1;
			}

			function timeStep() {
				if (restartFlag !== prevRestartFlag) {
					prevRestartFlag = restartFlag;
					init();
					return;
				}

				if (slN != cells.length) {
					N = Math.max(slN, 2);
					init();
				}

				p1.chemo = (slChemo / 100) * p_def.chemo;
				p1.plitho_align = (slPlitho / 100) * p_def.plitho_align;
				p1.r_spread =
					(4 - p.map(100 - slHeterogeneity, 0, 100, 0, 4)) * p_def.r_spread;
				p1.adh_stiffness =
					p.map(slAdhStiffness, 0, 100, 0, 2) *
					p.map(slAdhStiffness, 0, 100, 0, 2) *
					p_def.adh_stiffness;
				p1.soft_rep = p.map(slSoftRep, 0, 100, 0.7, 2) * p_def.soft_rep;

				const p_wall = p.sqrt(slConfinement / 100);
				walls[0].pos.y = 10 + (p_wall * (h - 40)) / 2;
				walls[1].pos.y = h - (p_wall * (h - 40)) / 2;

				for (let i = 0; i < cells.length; ++i) {
					cells[i].r_s = p1.r + p1.r_spread * (p.pow(cells[i].rand, 2) - 0.5);
					cells[i].r_h = cells[i].r_s / 2;
				}

				const dt = p.min(p.deltaTime / p1.n_substeps, 50 / p1.n_substeps);

				for (let step = 0; step < p1.n_substeps; ++step) {
					for (let i = 0; i < cells.length; ++i) {
						for (let j = 0; j < i; ++j) {
							if (expRand(p1.break_adh_dur)) {
								cnts.removeContact(i, j);
							}
						}
					}

					for (let i = 0; i < cells.length; ++i) {
						for (let j = 0; j < i; ++j) {
							const Rij = cells[i].r_s + cells[j].r_s;
							if (
								cells[i].type == cells[j].type &&
								pv.dist(cells[i].pos, cells[j].pos) < Rij &&
								expRand(P(i).new_adh_dur)
							) {
								cnts.addContact(i, j);
							}
						}
					}

					for (let i = 0; i < cells.length; ++i) {
						let n_contacts = 0;
						let j = 0;
						for (let k = 0; k < cells.length; ++k) {
							if (cnts.hasContact(i, k)) {
								n_contacts += 1;
								j = k;
							}
						}

						let mi = cells[i].mode;
						if (
							(mi == modeRun || mi == modeTumble) &&
							n_contacts > 0 &&
							expRand(p1.cntc_dur)
						) {
							if (n_contacts == 1) {
								cells[i].mode = modeCIL;
								cells[i].pol.normalize().mult(p1.cil_speed);
							} else {
								cells[i].mode = modeCluster;
								cells[i].pol.normalize().mult(p1.cluster_speed);
							}
						} else if (mi == modeRun) {
							if (expRand(p1.run_dur)) {
								cells[i].mode = modeTumble;
								cells[i].pol.normalize().mult(p1.tumble_speed);
							}
						} else if (mi == modeTumble) {
							if (expRand(p1.tumble_dur)) {
								cells[i].mode = modeRun;
								cells[i].pol.normalize().mult(p1.run_speed);
							} else if (expRand(p1.rotation_dur)) {
								cells[i].pol.x = p.sin(p.random(0, 2 * p.PI));
								cells[i].pol.y = p.cos(p.random(0, 2 * p.PI));
								cells[i].pol.normalize().mult(p1.run_speed);
							}
						} else if (mi == modeCIL) {
							if (n_contacts > 1) {
								cells[i].mode = modeCluster;
								cells[i].pol.normalize().mult(p1.cluster_speed);
							} else if (expRand(p1.cil_dur)) {
								if (n_contacts >= 1) {
									cnts.removeContact(i, j);
									const xixj = pv.sub(cells[j].pos, cells[i].pos);
									cells[j].mode = modeRun;
									cells[j].pol.set(xixj);
									cells[j].pol.normalize().mult(p1.run_speed);
									cells[i].pol.set(xixj).mult(-1);
								}
								cells[i].mode = modeRun;
								cells[i].pol.normalize().mult(p1.run_speed);
							}
						} else if (mi == modeCluster) {
							if (n_contacts == 0) {
								cells[i].mode = modeRun;
								cells[i].pol.normalize().mult(p1.run_speed);
							} else if (n_contacts == 1) {
								cells[i].mode = modeCIL;
								cells[i].pol.normalize().mult(p1.cil_speed);
							} else {
								const s = cells[i].pol.mag();
								let rate = P(i).plitho_dur;
								if (s > 0) {
									rate +=
										(P(i).plitho_align / p1.mu) *
										(pv.dot(cells[i].pol, cells[i].f) / s);
								}
								rate = p.min(p1.plitho_max, rate);
								rate = p.max(p1.plitho_min, rate);
								if (expRand(rate)) {
									cells[i].pol
										.set(cells[i].f)
										.normalize()
										.mult(P(i).cluster_speed)
										.rotate(p.random(-1, 1) * P(i).plitho_spread);
								}
							}
						}
					}

					const mu_f = 0.1;
					for (let i = 0; i < cells.length; ++i) {
						cells[i].f.set(0.0, 0.0);
						if (p1.chemo > 0) {
							const xica = pv.sub(grads.pos, cells[i].pos);
							const angl = xica.angleBetween(cells[i].pol);
							cells[i].pol.setHeading(
								cells[i].pol.heading() - (dt / 100) * P(i).chemo * angl
							);
						}
					}

					for (let i = 0; i < cells.length; ++i) {
						cells[i].f.add(pv.mult(cells[i].pol, p1.mu));

						for (let j = 0; j < i; ++j) {
							const xixj = pv.sub(cells[j].pos, cells[i].pos);
							if (cnts.hasContact(i, j)) {
								cells[i].f.add(pv.mult(xixj, p1.adh_stiffness));
								cells[j].f.sub(pv.mult(xixj, p1.adh_stiffness));
							}

							const d = pv.dist(cells[j].pos, cells[i].pos);
							const Rij = cells[i].r_s + cells[j].r_s;
							if (d < Rij && d > Rij / 10) {
								cells[i].f.add(pv.mult(xixj, (-P(i).soft_rep * (Rij - d)) / d));
								cells[j].f.sub(pv.mult(xixj, (-P(j).soft_rep * (Rij - d)) / d));
							}
						}

						for (let iw = 0; iw < walls.length; ++iw) {
							const wall = walls[iw];
							const d = pv.dot(pv.sub(cells[i].pos, wall.pos), wall.normal);
							if (
								d > 0 &&
								p.abs(d) < cells[i].r_s &&
								pv.dist(cells[i].pos, wall.pos) < wall.l / 2 + cells[i].r_h
							) {
								cells[i].f.sub(
									pv.mult(wall.normal, (p.abs(d) - cells[i].r_s) * P(i).soft_rep)
								);
							}
							if (
								d < 0 &&
								p.abs(d) < cells[i].r_s &&
								pv.dist(cells[i].pos, wall.pos) < wall.l / 2 + cells[i].r_h
							) {
								cells[i].f.add(
									pv.mult(wall.normal, (p.abs(d) - cells[i].r_s) * P(i).soft_rep)
								);
							}
						}
					}

					for (let i = 0; i < cells.length; ++i) {
						cells[i].pos.x += p.sqrt(dt) * p1.diff_coef * p.randomGaussian();
						cells[i].pos.y += p.sqrt(dt) * p1.diff_coef * p.randomGaussian();
						cells[i].pos.x += (mu_f * dt * cells[i].f.x) / p1.mu;
						cells[i].pos.y += (mu_f * dt * cells[i].f.y) / p1.mu;
					}

					for (let i = 0; i < cells.length; ++i) {
						for (let j = 0; j < i; ++j) {
							const Rij = cells[i].r_h + cells[j].r_h;
							const d = pv.dist(cells[i].pos, cells[j].pos) - Rij;
							if (d < 0.0 && d != -Rij) {
								const xixj = pv.sub(cells[i].pos, cells[j].pos);
								xixj.mult((0.5 * d) / (d + Rij));
								cells[i].pos.sub(xixj);
								cells[j].pos.add(xixj);
							}
						}

						for (let iw = 0; iw < walls.length; ++iw) {
							const wall = walls[iw];
							let d = pv.dot(pv.sub(cells[i].pos, wall.pos), wall.normal);
							if (!first_step && game_mode == 1) {
								if (d < cells[i].r_h) {
									cells[i].pos.sub(pv.mult(wall.normal, d - cells[i].r_h));
								}
							} else {
								d -= cells[i].r_h;
								if (d < 0) {
									cells[i].pos.sub(pv.mult(wall.normal, d));
								}
							}
						}
					}
				}

				first_step = false;
			}

			let dragging = false;
			let dragIndex = -1;
			let sX, sY;

			p.draw = function () {
				// Refresh theme colors periodically (every ~1s at 30fps)
				colorRefreshCounter++;
				if (colorRefreshCounter % 30 === 0) {
					colors = getThemeColors();
				}

				const bg = colors.bg;
				p.background(bg[0], bg[1], bg[2]);

				const aspect_adj = p.width / p.height;
				sX = p.width / w;
				sY = (p.height / h) * (aspect_adj / aspect);
				p.scale(sX, sY);
				p.strokeWeight(2);
				p.noStroke();

				// Chemotaxis gradient
				if (p1.chemo > 0) {
					const as = colors.accentSec;
					for (let r = 25; r >= 0; --r) {
						p.noStroke();
						p.fill(as[0], as[1], as[2], 40.0 * p1.chemo * (1 - r / 25));
						p.circle(grads.pos.x, grads.pos.y, r * 30);
					}
				}

				t = t + p.deltaTime;
				timeStep();

				if (dragging && dragIndex >= 0 && dragIndex < cells.length) {
					cells[dragIndex].pos.x = p.mouseX / sX;
					cells[dragIndex].pos.y = p.mouseY / sY;
				}

				cnts.draw(cells);
				for (let i = 0; i < cells.length; ++i) {
					cells[i].draw();
				}

				// Draw walls
				const wc = colors.text;
				for (let i = 0; i < walls.length; i++) {
					const wl = walls[i];
					const dx = (wl.normal.y * wl.l) / 2;
					const dy = (-wl.normal.x * wl.l) / 2;
					p.stroke(wc[0], wc[1], wc[2], 180);
					p.strokeWeight(2);
					p.line(wl.pos.x - dx, wl.pos.y - dy, wl.pos.x + dx, wl.pos.y + dy);
				}
			};

			p.mousePressed = function () {
				let dm = 2 * (w + h);
				let di;
				const mouse = p.createVector(p.mouseX / sX, p.mouseY / sY);
				for (let i = 0; i < cells.length; ++i) {
					di = mouse.dist(cells[i].pos);
					if (di < dm) {
						dragIndex = i;
						dm = di;
					}
				}
				if (dragIndex >= 0 && dragIndex < cells.length && dm <= cells[dragIndex].r_s) {
					dragging = true;
				}
			};

			p.mouseReleased = function () {
				dragging = false;
			};

			p.windowResized = function () {
				const width_proposal = container.clientWidth;
				const height_proposal = Math.round(width_proposal / aspect);
				p.resizeCanvas(width_proposal, height_proposal);
			};
		};

		p5Instance = new p5(sketch, container);
	});

	onDestroy(() => {
		if (p5Instance) {
			p5Instance.remove();
		}
	});

	function handleRestart() {
		restartFlag++;
	}
</script>

<div class="sim-wrapper">
	<div class="sim-controls">
		<label>
			<span>Plithotaxis</span>
			<input type="range" bind:value={slPlitho} min="0" max="100" />
		</label>
		<label>
			<span>Confinement</span>
			<input type="range" bind:value={slConfinement} min="0" max="100" />
		</label>
		<label>
			<span>Cell-cell repulsion</span>
			<input type="range" bind:value={slSoftRep} min="0" max="100" />
		</label>
		<label>
			<span>Adhesion strength</span>
			<input type="range" bind:value={slAdhStiffness} min="0" max="100" />
		</label>
		<label>
			<span>Heterogeneity</span>
			<input type="range" bind:value={slHeterogeneity} min="0" max="100" />
		</label>
		<label>
			<span>Chemotaxis</span>
			<input type="range" bind:value={slChemo} min="0" max="100" />
		</label>
		<label>
			<span>Number of cells</span>
			<input type="range" bind:value={slN} min="0" max="120" step="10" />
		</label>
	</div>

	<div bind:this={container} class="sim-canvas"></div>

	<div class="sim-footer">
		<button class="sim-restart" onclick={handleRestart}>Restart</button>
	</div>
</div>

<style>
	.sim-wrapper {
		max-width: 680px;
		margin: 1.5rem auto;
	}

	.sim-controls {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem 1rem;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 0.75rem;
		background: var(--bg-card);
		border: 1px solid var(--bg-card-border);
	}

	@media (min-width: 640px) {
		.sim-controls {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.sim-controls label {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		font-size: 0.78rem;
		color: var(--text-muted);
		letter-spacing: 0.01em;
	}

	.sim-controls input[type='range'] {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 4px;
		border-radius: 2px;
		background: var(--bg-card-border);
		outline: none;
		cursor: pointer;
	}

	.sim-controls input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--accent);
		border: 2px solid var(--bg);
		cursor: pointer;
		transition: transform 0.1s;
	}

	.sim-controls input[type='range']::-webkit-slider-thumb:hover {
		transform: scale(1.2);
	}

	.sim-controls input[type='range']::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--accent);
		border: 2px solid var(--bg);
		cursor: pointer;
	}

	.sim-controls input[type='range']::-moz-range-track {
		height: 4px;
		border-radius: 2px;
		background: var(--bg-card-border);
	}

	.sim-canvas {
		width: 100%;
		border-radius: 0.5rem;
		overflow: hidden;
		border: 1px solid var(--bg-card-border);
	}

	/* Ensure p5 canvas fills the container */
	.sim-canvas :global(canvas) {
		display: block;
		width: 100% !important;
		height: auto !important;
	}

	.sim-footer {
		display: flex;
		justify-content: center;
		margin-top: 0.5rem;
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
