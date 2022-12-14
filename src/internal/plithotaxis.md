---
title: "Simulation cell migration with plithotaxis"
start: 2021-06-01
layout: simulation
desc: Development of an agent-based cell migration model for plithotaxis.
---

# {{ title }}

**This is an internal page for collaborators.** 
If you see this page, you should know why you are here and expect work in progress.

To change parameters, use the user inferface below (or on the righ side). 
In addition, 
- you can drag & drop the cells with the mouse and
- change the walls with mouse (+ mousewheel for rotation).

<div class="grid md:grid-cols-3 gap-4 grid-cols-2 mx-auto">

<div id="sim_div" class="col-span-2">
</div>
<div id="tp_container" class="col-span-1">
</div>
</div>

<div>

<script async defer>
        /* 
            units: µm | min | .
        */


        let sim_cm = function (p) {

            let parent = document.getElementById('sim_div');

            const darkMode = true;

            let p_def = {
                confinement: 0.65,
                N: 50,
                r: 10.0,
                r_h: 50,
                run_speed: 3.0,
                tumble_speed: 1.0,
                cil_speed: 1.0,
                cluster_speed: 2.0,
                run_dur: 30.0,
                tumble_dur: 6.0,
                rotation_dur: 2.0,
                cil_dur: 5.0,
                cil_init_dur: 2.0,
                cil_spread: 90.0,
                new_adh_dur: 2.0,
                break_adh_dur: 15.0,
                adh_stiffness: 0.3,
                plitho_dur: 30,
                plitho_min_dur: 5,
                plitho_max_dur: 45,
                plitho_align: 20,
                plitho_spread: 10,
                chemo: 0.0,
                soft_rep: 3,
                wall_rep: 1,
                diff_coef: 0.02,
                n_substeps: 40,
                show_forces: 1,
                speed_factor: 0.5,
                zoom: 1.0,
                w: 600,
                h: 600 * 3/4,
                mu: 2
            };

            let p_mod = {
                env1: {
                    attack: 1.,
                    release: 1.,
                    target: "none",
                    scale: 0.0,
                    val: 0.0,
                },
                random1: {
                    target: "none",
                    scale: 0.0,
                },

                random_seed: true,
                random_walls: false,
                restart: function () { init() }
            };


            let p1 = { ...p_def };
            let p2 = { ...p_def };
            // global (constant) parameters 
            // internal width/height of the scene
            const aspect = p_def.w / p_def.h;

            const pv = p5.Vector;
            const game_mode = 1;

            let cells = [], walls = [], cnts, grads;
            let obstacles = [];


            function init_gui() {

                const pane = new Tweakpane.Pane({title: "Parameters", 
                    container: document.getElementById('tp_container')});

                const gui_general = pane.addFolder({title: "General",  expanded: true});                
                //const gui_domain = pane.addFolder({title: "Domain",  expanded: false});          
                const gui_cell = pane.addFolder({title: "Cell",  expanded: false});          
                const gui_run_tumble = pane.addFolder({title: "Run & tumble",  expanded: false});          
                const gui_adh = pane.addFolder({title: "Adhesive bonds",  expanded: false});          
                const gui_cil = pane.addFolder({title: "CIL",  expanded: false});     
                const gui_clu = pane.addFolder({title: "Cluster",  expanded: false});
                const gui_mod = pane.addFolder({title: "Modulation",  expanded: false});

                var sl_N = gui_general.addInput(p_def, 'N', {label: "#cells [needs restart]", min:5, max:200, step:5});
                gui_general.addInput(p_def, 'speed_factor', {label:'simulation speed [h/real sec]', min:0.0, max:2, step:0.01});
                const btn_r = gui_general.addButton({title: "Restart sim"});
                gui_general.addInput(p_mod, 'random_seed');
                gui_general.addInput(p_mod, 'random_walls');

                btn_r.on('click', () => { init(); });


                //sl_w = gui_domain.add(p_def, 'w', 50, 800, 10).name('Screen w [µm]');
                //sl_h = gui_domain.add(p_def, 'h', 50, 800, 10).name('Screen h [µm]');

                //sl_r = gui_cell.add(p_def, 'r', 1.0, 40.0, 0.1).name('R [µm]');
                //sl_rh = gui_cell.add(p_def, 'r_h', 0.0, 100.0, 1.0).name('R hard [% R]');
                const sl_rh = gui_cell.addInput(p_def, 'soft_rep', {label:"Soft repulsion [rel]", min:0.0, max:5.0, step:0.1});

                gui_run_tumble.addInput(p_def, 'run_dur', {label:'Run duration [min]',min:0.0, max:60, step:1});
                gui_run_tumble.addInput(p_def, 'run_speed', {label:'Running speed [µm/min]',min:0.0, max:5, step:0.1});
                gui_run_tumble.addInput(p_def, 'tumble_dur', {label:'Tumble duration [min]',min:0.0, max:60, step:1});
                gui_run_tumble.addInput(p_def, 'tumble_speed', {label:'Tumble speed [µm/min]',min:0.0, max:5, step:0.1});
                gui_run_tumble.addInput(p_def, 'rotation_dur', {label:'Rotate duration [min]',min:0.0, max:30, step:0.1});


                gui_adh.addInput(p_def, 'new_adh_dur', {label:'Avg duration of new bonds [min]', min:0.0, max:30, step:1.0});
                gui_adh.addInput(p_def, 'break_adh_dur', {label:'Avg duration before breaking [min]',min:0.0, max:30, step:1.0});
                gui_adh.addInput(p_def, 'adh_stiffness', {label:'Stiffness of adhesive bonds [?]',min:0.0, max:0.5, step:0.01});

                gui_cil.addInput(p_def, 'cil_dur', {label:'CIL duration [min]',min:0.0, max:60, step:1.0});
                gui_cil.addInput(p_def, 'cil_init_dur', {label:'duration of initiation of CIL [min]',min:0.0, max:12, step:1.0});
                gui_cil.addInput(p_def, 'cil_speed', {label:'speed of cells during CIL [µm/min]',min:0.0, max:5, step:0.1});
                gui_cil.addInput(p_def, 'cil_spread', {label:'spread of post-CIL direction [deg]',min:0.0, max:180, step:1.0});

                gui_clu.addInput(p_def, 'plitho_dur', {label:'base period of repolarisation [min]',min:0, max:60, step:1.0});
                gui_clu.addInput(p_def, 'cluster_speed', {label:'speed of cells in a cluster [µm/min]',min:0.0, max:5, step:0.1});
                gui_clu.addInput(p_def, 'plitho_min_dur', {label:'min time before repolarisation [min]',min:0, max:60, step:1.0});
                gui_clu.addInput(p_def, 'plitho_max_dur', {label:'max time before repolarisation [min]',min:0, max:60, step:1.0});
                gui_clu.addInput(p_def, 'plitho_align', {label:'impact of alignment on repolarisation [?]',min:0, max:500, step:1.0});
                gui_clu.addInput(p_def, 'plitho_spread', {label:'spread of new directions [deg]',min:0, max:60, step:1.0});

/*
                var gui_env1 = gui_mod.addFolder("Envelope (time)");
                gui_env1.add(p_mod.env1, 'attack', 0, 10, 0.1).name("Increase [1/h]");
                gui_env1.add(p_mod.env1, 'release', 0, 10, 0.1).name("Decrease [1/h]");
                gui_env1.add(p_mod.env1, 'target', { Adhesion: "adhesion", }).name("Target");
                gui_env1.add(p_mod.env1, 'scale', -2.0, 2.0, 0.1).name("Scale [rel]");


                var gui_random1 = gui_mod.addFolder("Randomise (per cell)");
                var r1_t = gui_random1.add(p_mod.random1, 'target', { Radius: "r", }).name("Target");
                var r1_s = gui_random1.add(p_mod.random1, 'scale', 0.0, 200.0, 1.0).name("Scale [%]");

*/

            }


            // model parameters
            const D = 0.2;

            class Cell {
                constructor(t) {
                    const alpha = p.random(0, 2 * p.PI);
                    this.pol = p.createVector(p.sin(alpha), p.cos(alpha));
                    this.f = p.createVector(0.0, 0.0);
                    this.r_h = 10;  // in mu meter
                    this.r_s = 20;  // in mu meter
                    this.rand = p.random(0, 1);
                    this.type = t;
                    this.mode = 0;
                    this.pos = p.createVector(p.random(0, p_def.w / 2), p.random(p_def.h / 4, 3 * p_def.h / 4));
                    this.col = { r: 80, g: 150, b: 50 };
                }
                draw() {
                    p.noStroke();
                    p.fill(this.col.r, this.col.g, this.col.b, 80);
                    p.circle(this.pos.x, this.pos.y, this.r_s * 2);


                    if (this.mode == 0) {
                        p.fill(this.col.r, this.col.g + 100, this.col.b);
                    }
                    else if (this.mode == 1) {
                        p.fill(this.col.r, this.col.g, this.col.b);
                    }
                    else if (this.mode == 2) {
                        p.fill(this.col.r + 100, this.col.g, this.col.b);
                    }
                    else {
                        p.fill(this.col.r, this.col.g, this.col.b + 100);
                    }
                    p.circle(this.pos.x, this.pos.y, this.r_h * 2);

                    // p.fill(this.col.r, this.col.g, this.col.b);
                    // p.circle(this.pos.x, this.pos.y, this.r_h*2);

                    p.stroke(50, 50, 50, 250);
                    p.line(this.pos.x, this.pos.y, this.pos.x + this.r_s * this.pol.x, this.pos.y + this.r_s * this.pol.y);
                    if (true) {
                        p.stroke(150, 0, 0, 120 * p_def.show_forces);
                        p.line(this.pos.x, this.pos.y, this.pos.x + this.r_s * this.f.x / 2, this.pos.y + this.r_s * this.f.y / 2);
                    }
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
                    p.stroke(200, 100, 0, 120 * p.map(p1.adh_stiffness, 0, p_def.adh_stiffness * 2, 0, 2));
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

            function init() {

                if (!p_mod.random_seed) {
                    p.randomSeed(0);
                }
                obstacles.length = 0;

                t = 0.0;
                p_mod.env1.val = 0.0;
                N = p_def.N;

                first_step = true
                switch (game_mode) {
                    default:
                        if (p_mod.random_walls || walls.length == 0) {
                            walls = [
                                { pos: p.createVector(p_def.w / 2, p_def.h / 3), normal: p.createVector(0.0, 1.0), l: p_def.w - 20 },
                                { pos: p.createVector(p_def.w / 2, 1 * p_def.h /2), normal: p.createVector(0.0, -1.0), l: p_def.w - 20 },
                                { pos: p.createVector(10, p_def.h / 2), normal: p.createVector(1.0, 0.0), l: p_def.h - 20 },
                                { pos: p.createVector(p_def.w - 10, p_def.h / 2), normal: p.createVector(-1.0, 0.0), l: p_def.h - 20 }]
                        }
                        grads = { pos: p.createVector(p_def.w - 10, 128 + ((p_def.h - 128) / 2)) };

                        cells.length = 0;
                        for (let i = 0; i < N; i++) {
                            cells.push(new Cell(0));
                        }

                        cells.length = 0;
                        const N2 = N; //round(N/2);
                        for (let i = 0; i < N2; i++) {
                            cells.push(new Cell(0));
                        }

                        for (let i = N2; i < N; i++) {
                            cells.push(new Cell(1));
                        }


                        for (let i = 0; i < cells.length; ++i) {
                            cells[i].r_s = p_def.r;
                            cells[i].r_h = cells[i].r_s * p_def.r_h / 100;
                        }
                }

                cnts = new Contacts(cells.length);
                cnts.addContact(0, 1);

            }

            p.setup = function () {
                const height_proposal = parent.clientHeight;
                const width_proposal = parent.clientWidth;
                const aspect_proposal = width_proposal / height_proposal;
                p.createCanvas(width_proposal, height_proposal * aspect_proposal / aspect);
                p.frameRate(25);
                init_gui();
                init();
            }

            let t = 0.0;

            const modeRun = 0;
            const modeTumble = 1;
            const modeCIL = 2;
            const modeCluster = 3;
            var dt;

            function expRand(rate) {
                return p.random() <= (1.0 - p.exp(-dt / rate));
            }


            function P(i) {
                return (game_mode == 0 || cells[i].type == 0) ? p1 : p2;
            }



            function timeStep() {


                Object.assign(p1, p_def);
                dt = p.min(p.deltaTime, 100) / 1000 * 60 * p_def.speed_factor / p1.n_substeps;

                // update envelope 1 
                const ea = 1 / p_mod.env1.attack;
                const er = 1 / p_mod.env1.release;
                p_mod.env1.val = p.max(0, p.min(ea * t, er * (100 / ea - t) + 100));


                for (let step = 0; step < p1.n_substeps; ++step) {

                    t = t + dt;

                    // remove contacts 
                    for (let i = 0; i < cells.length; ++i) {
                        for (let j = 0; j < i; ++j) {
                            if (expRand(p1.break_adh_dur)) {
                                cnts.removeContact(i, j);
                            }
                        }
                    }

                    // add contacts
                    for (let i = 0; i < cells.length; ++i) {
                        for (let j = 0; j < i; ++j) {
                            const Rij = cells[i].r_s + cells[j].r_s;
                            if (cells[i].type == cells[j].type && pv.dist(cells[i].pos, cells[j].pos) < Rij && expRand(P(i).new_adh_dur)) {
                                cnts.addContact(i, j);
                            }
                        }
                    }

                    // switch between modes
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
                        if ((mi == modeRun || mi == modeTumble) && n_contacts > 0 ) {
                            if (n_contacts == 1) {
                                cells[i].mode = modeCIL;
                                cells[i].pol.normalize().mult(p1.cil_speed);
                            }
                            else {
                                cells[i].mode = modeCluster;
                                cells[i].pol.normalize().mult(p1.cluster_speed);
                            }
                        }
                        else if (mi == modeRun) {
                            if (expRand(p1.run_dur)) {
                                cells[i].mode = modeTumble;
                                cells[i].pol.normalize().mult(p1.tumble_speed);

                            }
                        } else if (mi == modeTumble) {
                            if (expRand(p1.tumble_dur)) {
                                cells[i].mode = modeRun;
                                cells[i].pol.normalize().mult(p1.run_speed);
                            }
                            else if (expRand(p1.rotation_dur)) {
                                cells[i].pol.x = p.sin(p.random(0, 2 * p.PI));
                                cells[i].pol.y = p.cos(p.random(0, 2 * p.PI));
                                cells[i].pol.normalize().mult(p1.run_speed);
                            }
                        }
                        else if (mi == modeCIL) {
                            if (n_contacts > 1) {
                                cells[i].mode = modeCluster;
                                cells[i].pol.normalize().mult(p1.cluster_speed);
                            }
                            else if (expRand(p1.cil_dur)) {
                                if (n_contacts >= 1) {
                                    cnts.removeContact(i, j);

                                    const xixj = pv.sub(cells[j].pos, cells[i].pos);
                                    cells[j].mode = modeRun;
                                    cells[j].pol.set(xixj);
                                    cells[j].pol.rotate(p1.cil_spread * p.random(-1, 1) * p.PI / 180);
                                    cells[j].pol.normalize().mult(p1.run_speed);

                                    cells[i].pol.set(xixj).mult(-1);
                                    cells[i].pol.rotate(p1.cil_spread * p.random(-1, 1) * p.PI / 180);
                                }
                                cells[i].mode = modeRun;
                                cells[i].pol.normalize().mult(p1.run_speed);
                            }
                        }
                        else if (mi == modeCluster) {
                            if (n_contacts == 0) {
                                cells[i].mode = modeRun;
                                cells[i].pol.normalize().mult(p1.run_speed);
                            }
                            else if (n_contacts == 1) {
                                cells[i].mode = modeCIL;
                                cells[i].pol.normalize().mult(p1.cil_speed);
                            }
                            else {
                                const s = cells[i].pol.mag();
                                let rate = P(i).plitho_dur;
                                if (s > 0) {
                                    rate += P(i).plitho_align / p1.mu * pv.dot(cells[i].pol, cells[i].f) / s;
                                }
                                rate = p.min(p1.plitho_max_dur, rate);
                                rate = p.max(p1.plitho_min_dur, rate);

                                if (expRand(rate)) {
                                    cells[i].pol.set(cells[i].f)
                                        .normalize()
                                        .mult(P(i).cluster_speed).rotate(p.PI * p.random(-1, 1) * P(i).plitho_spread);
                                }
                            }
                        }
                    }

                    // compute forces 
                    for (let i = 0; i < cells.length; ++i) {
                        cells[i].f.set(0.0, 0.0);

                        if (p1.chemo > 0) {
                            xica = pv.sub(grads.pos, cells[i].pos);
                            const angl = xica.angleBetween(cells[i].pol);
                            cells[i].pol.setHeading(cells[i].pol.heading() - dt / 100 * P(i).chemo * angl);
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
                                cells[i].f.add(pv.mult(xixj, -P(i).soft_rep * (Rij - d) / d));
                                cells[j].f.sub(pv.mult(xixj, -P(j).soft_rep * (Rij - d) / d));
                            }
                        }

                        for (let iw = 0; iw < walls.length; ++iw) {
                            const wall = walls[iw];
                            const d = pv.dot(pv.sub(cells[i].pos, wall.pos), wall.normal);
                            if (d > 0 && p.abs(d) < cells[i].r_s && pv.dist(cells[i].pos, wall.pos) < wall.l / 2 + cells[i].r_h) {
                                cells[i].f.sub(pv.mult(wall.normal, (p.abs(d) - cells[i].r_s) * P(i).soft_rep));
                            }
                            if (d < 0 && p.abs(d) < cells[i].r_s && pv.dist(cells[i].pos, wall.pos) < wall.l / 2 + cells[i].r_h) {
                                cells[i].f.add(pv.mult(wall.normal, (p.abs(d) - cells[i].r_s) * P(i).soft_rep));
                            }
                        }

                        for( let jo = 0; jo < obstacles.length; ++jo) {
                            const obs = obstacles[jo];
                            const d = pv.dist(obs, cells[i].pos);
                            if( d < cells[i].r_s) {
                                const xioj = pv.sub(obs, cells[i].pos);
                                cells[i].f.sub( pv.mult(xioj, P(i).soft_rep ) );
                            }
                        }
                    }


                    for (let i = 0; i < cells.length; ++i) {
                        // noise 
                        cells[i].pos.x += p.sqrt(dt) * p1.diff_coef * p.randomGaussian()
                        cells[i].pos.y += p.sqrt(dt) * p1.diff_coef * p.randomGaussian()

                        // add force
                        cells[i].pos.x += dt * cells[i].f.x / p1.mu;
                        cells[i].pos.y += dt * cells[i].f.y / p1.mu;
                    }

                    for (let i = 0; i < cells.length; ++i) {
                        for (let j = 0; j < i; ++j) {
                            const Rij = cells[i].r_h + cells[j].r_h;
                            const d = pv.dist(cells[i].pos, cells[j].pos) - Rij;
                            if (d < 0.0 && d != -Rij) {
                                const xixj = pv.sub(cells[i].pos, cells[j].pos);
                                xixj.mult(0.5 * d / (d + Rij));
                                cells[i].pos.sub(xixj);
                                cells[j].pos.add(xixj);
                            }
                        }

                        // fix constraints
                        for (let iw = 0; iw < walls.length; ++iw) {
                            const wall = walls[iw];
                            let d = pv.dot(pv.sub(cells[i].pos, wall.pos), wall.normal);

                            if (!first_step && game_mode == 1) {
                                if (d < cells[i].r_h) {
                                    cells[i].pos.sub(pv.mult(wall.normal, d - cells[i].r_h));
                                }
                                /*      
                            if( d > 0 && p.abs(d) < cells[i].r_h  && pv.dist(cells[i].pos, wall.pos) < wall.l/2 + cells[i].r_h) {
                                cells[i].pos.sub( pv.mult(wall.normal, p.abs(d) - cells[i].r_h) );
                            }
                            if( d < 0 && p.abs(d) < cells[i].r_h  && pv.dist(cells[i].pos, wall.pos) < wall.l/2 + cells[i].r_h) {
                                cells[i].pos.sub( pv.mult(wall.normal, p.abs(d) - cells[i].r_h) );
                                //cells[i].pos.add( pv.mult(wall.normal, p.abs(d) - cells[i].r_h) );
                            }
                            */
                            }
                            else {
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

            let dragging = false; // Is the object being dragged?
            let dragWall = false;
            let dragIndex = -1;
            let offset;     // Mouseclick offset
            let lastMouse;  // Mouseclick last pos 
            let sX, sY;

            p.draw = function () {
                p.background(0);
                const aspect_adj = p.width / p.height;
                sX = p.width / p_def.w;
                sY = p.height / p_def.h * aspect_adj / aspect;
                p.scale(sX, sY);
                p.strokeWeight( 5/p.min(sX,sY) );
                p.noStroke();

                // draw grid  (the lines are 100 units apart!)
                for (let x = 10; x < p_def.w; x += 100) {
                    p.stroke(50);
                    p.line(x, 0, x, p_def.h);
                }

                for (let y = 10; y < p_def.h; y += 100) {
                    p.stroke(50);
                    p.line(0, y, p_def.w, y);
                }


                p.textSize(16/p.min(sX,sY));
                p.textAlign(p.RIGHT, p.BOTTOM);
                p.noStroke();
                p.fill(200);
                p.text("t = " + String((t/60).toFixed(2)) + "[h]", p_def.w - 20, p_def.h - 20);


                // p.text("env1 = " + String(p_mod.env1.val.toFixed(2)) + "[%]", p_def.w - 20, p_def.h - 40);

                for (let r = 0; r < 25; ++r) {
                    p.noStroke();
                    p.fill(255, 128, 0, 60.0 * ((game_mode == 2) ? 0.1 : p1.chemo));
                    p.circle(grads.pos.x, grads.pos.y, r * 30);
                }

                timeStep();


                // Adjust location if being dragged
                if (dragWall) {
                    if (dragging && dragIndex >= 0 && dragIndex < walls.length) {
                        walls[dragIndex].pos.x = p.mouseX / sX;
                        walls[dragIndex].pos.y = p.mouseY / sY;
                    }
                }
                else {
                    if (dragging && dragIndex >= 0 && dragIndex < cells.length) {
                        cells[dragIndex].pos.x = p.mouseX / sX;
                        cells[dragIndex].pos.y = p.mouseY / sY;
                    }
                }




                cnts.draw(cells);
                for (let i = 0; i < cells.length; ++i) {
                    cells[i].draw();
                }

                p.noStroke();
                p.fill(200);
                for (let i = 0; i < obstacles.length; ++i) {
                    p.circle(obstacles[i].x, obstacles[i].y, 4);
                }

                for (let i = 0; i < walls.length; i++) {
                    const w = walls[i];
                    const dx = 5 * w.normal.y * w.l / 2;
                    const dy = -5 * w.normal.x * w.l / 2;
                    if (darkMode)
                        p.stroke(200);
                    else
                        p.stroke(0);

                    p.line(w.pos.x - dx, w.pos.y - dy, w.pos.x + dx, w.pos.y + dy)
                }
            }


            p.mousePressed = function () {
                let dm = 2 * (p_def.w + p_def.h);
                let di;
                mouse = p.createVector(p.mouseX / sX, p.mouseY / sY);

                if (p.keyIsDown(p.CONTROL) || mouse.x < 0 || mouse.x > p_def.w || mouse.y < 0 || mouse.y > p_def.h) { return; };

                dragWall = false;
                dragIndex = -1;
                for (let k = 0; k < walls.length; ++k) {
                    const d = walls[k].normal.dot(mouse) - walls[k].normal.dot(walls[k].pos);
                    if (p.abs(d) < 10) {
                        dragIndex = k;
                    }
                }
                if (dragIndex >= 0 && dragIndex < walls.length) {
                    dragging = true;
                    dragWall = true;
                    return;
                }

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
                else 
                {
                    obstacles.push( mouse );
                }
            }

            p.mouseWheel = function (event) {
                if (dragging) {
                    if (dragWall) {
                        if (dragIndex >= 0 && dragIndex < walls.length) {
                            walls[dragIndex].normal.rotate(event.delta / 1000);
                        }
                    }
                }
            }


            p.mouseReleased = function () {
                // Quit dragging
                dragWall = false;
                dragging = false;
            }


            p.windowResized = function () {
                const height_proposal = parent.clientHeight;
                const width_proposal = parent.clientWidth;
                const aspect_proposal = width_proposal / height_proposal;
                p.resizeCanvas(width_proposal, height_proposal * aspect_proposal / aspect);
            }

        }

        let sim_cm_p5 = new p5(sim_cm, 'sim_div');
    </script>