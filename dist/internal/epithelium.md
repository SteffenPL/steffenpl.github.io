---
title: "Simulation of EMT in pseudo-stratified epithelium"
start: 2021-06-01
layout: simulation
desc: Development of an agent-based cell migration model for plithotaxis.
---

# {{ title }}

## Question: Which factors lead to basal extrusion?

Timing and order of EMT events? ⌛ ... or something else? 😉
<br><br>

<div class="grid md:grid-cols-3 gap-4 grid-cols-2 mx-auto">

<div id="sim_div" class="col-span-2">
</div>
<div id="tp_container" class="col-span-1">
</div>
</div>

<div>

<script async defer>


    let sim_emt = function(p) {
        const parent = document.getElementById('sim_div');
        const pv = p5.Vector;

        const aspect = 16/9;
        const bg_col = p.color(30,30,30);

        // Units: space: 5e-6m | h

        let pcontrol = {
            speed: 1.0,
            preset: 0,
        };

        let plts = {

        };

        const params_def = {
            general: {
                t_end: 96,
                dt: 0.1, 
                random_seed: 0,
                init_basal_junction_dist: 0.3,
                N_init: 30,
                N_max: 70,
                N_emt: 2,
                w_init: 10,
                h_init: 10,
                mu: 0.2,
                n_substeps: 20,
                alg_dt: 0.01,
                w_screen: 25,
                h_screen: 20,
                p_div_out: 0.8,
            },
            cell_prop: {
                apical_junction_init: 0.3,
                max_basal_junction_dist: 0.66,
                basal_daming_ratio: 1.0,
                cytos_init: 0.3,
                diffusion: 0.1,

            },
            cell_types: {
                control: {
                    name: 'control',
                    R_hard: 0.3, 
                    R_hard_div: 0.7, 
                    R_soft: 1.0,
                    color: p.color(30, 100, 20),
                    dur_G2: 0.5,
                    dur_mitosis: 0.5,
                    k_apical_junction: 1.0,
                    k_cytos: 5.0,
                    running_speed: 1.0,
                    stiffness_apical_apical: 5.0,
                    stiffness_nuclei_apical: 2.0,
                    stiffness_nuclei_basal: 2.0,
                    stiffness_repulsion: 1.0,
                    stiffness_straightness: 15.0,
                    lifespan: {min: 10, max: 21},
                    INM: true,
                    events: {
                        time_A: {min:Infinity, max:Infinity},
                        time_B: {min:Infinity, max:Infinity},
                        time_S: {min:Infinity, max:Infinity},
                    }
                },
                emt: {
                    name: 'emt',
                    R_hard: 0.3, 
                    R_hard_div: 0.7, 
                    R_soft: 1.0,
                    color: p.color(150, 0, 0),
                    dur_G2: 0.5,
                    dur_mitosis: 0.5,
                    k_apical_junction: 1.0,
                    k_cytos: 5.0,
                    running_speed: 1.0,
                    stiffness_apical_apical: 5.0,
                    stiffness_nuclei_apical: 2.0,
                    stiffness_nuclei_basal: 2.0,
                    stiffness_repulsion: 1.0,
                    stiffness_straightness: 15.0,
                    lifespan: {min: 10, max: 21},
                    INM: false,
                    events: {
                        time_A: {min:6, max:24},
                        time_B: {min:6, max:24},
                        time_S: {min:6, max:24},
                    }
                }
            }
        };

        const params = Object.assign({}, params_def);

        function init_interface() {
                    
            const pane = new Tweakpane.Pane(
                {
                    title: "Simulation control",
                    container: document.getElementById('tp_container'),
                });
            pane.registerPlugin(TweakpaneEssentialsPlugin);

            
            const presets = pane.addInput(pcontrol , 'preset', 
                {
                    label: 'Load setup',
                    options: 
                    [
                        {text: "Two EMT cells (no INM)", value: 0},
                        {text: "Two EMT cells (with INM)", value: 1},
                        {text: "10 EMT cells (no INM)", value: 2},
                        {text: "10 EMT cells (with INM)", value: 3},
                        {text: "No EMT cells", value: 4},
                    ]
                });

            presets.on('change', (ev) => {
                Object.assign(params, params_def);
                console.log(ev.value);
                pcontrol.preset = ev.value;
                switch(ev.value) { 
                    case 0: 
                        params.general.N_init = 30;
                        params.general.N_emt = 2;
                        params.cell_types.emt.INM = false;
                        break;

                    case 1: 
                        params.general.N_init = 30;
                        params.general.N_emt = 2;
                        params.cell_types.emt.INM = true;
                        break;
                        
                    case 2: 
                        params.general.N_init = 40;
                        params.general.N_emt = 10;
                        params.general.w_init = 15;
                        params.cell_types.emt.INM = false;
                        break;
                        
                    case 3: 
                        params.general.N_init = 40;
                        params.general.N_emt = 10;
                        params.general.w_init = 15;
                        params.cell_types.emt.INM = true;
                        break;

                    case 4:
                        params.general.N_init = 30;
                        params.general.N_emt = 0;
                        break;

                    default: break;
                }
                init();
                pane.refresh();
            });

            let btn = pane.addButton(
                {
                    title: 'Start simulation',                
                });

            btn.on('click', () => {
                init();
            });

            pane.addInput(pcontrol, 'speed', 
                {
                    label: 'Play speed [sim h/s]', min: 0.0, max: 2.0,
                });

            pane.addSeparator();


            let tabs = pane.addTab({
                pages: [
                    {title: 'EMT cells'},
                    {title: 'Control cells'},
                    {title: 'Stats'},
                ]
            });


            let tabP = tabs .pages[2];
            let tabA = tabs .pages[1];
            let tabU = tabs .pages[0];

            tabP.addMonitor(s.cells, 'length', {
                label: "#cells",
                view: 'graph',
                interval: 1000,
                min: 0,
                max: params.general.N_max + 1,
            });

            tabA.addInput(params.cell_types.control, 'lifespan',
            {
                label: 'Lifespan [h]', min: 5.0, max: 40, step: 1.0
            });


            tabA.addInput(params.cell_types.control, 'INM',
            {
                label: 'Interkinetic nuclear migration'
            });

            tabA.addInput(params.cell_types.control, 'stiffness_repulsion',
                {
                    label: 'Stiffness: Cell repulsion', min: 0.0, max: 5, step: 0.1
                });
                
            tabA.addInput(params.cell_types.control, 'stiffness_straightness',
                {
                    label: 'Stiffness: Straightness factor', min: 0.0, max: 20, step: 0.1
                });

            tabA.addInput(params.cell_types.control, 'stiffness_nuclei_apical',
                {
                    label: 'Stiffness: Apical cytoskeleton', min: 1.0, max: 10, step: 0.1
                });

            tabA.addInput(params.cell_types.control, 'stiffness_nuclei_basal',
                {
                    label: 'Stiffness: Basal cytoskeleton', min: 1.0, max: 10, step: 0.1
                });

            tabA.addInput(params.cell_types.control, 'stiffness_apical_apical',
            {
                label: 'Stiffness: Apical-apical springs', min: 1.0, max: 10, step: 0.1
            });

            tabA.addInput(params.cell_types.control, 'k_cytos',
            {
                label: 'Speed of rest length adaptation', min: 0.0, max: 20, step: 0.1
            });

            
            tabU.addInput(params.cell_types.emt, 'INM',
            {
                label: 'Interkinetic nuclear migration'
            });


            const tabUR = tabU.addFolder({
                title: 'Changes of the time of EMT requires restart of the simulation:',
                expanded: true,   // optional
            });

            tabUR.addInput(params.cell_types.emt.events, 'time_A',
            {
                label: 'EMT event: Loss apical adhesion [h]', min: 6.0, max: 48, step: 3
            });

            tabUR.addInput(params.cell_types.emt.events, 'time_B',
            {
                label: 'EMT event: Loss basal adhesion [h]', min: 6.0, max: 48, step: 3
            });
            
            /*tabU.addInput(params.cell_types.emt.events, 'time_S',
            {
                label: 'EMT event: Loss polarity [h]', min: 6.0, max: 24, step: 3
            });*/
        }
        

        let s = {
            cells: [],
            ap_links: [],
            ba_links: [],
            t: 0.0,
        };


        class Cell {
            constructor(params, s, x_init, ct = params.cell_types.control, parent = undefined) {

                const w = params.general.w_init;
                const h = params.general.h_init;

                this.type = ct;

                
                this.f = p.createVector(0.0, 0.0);
                this.fA = p.createVector(0.0, 0.0);
                this.fB = p.createVector(0.0, 0.0);

                this.col = ct.color;
                this.R_soft = ct.R_soft;
                this.R_hard = ct.R_hard;

                this.eta_A = h/2;
                this.eta_B = h/2;

                this.has_A = true;
                this.has_B = true;

                this.phase = 0; // 1 = G2, 2 = mitosis
                const max_age = p.random( ct.lifespan.min, ct.lifespan.max );

                if( parent === undefined ) {
                    this.pos = x_init.copy();
                    this.A = p.createVector( this.pos.x, h);
                    this.B = p.createVector( this.pos.x, 0);

                    this.birth_time = s.t - p.random(0, max_age);
                    this.division_time = this.birth_time + max_age;

                    this.time_A = p.random(ct.events.time_A.min, ct.events.time_A.max);
                    this.time_B = p.random(ct.events.time_B.min, ct.events.time_B.max);
                    this.time_S = p.random(ct.events.time_S.min, ct.events.time_S.max);
                } else {
                    this.pos = x_init.copy();
                    this.A = parent.A.copy();
                    this.B = parent.B.copy();
                    
                    this.birth_time = s.t;
                    this.division_time = this.birth_time + max_age;
                    
                    this.time_A = parent.time_A;
                    this.time_B = parent.time_B;
                    this.time_S = parent.time_S;

                    this.has_A = parent.has_A;
                    this.has_B = parent.has_B;

                    this.eta_A = parent.eta_A;
                    this.eta_B = parent.eta_B;
                }

                this.pos_last = this.pos.copy();
                this.dir = p.createVector(0,0);
            }

            draw() {

                this.dir.set(this.pos_last);
                this.dir.sub(this.pos);
                this.dir.mult(1/(params.general.dt));
                this.pos_last.set(this.pos.x, this.pos.y);

                p.noStroke();
                p.fill(p.red(this.col), p.green(this.col), p.blue(this.col), 100);
                // p.circle(this.pos.x, this.pos.y, 2*this.R_soft);
                const angle = this.dir.heading();
                const F = this.dir.mag();
                p.translate(this.pos.x, this.pos.y);
                p.rotate(angle);

                let v = 0;
                const Fmin = 0.9;
                const Fmax = 2.0;
                const vmax = 0.3;
                if( F > Fmin ) {
                    if ( F < Fmax) {
                        const x = (F-Fmin)/(Fmax-Fmin);
                        v = vmax*p.exp(-1/(1-x*x*x*x));
                    }
                    else {
                        v = vmax;
                    }
                }
                p.ellipseMode(p.CENTER);
                p.ellipse(0, 0, (1+v)*2*this.R_soft, (1-v)*2*this.R_soft);
                p.rotate(-angle);
                p.translate(-this.pos.x, -this.pos.y);

                p.fill(p.red(this.col), p.green(this.col), p.blue(this.col));
                p.circle(this.pos.x, this.pos.y, 2*this.R_hard);
                
                
                p.fill(150,20,20);
                p.circle(this.A.x, this.A.y, 0.2);
                
                p.fill(0,0,0);
                p.circle(this.B.x, this.B.y, 0.2);

                p.stroke(100,50,0,80);
                p.strokeWeight(0.05);
                p.line(this.A.x, this.A.y, this.pos.x, this.pos.y );
                p.line(this.B.x, this.B.y, this.pos.x, this.pos.y );
            }

        };

        

        function init() {
            s.cells.length = 0;
            s.t = 0;
            s.ap_links.length = 0;
            s.ba_links.length = 0;

            const N =  params.general.N_init;
            const i_emt = p.round( (N - params.general.N_emt) / 2 );
            const j_emt = i_emt + params.general.N_emt;

            const w = params.general.w_init;
            const h = params.general.h_init;

            const X_init = [];
            for( let i = 0; i < N; ++i ) {
                X_init[i] = p.createVector( p.random(-w/2, w/2), p.random(h/3, 2*h/3 ) );
            }
            X_init.sort( (a,b) => ( a.x - b.x ) );


            for( let i = 0; i < N; ++i ) {
                if( i < i_emt || i >= j_emt ) {
                    s.cells[i] = new Cell(params, s, X_init[i]);
                } else {
                    s.cells[i] = new Cell(params, s, X_init[i], params.cell_types.emt);
                }
            }

            for( let i = 0; i < s.cells.length; ++i ) {
                s.cells[i].A.x = -w/2 + w * (i/s.cells.length);
                s.cells[i].B.x = -w/2 + w * (i/s.cells.length);
            }

            for( let i = 0; i < s.cells.length - 1; ++i ) {
                s.ap_links[i] = {l: i, r: i+1};
                s.ba_links[i] = {l: i, r: i+1};
            }

            s.t = 0.0;
        }


        function timeStep() {

            //dt = p.min(p.deltaTime, 100) / 1000 * 60 * p_def.speed_factor / p1.n_substeps;

            const pg = params.general;
            const ct = params.cell_types.control;
            const cp = params.cell_prop;


            let dt = pg.dt * pcontrol.speed;

            // update time dynamics 
            for (let i = 0; i < s.cells.length; ++i) {
                const ci = s.cells[i];

                // update cell phase 
                if ( s.t < ci.division_time - ci.type.dur_G2 - ci.type.dur_mitosis ) {
                    ci.phase = 0;
                } else {
                    if ( s.t < ci.division_time - ci.type.dur_mitosis ) {
                        ci.phase = 1;
                    } else {
                        if ( s.t < ci.division_time ) {
                            ci.phase = 2;
                        } else {
                            ci.phase = 3;
                        }
                    }
                }
            }

            // perform cell division
            for (let i = 0; i < s.cells.length; ++i) {
                let ci = s.cells[i];
                if( ci.phase == 3 ) {
                    if ( ci.type.name == 'emt' ) {
                        // reset cell cycle
                        s.cells[i] = new Cell(params, s, ci.pos, ci.type, ci); 
                    } else {
                        if( p.random(0,1) < pg.p_div_out || s.cells.length >= pg.N_max ) {
                            // one offsprings
                            s.cells[i] = new Cell(params, s, ci.pos, ci.type, ci); 
                        } else {
                            // two offsprings
                            
                            s.cells[i] = new Cell(params, s, ci.pos, ci.type, ci); 
                            ci = s.cells[i];
                            s.cells[s.cells.length] = new Cell(params, s, ci.pos, ci.type, ci);
                            const cj = s.cells[s.cells.length-1];
                            ci.pos.x -= 0.05 * ci.R_soft;
                            cj.pos.x += 0.05 * ci.R_soft;
                            ci.A.x -= 0.05 * ci.R_soft;
                            cj.A.x += 0.05 * ci.R_soft;
                            ci.B.x -= 0.05 * ci.R_soft;
                            cj.B.x += 0.05 * ci.R_soft;

                            // recover the tissue 
                            for( let e = 0; e < s.ap_links.length; ++e ) {
                                const con = s.ap_links[e];
                                if( i == con.l ) {
                                    con.l = s.cells.length - 1;
                                }
                            }
                            s.ap_links[s.ap_links.length] = {l:i, r:s.cells.length-1};

                            for( let e = 0; e < s.ba_links.length; ++e ) {
                                const con = s.ba_links[e];
                                if( i == con.l ) {
                                    con.l = s.cells.length - 1;
                                }
                            }
                            s.ba_links[s.ba_links.length] = {l:i, r:s.cells.length-1};
                        }
                        // perform cell division
                    }
                }
            }

            
            for (let i = 0; i < s.cells.length; ++i) {
                const ci = s.cells[i];

                // lose apical adhesion
                if( s.t <= ci.time_A && s.t + dt > ci.time_A  ) {
                    ci.has_A = false;
                                    
                    const inds = [];
                    let new_con = {l: 0, r: 0};
                    for(let e = 0; e < s.ap_links.length; ++e) {
                        const con = s.ap_links[e];
                        if ( con.l == i ) { inds.push(e); new_con.r = con.r; };
                        if ( con.r == i ) { inds.push(e); new_con.l = con.l; };
                    }

                    if( inds.length == 1 ) {
                        s.ap_links.splice(inds[0], 1);
                    }

                    if( inds.length == 2 ) {
                        inds.sort((a,b) => (b - a));
                        s.ap_links.splice(inds[0], 1);
                        s.ap_links.splice(inds[1], 1);
                        s.ap_links.push(new_con);
                    }
                }                    
                
                // lose basal adhesion
                if( s.t <= ci.time_B && s.t + dt > ci.time_B  ) {
                    ci.has_B = false;
                                    
                    const inds = [];
                    let new_con = {l: 0, r: 0};
                    for(let e = 0; e < s.ba_links.length; ++e) {
                        const con = s.ba_links[e];
                        if ( con.l == i ) { inds.push(e); new_con.r = con.r; };
                        if ( con.r == i ) { inds.push(e); new_con.l = con.l; };
                    }

                    if( inds.length == 1 ) {
                        s.ba_links.splice(inds[0], 1);
                    }

                    if( inds.length == 2 ) {
                        inds.sort((a,b) => (b - a));
                        s.ba_links.splice(inds[0], 1);
                        s.ba_links.splice(inds[1], 1);
                        s.ba_links.push(new_con);
                    }
                }
            }

            for (let i = 0; i < s.cells.length; ++i) {
                const ci = s.cells[i];
                    
                // drl = desired rest length
                let apical_drl = 0.0;
                let basal_drl = 0.0;

                const distAX = pv.dist(ci.pos, ci.A);
                const distBX = pv.dist(ci.pos, ci.B);
                let distAB = 0.0;

                const phase_mode = ci.phase + ( ci.type.INM ? 0 : 10 );

                switch( phase_mode ) {
                    case 1: 
                        distAB = pv.dist(ci.A, ci.B);
                        apical_drl = 0.0;
                        basal_drl = p.max( 0, distAB - 2*ci.R_soft );
                    break;

                    case 2: 
                        distAB = pv.dist(ci.A, ci.B);
                        apical_drl = 0.0;
                        basal_drl = p.max( 0, distAB - 2*ci.R_soft );
                    break;
                    
                    default: 
                        apical_drl = p.max( 0, distAX - ci.R_soft );
                        basal_drl  = p.max( 0, distBX - ci.R_soft );
                }

                
                if( ci.phase == 1 ) {
                        ci.R_hard = ci.type.R_hard_div;
                };

                if( !ci.has_A ) { apical_drl = 0.0; };
                if( !ci.has_B ) { basal_drl = 0.0; };

                ci.eta_A = p.exp(-dt * ci.type.k_cytos ) * (ci.eta_A - apical_drl) + apical_drl;                    
                ci.eta_B = p.exp(-dt * ci.type.k_cytos ) * (ci.eta_B - basal_drl) + basal_drl;
            }

            dt = pg.dt / pg.n_substeps * pcontrol.speed;

            for (let step = 0; step < pg.n_substeps; ++step) {

                s.t = s.t + dt;                 

                for (let i = 0; i < s.cells.length; ++i) {
                    s.cells[i].f.set(0,0);
                    s.cells[i].fA.set(-0.0,0);
                    s.cells[i].fB.set(0,0);
                }

                // cell cell repulsion
                for (let i = 0; i < s.cells.length; ++i) {
                    const ci = s.cells[i]; 
                    for (let j = 0; j < i; ++j) {
                        const xixj = pv.sub(s.cells[j].pos, s.cells[i].pos);
                        const d = xixj.mag();
                        const Rij = s.cells[i].R_soft + s.cells[j].R_soft;
                        if (d < Rij && d > Rij / 20) {
                            s.cells[i].f.add(pv.mult(xixj, -ci.type.stiffness_repulsion * (Rij - d) / d));
                            s.cells[j].f.sub(pv.mult(xixj, -ci.type.stiffness_repulsion * (Rij - d) / d));
                        }
                    }
                }

                for (let i = 0; i < s.cells.length; ++i) {
                    const ci = s.cells[i]; 

                    
                    // apical nuclei springs 
                    const ax = pv.sub(ci.pos, ci.A);
                    const al = ax.mag();
                    if( al > 0 ) {
                        const rl = ci.eta_A + ci.R_soft;
                        ci.f.sub(  pv.mult(ax, 2 * ci.type.stiffness_nuclei_apical * ( al - rl ) / (al*rl*rl) ) );
                        ci.fA.add( pv.mult(ax, 2 * ci.type.stiffness_nuclei_apical * ( al - rl ) / (al*rl*rl) ) );
                    }

                    
                    // basal nuclei springs 
                    const bx = pv.sub(ci.pos, ci.B);
                    const bl = bx.mag();
                    if( al > 0 ) {
                        const rl = ci.eta_B + ci.R_soft;
                        ci.f.sub(  pv.mult(bx, 2 * ci.type.stiffness_nuclei_basal * ( bl - rl ) / (bl*rl*rl) ) );
                        ci.fB.add( pv.mult(bx, 2 * ci.type.stiffness_nuclei_basal * ( bl - rl ) / (bl*rl*rl) ) );
                    }

                    // straightness 
                    const ax_bx = pv.dot(ax, bx);
                    if( ax_bx != 0.0 ){
                        const f = ci.type.stiffness_straightness / (al*bl);
                        
                        const dR = bx.copy();
                        dR.mult(-1.0); dR.add( pv.mult( ax, ax_bx/(al*al) ) ); dR.mult(f); 
                        const dS = ax.copy();
                        dS.mult(-1.0); dS.add( pv.mult( bx, ax_bx/(bl*bl) ) ); dS.mult(f);
                        ci.fA.sub(dR);
                        ci.f.add(dR);
                        ci.f.add(dS);
                        ci.fB.sub(dS);
                    }
                }

                for(let e = 0; e < s.ap_links.length; ++e) {
                    const ci = s.cells[ s.ap_links[e].l ];
                    const cj = s.cells[ s.ap_links[e].r ];
                    const aiaj = pv.sub(ci.A, cj.A);
                    aiaj.mult( 0.25*0.5*ci.type.stiffness_apical_apical );
                    ci.fA.sub( aiaj );
                    cj.fA.add( aiaj );
                }

                // integrate forces
                for (let i = 0; i < s.cells.length; ++i) {
                    const ci = s.cells[i];
                    // noise 
                    ci.pos.x += p.sqrt(dt) * cp.diffusion * p.randomGaussian()
                    ci.pos.y += p.sqrt(dt) * cp.diffusion * p.randomGaussian()

                    // add force
                    ci.pos.x += dt * ci.f.x / pg.mu;
                    ci.pos.y += dt * ci.f.y / pg.mu;

                    ci.A.x += dt * ci.fA.x / pg.mu;
                    ci.A.y += dt * ci.fA.y / pg.mu;
                    
                    ci.B.x += dt * ci.fB.x / pg.mu;

                    if( !ci.has_B ) {
                        ci.B.y += dt * ci.fB.y / pg.mu;
                    }
                }

                // handle constraints
                for (let i = 0; i < s.cells.length; ++i) {
                    for (let j = 0; j < i; ++j) {
                        const Rij = s.cells[i].R_hard + s.cells[j].R_hard;
                        const d = pv.dist(s.cells[i].pos, s.cells[j].pos) - Rij;
                        if (d < 0.0 && d != -Rij) {
                            const xixj = pv.sub(s.cells[i].pos, s.cells[j].pos);
                            xixj.mult(0.5 * d / (d + Rij));
                            s.cells[i].pos.sub(xixj);
                            s.cells[j].pos.add(xixj);
                        }
                    }
                }

                // fixed ordering of basal layer
                for( let e = 0; e < s.ba_links.length; ++e) {
                    const ci = s.cells[s.ba_links[e].l];
                    const cj = s.cells[s.ba_links[e].r];

                    const bij = cj.B.x - ci.B.x;
                    if( bij < 0 ) {
                        ci.B.x += bij/2;
                        cj.B.x -= bij/2;
                    } 
                }
                
                // maximal distance of basal points
                for( let e = 0; e < s.ba_links.length; ++e) {
                    const ci = s.cells[s.ba_links[e].l];
                    const cj = s.cells[s.ba_links[e].r];

                    const bij = cj.B.x - ci.B.x;
                    if( bij > cp.max_basal_junction_dist ) {
                        ci.B.x += (bij - cp.max_basal_junction_dist) / 2;
                        cj.B.x -= (bij - cp.max_basal_junction_dist) / 2;
                    } 
                }
            }
        }


        let sX = 1.0; 
        let sY = 1.0;
        let tX = 0.0;
        let tY = 0.0;

        let dragging = false; // Is the object being dragged?
        let dragIndex = -1;
        let offset;     // Mouseclick offset

        p.setup = function() {
            p.createCanvas(1280,768);
            p.windowResized();
            p.frameRate(25);
            init_interface();
            init();
        }

        p.draw = function() {
            
            const pg = params.general;

            // simulate 
            timeStep();


            // drag and drop 

            if (dragging && dragIndex >= 0 && dragIndex < s.cells.length) {
                s.cells[dragIndex].pos.x = p.mouseX / sX - tX;
                s.cells[dragIndex].pos.y = p.mouseY / sY - tY;
            }

            // prepare drawing 
            p.background(250,250,250);

            const scale_factor = (p.width/p.height) / aspect;
            const ws = pg.w_screen;
            const hs = pg.h_screen;
            const h  = pg.h_init;
            sX = p.width / ws * p.min(1, 1/scale_factor);
            sY = -p.height / hs * p.min(1, scale_factor);
            tX = ws/2;
            tY = -hs + (hs-h)/2 ;
            p.scale(sX,sY);
            p.translate(tX, tY);


            // draw tissue
            for( let i = 0; i < s.cells.length; ++i ) {
                s.cells[i].draw();
            }

            p.stroke(100,0,0,255);
            p.strokeWeight(0.05);
            for( let e = 0; e < s.ap_links.length; ++e) {
                const i = s.ap_links[e].r;
                const j = s.ap_links[e].l;
                p.line( s.cells[i].A.x, s.cells[i].A.y, s.cells[j].A.x, s.cells[j].A.y );
            }

            p.stroke(0,0,0,255);
            p.strokeWeight(0.05);
            for( let e = 0; e < s.ba_links.length; ++e) {
                const i = s.ba_links[e].r;
                const j = s.ba_links[e].l;
                p.line( s.cells[i].B.x, s.cells[i].B.y, s.cells[j].B.x, s.cells[j].B.y );
            }

            p.stroke(100,100,100);
            p.strokeWeight(0.1);
            p.line(ws/2 - 4, -0.1*hs, ws/2 - 2, -0.1*hs);

            
            p.scale(1,-1);
            p.noStroke();
            p.fill(0);
            p.textSize(16/p.max(sX,-sY));
            p.textAlign(p.LEFT, p.TOP);
            p.text("10 μm", ws/2 - 4, 0.1*hs);
            p.text("time: " + String(s.t.toFixed(2)) + " h", ws/2 - 4, 0.15*hs);

            p.fill(150,30,20);
            p.text("Apical side", ws/2 - 4, -0.75*hs);

            p.fill(0,0,0);
            p.text("Basal side", ws/2 - 4, 0.2*hs);

            if( s.cells.length == params.general.N_max) {
                p.fill(0,0,0);
                p.text("Maximal number of cells reached. Cell division inactive.", -ws/2 + 4, 0.2*hs);
            }

        }


        p.mousePressed = function () {
            mouse = p.createVector(p.mouseX / sX - tX, p.mouseY / sY - tY);
            const pg = params.general;

            if ( mouse.x < -pg.w_screen/2 || mouse.x > pg.w_screen/2 || mouse.y < 0 || mouse.y > pg.h_screen) { return; };

            let di;
            let dm = pg.w_screen + pg.h_screen;
            dragIndex = -1;
            for (let i = 0; i < s.cells.length; ++i) {
                di = mouse.dist(s.cells[i].pos);
                if (di < dm) {
                    dragIndex = i;
                    dm = di;
                }
            }

            if (dragIndex >= 0 && dragIndex < s.cells.length && dm <= s.cells[dragIndex].R_soft) {
                dragging = true;
            }
        }


        p.mouseReleased = function () {
            // Quit dragging
            dragging = false;
        }


        p.windowResized = function () {
            const height_proposal = parent.clientHeight;
            const width_proposal = parent.clientWidth;
            const aspect_proposal = width_proposal / height_proposal;
            p.resizeCanvas(width_proposal, height_proposal * aspect_proposal / aspect);
        }


    }

    let sim_emt_p5 = new p5(sim_emt, 'sim_div');

</script>

</div>

