---
title: "Cell migration model for plithotaxis"
start: 2021-06-01
layout: simulation
desc: Development of an agent-based cell migration model for plithotaxis.
---

# {{ title }}

**This is an internal page for collaborators.** 
If you see this page, you should know why you are here...

- You can drag & drop the cells with the mouse.
- You can drag & drop the parameter window anywhere as well.
- The color code of cells is: 
    - light green cells running phase
    - green cells tumble phase
    - orange cells are in CIL phase
    - blue cells are in cluster phase
- Change parameters in the `sim_cm` window. 
    - Units for times are given in hours/angles in degree.
- The domain width is kind of 800 $\mu m$.

<div>

<div id="sim_cm" class="max-w-full;">
</div>
<div class="container mx-auto w-max">
<button id="sim_1_reset" class="flex border-2 border-red-600 rounded-xl pl-4 pr-4 mb-4 drop-shadow-xl">Restart</button>
</div>
</div>


## Description of the simulation

The green spheres represent the cells, and the transparent spheres around them indicate the 
repulsive domain. In addition, cells can form temporary adhesive bonds which are displayed as orange lines.

 Each cell is The red line displays the forces which are acting on the cell.
The black line shows the polarity, cells will always try to run in direction of their polarity.

Parameters:
- confinement: Height of the area
- N: number of cells
- r: radius of cells
- r_spread: heterogeneity in the radii of cells
- run_speed: speed of cells during run phage
    - similar: tumble_speed, cil_speed, cluster_speed
- run_dur: duration of running phase
- tumble_dur: duration of tumble phase
- rotation_dur: duration between two repolarisations during tumble phase
- cil_dur: duration of cil
- cil_init_dur: duration of contact before CIL is initiated
- cil_spread: randomness of direction after cil (180 = completely random)
- new_adh_dur: avg duration before new adhesive bond is created for close cells
- break_adh_dur: avg duration until adhesive bond breaks
- adh_stiffness: stiffness of adhesive bonds
- plitho_align: determines how much the alignment between cell polarity and forces impacts the duration between repolarisaion (during cluster phase)
- plitho_dur: default duration betweewn repolarisaion (during cluster phase)
- plitho_min_dur: minimal duration betweewn repolarisaion (during cluster phase)
- plitho_max_dur: maximal duration betweewn repolarisaion (during cluster phase)
- plitho_spread: determines how random the new direction is after repolarisation (during cluster phase). 180 = completely random.
- chemo: amount of chemotaxis
- soft_rep: stiffness of soft repulsion
- wall_rep: stiffness of wall repulsion
- diff_coef: noise added to positions
- show_forces: plotting only, indicates who visible the force vectors are
- n_substeps: numerical parameter for amount of substeps during each timestep
- mu: damping coefficient

<!-- this is here to allow markdown preview with scripts -->
{%- if false -%}
    <script src="../assets/p5.min.js" type="text/javascript"></script>
    <script src="../assets/quicksettings.js" type="text/javascript"></script>
    <script src="../assets/p5.gui.js" type="text/javascript"></script>
{%- endif -%}


<div>

<script>

    let sim_cm = function(p) {

        let parent = document.getElementById('sim_cm');
        
        const darkMode = true;

        let p_def = {
            confinement: 0.65,
            confinementMin: 0.0, confinementMax: 1.0, confinementStep: 0.05,
            N: 120,
            NMin: 5, NMax: 180, NStep: 5,
            r: 20.0,
            rMin: 1, rMax: 40, rStep:1,
            r_spread: 5,
            r_spreadMin: 0, r_spreadMax: 20, r_spreadStep: 0.5, 
            run_speed: 1.2, 
            run_speedMin: 0.0, run_speedMax: 3.0, run_speedStep: 0.1,
            tumble_speed: 0.5, 
            tumble_speedMin: 0.0, tumble_speedMax: 3.0, tumble_speedStep: 0.1,
            cil_speed: 0.7, 
            cil_speedMin: 0.0, cil_speedMax: 3.0, cil_speedStep: 0.1,
            cluster_speed: 0.8, 
            cluster_speedMin: 0.0, cluster_speedMax: 3.0, cluster_speedStep: 0.1, 
            run_dur: 15.0, 
            run_durMin: 0.0, run_durMax: 60.0, run_durStep: 0.5, 
            tumble_dur: 6.0, 
            tumble_durMin: 0.0, tumble_durMax: 60.0, tumble_durStep: 0.5, 
            rotation_dur: 2.0, 
            rotation_durMin: 0.0, rotation_durMax: 10.0, rotation_durStep: 0.5,
            cil_dur: 5.0,
            cil_durMin: 0.0, cil_durMax: 60.0, cil_durStep: 0.5,
            cil_init_dur: 1.0,
            cil_init_durMin: 0.5, cil_init_durMax: 10.0, cil_init_durStep: 0.5,
            cil_spread: 30.0,
            cil_spreadMin: 0.0, cil_spreadMax: 180.0, cil_spreadStep: 1.0,
            new_adh_dur: 3.0, 
            new_adh_durMin: 0.0, new_adh_durMax: 60.0, new_adh_durStep: 0.5,
            break_adh_dur: 12.0, 
            break_adh_durMin: 0.0, break_adh_durMax: 60.0, break_adh_durStep: 0.5,
            adh_stiffness: 0.02,
            adh_stiffnessMin: 0.0, adh_stiffnessMax: 0.1, adh_stiffnessStep: 0.001,
            plitho_dur: 3,
            plitho_durMin: 0, plitho_durMax: 60, plitho_durStep: 0.5,
            plitho_min_dur: 0.1,
            plitho_min_durMin: 0.0, plitho_min_durMax: 12, plitho_min_durMin: 0.1,
            plitho_max_dur: 50,
            plitho_max_durMin: 0,plitho_max_durMax: 180,plitho_max_durStep: 5,
            plitho_align: 50,
            plitho_alignMin: 0,plitho_alignMax: 200,plitho_alignStep: 5,
            plitho_spread: 15,
            plitho_spreadMin: 0,  plitho_spreadMax: 180,  plitho_spreadStep: 1.0,
            chemo: 0.0,
            chemoMin: 0.0, chemoMax: 0.4, chemoStep: 0.01,
            soft_rep: 0.2,
            soft_repMin: 0.0, soft_repMax: 1.0, soft_repStep: 0.05,
            wall_rep: 0.2,
            wall_repMin: 0.0, wall_repMax: 1.0, wall_repStep: 0.05,
            diff_coef: 0.02,  
            diff_coefMin: 0.00, diff_coefMax: 0.2, diff_coefStep: 0.01,
            n_substeps: 10,
            n_substepsMin: 1, n_substepsMax: 40, n_substepsStep: 1,
            show_forces: 1,
            show_forcesMin: 0, show_forcesMax: 1, show_forcesStep: 0.1,
            mu: 2,
            muMin: 0.1, muMax: 4, muStep: 0.1
        };
    
        let p1 = {...p_def};
        let p2 = {...p_def};
        // global (constant) parameters 
        const s = 20;
        // internal width/height of the scene
        const w = 800; // in mu meter!
        const h = 600; // in mu meter
        const aspect = w/h;

        const pv = p5.Vector;
        const game_mode = 1;
    
        let cells = [], walls = [], cnts, grads;
    
        // model parameters
        const D = 0.2;
    
        class Cell {
        constructor(t){
            const alpha = p.random(0, 2*p.PI);
            this.pol = p.createVector(p.sin(alpha), p.cos(alpha));
            this.f = p.createVector(0.0, 0.0);
            this.r_h = 10;  // in mu meter
            this.r_s = 20;  // in mu meter
            this.rand = p.random(0,1);
            this.type = t;
            this.mode = 0;
            this.pos = p.createVector(p.random(0, w/2), p.random(h/4, 3*h/4));
            this.col = {r: 80, g: 150, b: 50};
        }
        draw() {
            p.noStroke();
            p.fill(this.col.r, this.col.g, this.col.b, 80);
            p.circle(this.pos.x, this.pos.y, this.r_s*2);
            
            
            if( this.mode == 0) {
            p.fill(this.col.r, this.col.g + 100, this.col.b);  
            } 
            else if ( this.mode == 1 ) {
            p.fill(this.col.r, this.col.g, this.col.b);
            } 
            else if ( this.mode == 2 ) {
            p.fill(this.col.r + 100, this.col.g, this.col.b);  
            } 
            else 
            {
            p.fill(this.col.r, this.col.g, this.col.b + 100);
            }
            p.circle(this.pos.x, this.pos.y, this.r_h*2);
            
            // p.fill(this.col.r, this.col.g, this.col.b);
            // p.circle(this.pos.x, this.pos.y, this.r_h*2);

            p.stroke(50,50,50, 250);
            p.line(this.pos.x, this.pos.y, this.pos.x + this.r_s * this.pol.x, this.pos.y + this.r_s * this.pol.y);
            if( true ) {
            p.stroke(150,0,0, 120 * p_def.show_forces);
            p.line(this.pos.x, this.pos.y, this.pos.x + this.r_s * this.f.x, this.pos.y + this.r_s * this.f.y);
            }  
        }
        }
    
        class Contacts {
        constructor(N){
            this.cnts = [];
            for( let i = 0; i < N; ++i) {
            this.cnts[i] = [];
            for( let j = 0; j < N; ++j) {
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
            p.strokeWeight(4);
            p.stroke(200,100,0, 120 * p.map(p1.adh_stiffness,0,p_def.adh_stiffness*2,0,2));
            for( let i = 0; i < cells.length; ++i) {
                for( let j = 0; j < i; ++j) {
                    if ( this.cnts[i][j] ) {
                    p.line(cells[i].pos.x, cells[i].pos.y, cells[j].pos.x, cells[j].pos.y);
                    }
                }
            }
        }
        }
    
    
        let N = 100;
        let first_step = true;
        
        function init() {

            N = p_def.N;

        first_step = true
        switch(game_mode) {
            default:
            walls = [
                {pos: p.createVector(w/2, 10), normal: p.createVector(0.0, 1.0), l: w-20},
                {pos: p.createVector(w/2, h-10), normal: p.createVector(0.0, -1.0), l: w-20},
                {pos: p.createVector(10, h/2), normal: p.createVector(1.0, 0.0), l: h-20},
                {pos: p.createVector(w-10, h/2), normal: p.createVector(-1.0, 0.0), l: h-20}]
            
            grads = {pos: p.createVector(w - 10, 128 + ((h-128)/2))};
    
            cells.length = 0;
            for(let i = 0; i < N; i++){
                cells.push( new Cell(0) );
            }
    
            cells.length = 0;
            const N2 = N; //round(N/2);
            for(let i = 0; i < N2; i++){
                cells.push( new Cell(0) );
            }
            
            for(let i = N2; i < N; i++){
                cells.push( new Cell(1) );
            }


            for( let i = 0; i < cells.length; ++i) {
                cells[i].r_s = p_def.r + p_def.r_spread * (p.pow(cells[i].rand,2) - 0.5);
                cells[i].r_h = cells[i].r_s/2;
            }
        }
    
        cnts = new Contacts(cells.length);
        cnts.addContact(0,1);
    
        }
    
        p.setup = function() { 
            const height_proposal = parent.clientHeight;
            const width_proposal = parent.clientWidth;
            const aspect_proposal = width_proposal / height_proposal;
            p.createCanvas(width_proposal, height_proposal * aspect_proposal / aspect);  
            p.frameRate(30);
    

            gui = p.createGui(this);
            gui.addObject(p_def);

            init();
        }
    
        let t = 0.0;
    
        const modeRun = 0;
        const modeTumble = 1;
        const modeCIL = 2;
        const modeCluster = 3;
        const tf = 1000;
    
        function expRand(rate) {
            return p.random() <= (1.0 - p.exp(-p.deltaTime / (rate * tf) ));
        }
    
    
        function P(i) {
        return (game_mode == 0 || cells[i].type == 0) ? p1 : p2; 
        }
    
        function timeStep() {

            if( p1.N != p_def.N ) {
                init();

            }

            if( p1.r != p_def.r || p1.r_spread != p_def.r_spread) {

                for( let i = 0; i < cells.length; ++i) {
                    cells[i].r_s = p_def.r + p_def.r_spread * (p.pow(cells[i].rand,2) - 0.5);
                    cells[i].r_h = cells[i].r_s/2;
                }
            }


            walls[0].pos.y = 10 + p_def.confinement*(h-40)/2;
            walls[1].pos.y = h  - p_def.confinement*(h-40)/2;

            Object.assign(p1, p_def);


            /*
            p1.chemo = sl_chemo.value / 100 * p_def.chemo;
            p1.plitho_align = sl_plitho.value / 100 * p_def.plitho_align;
            p1.r_spread = p.map(sl_heterogeneity.value,0,100,4,0) * p_def.r_spread;
            p1.adh_stiffness = p.map(sl_adh_stiffness.value,0, 100,0,2) * p_def.adh_stiffness;
            p1.soft_rep = p.map(sl_soft_rep.value, 0, 100, 0.7, 2) * p_def.soft_rep;

            const p_wall = p.sqrt(sl_confinement.value / 100);
            walls[0].pos.y = 10 + p_wall*(h-40)/2;
            walls[1].pos.y = h - p_wall*(h-40)/2;

            for( let i = 0; i < cells.length; ++i) {
                cells[i].r_s = p1.r + p1.r_spread * (p.pow(cells[i].rand,2) - 0.5);
                cells[i].r_h = cells[i].r_s/2;
            }
            */

            /*
            p.soft_rep = 2*sl_1.val * p_def.soft_rep;
            p.adh_stiffness = pow(2*sl_2.val,2) * p_def.adh_stiffness;
            const p3 = abs(1 - 2*sl_3.val);
            walls[0].pos.y = y(25) + p3 * y(35);
            walls[1].pos.y = y(95) - p3 * y(35);
            p.plitho_align = 2*sl_4.val * p_def.plitho_align;
            p.plitho_spread = (2 - 2*sl_4.val) * p_def.plitho_spread;
            p.tumble_dur = (2*sl_5.val) * p.tumble_dur;
            p.chemo = (sl_6.val) * p_def.chemo;
            p.r_spread = pow(2*sl_7.val, 2) * p_def.r_spread;
            for( let i = 0; i < cells.length; ++i) {
            cells[i].r_s = p.r + p.r_spread * (pow(cells[i].rand,2) - 0.5);
            cells[i].r_h = cells[i].r_s/2;
            }
            p.run_speed = (2*sl_8.val) * p_def.run_speed;
            p.cluster_speed = (2*sl_8.val) * p_def.cluster_speed;
            */
    
        const dt = p.min(p.deltaTime / p1.n_substeps, 50 / p1.n_substeps);
        
    
        for( let step = 0; step < p1.n_substeps; ++step ) {
            // remove contacts 
            for( let i = 0; i < cells.length; ++i) {
            for( let j = 0; j < i; ++j) {
                if( expRand(p1.break_adh_dur) ) {
                cnts.removeContact(i, j);
                }
            }
            }
    
            // add contacts
            for( let i = 0; i < cells.length; ++i) {
            for( let j = 0; j < i; ++j) {
                const Rij = cells[i].r_s + cells[j].r_s;
                if( cells[i].type == cells[j].type && pv.dist(cells[i].pos, cells[j].pos) < Rij && expRand(P(i).new_adh_dur) ) {
                cnts.addContact(i, j);
                }
            }
            }
    
            // switch between modes
            for( let i = 0; i < cells.length; ++i) {
            let n_contacts = 0;
            let j = 0;
            for( let k = 0; k < cells.length; ++k ) {
                if( cnts.hasContact(i,k) ) {
                n_contacts += 1;
                j = k;
                }
            }
    
    
            let mi = cells[i].mode;
            if ( (mi == modeRun || mi == modeTumble) && n_contacts > 0 && expRand(p1.cil_init_dur) ) {
                if( n_contacts == 1 ) {
                cells[i].mode = modeCIL;
                cells[i].pol.normalize().mult(p1.cil_speed);
                }
                else {              
                cells[i].mode = modeCluster;
                cells[i].pol.normalize().mult(p1.cluster_speed);
                }
            }
            else if ( mi == modeRun ) {
                if ( expRand(p1.run_dur) ) {
                cells[i].mode = modeTumble;
                cells[i].pol.normalize().mult(p1.tumble_speed);
    
                }
            } else if (mi == modeTumble ) {
                if ( expRand(p1.tumble_dur) ) {
                cells[i].mode = modeRun;
                cells[i].pol.normalize().mult(p1.run_speed);
                }
                else if ( expRand(p1.rotation_dur) ) {         
                cells[i].pol.x = p.sin(p.random(0,2*p.PI));        
                cells[i].pol.y = p.cos(p.random(0,2*p.PI));
                cells[i].pol.normalize().mult(p1.run_speed);
                }
            }
            else if ( mi == modeCIL ) {
                if ( n_contacts > 1 ) {
                cells[i].mode = modeCluster;
                cells[i].pol.normalize().mult(p1.cluster_speed);
                }
                else if ( expRand(p1.cil_dur) ) {
                if ( n_contacts >= 1 ) {
                    cnts.removeContact(i, j);
    
                    const xixj = pv.sub(cells[j].pos, cells[i].pos);
                    cells[j].mode = modeRun;
                    cells[j].pol.set( xixj );
                    cells[j].pol.rotate( p1.cil_spread * p.random(-1,1) * p.PI / 180 );
                    cells[j].pol.normalize().mult(p1.run_speed);
                    
                    cells[i].pol.set( xixj ).mult(-1);
                    cells[i].pol.rotate( p1.cil_spread * p.random(-1,1) * p.PI / 180 );
                }
                cells[i].mode = modeRun;
                cells[i].pol.normalize().mult(p1.run_speed);
                }
            }
            else if ( mi == modeCluster ) {
                if ( n_contacts == 0 ) {
                cells[i].mode = modeRun;
                cells[i].pol.normalize().mult(p1.run_speed);
                }
                else if ( n_contacts == 1 ) {
                cells[i].mode = modeCIL;
                cells[i].pol.normalize().mult(p1.cil_speed);
                }
                else 
                {
                const s = cells[i].pol.mag();
                let rate = P(i).plitho_dur;
                if ( s > 0 ) {
                    rate += P(i).plitho_align/p1.mu * pv.dot(cells[i].pol, cells[i].f)/s;
                }
                rate = p.min(p1.plitho_max_dur, rate);
                rate = p.max(p1.plitho_min_dur, rate);
    
                if ( expRand(rate) ) {
                    cells[i].pol.set( cells[i].f )
                    .normalize()
                    .mult(P(i).cluster_speed).rotate(p.PI * p.random(-1,1)*P(i).plitho_spread);   
                }
                }
            }
            }
    
            // compute forces 
            const mu_f = 0.1;
            for(let i = 0; i < cells.length; ++i) {
            cells[i].f.set(0.0,0.0);
    
            if ( p1.chemo > 0 ) {
                xica = pv.sub(grads.pos, cells[i].pos);
                const angl = xica.angleBetween(cells[i].pol);
                cells[i].pol.setHeading(cells[i].pol.heading() - dt/100 * P(i).chemo *angl );
            }
            }
    
            for(let i = 0; i < cells.length; ++i) {
            cells[i].f.add( pv.mult(cells[i].pol,  p1.mu) );
    
            for(let j = 0; j < i; ++j) {
                const xixj = pv.sub( cells[j].pos, cells[i].pos );
                if ( cnts.hasContact(i, j) ) {
                cells[i].f.add( pv.mult(xixj, p1.adh_stiffness ) );
                cells[j].f.sub( pv.mult(xixj, p1.adh_stiffness ) );
                }
    
                const d = pv.dist(cells[j].pos, cells[i].pos);
                const Rij = cells[i].r_s + cells[j].r_s;
                if( d < Rij && d > Rij/10) {
                cells[i].f.add( pv.mult(xixj, -P(i).soft_rep * (Rij - d)/d ) );
                cells[j].f.sub( pv.mult(xixj, -P(j).soft_rep * (Rij - d)/d ) );
                }
            }
            
            for(let iw = 0; iw < walls.length; ++iw) {
                const wall = walls[iw];
                const d = pv.dot(pv.sub(cells[i].pos, wall.pos), wall.normal);
                if( d > 0 && p.abs(d) < cells[i].r_s  && pv.dist(cells[i].pos, wall.pos) < wall.l/2 + cells[i].r_h) {
                cells[i].f.sub( pv.mult(wall.normal, (p.abs(d)-cells[i].r_s) * P(i).soft_rep) );
                }
                if( d < 0 && p.abs(d) < cells[i].r_s  && pv.dist(cells[i].pos, wall.pos) < wall.l/2 + cells[i].r_h) {
                cells[i].f.add( pv.mult(wall.normal, (p.abs(d)-cells[i].r_s) * P(i).soft_rep) );
                }
            }
            }
    
    
            for(let i = 0; i < cells.length; ++i) {
            // noise 
            cells[i].pos.x += p.sqrt(dt) * p1.diff_coef * p.randomGaussian()
            cells[i].pos.y += p.sqrt(dt) * p1.diff_coef * p.randomGaussian()
    
            // add force
            cells[i].pos.x += mu_f * dt * cells[i].f.x / p1.mu;
            cells[i].pos.y += mu_f * dt * cells[i].f.y / p1.mu;
    
            }
    
            for(let i = 0; i < cells.length; ++i) {
            for(let j = 0; j < i; ++j ) {
                const Rij = cells[i].r_h + cells[j].r_h;
                const d = pv.dist(cells[i].pos, cells[j].pos) - Rij;
                if ( d < 0.0 && d != -Rij) {
                const xixj = pv.sub(cells[i].pos, cells[j].pos);
                xixj.mult(0.5 * d/(d+Rij));
                cells[i].pos.sub(xixj);
                cells[j].pos.add(xixj);
                }
            }
    
            // fix constraints
            for(let iw = 0; iw < walls.length; ++iw) {
                const wall = walls[iw];
                let d = pv.dot(pv.sub(cells[i].pos, wall.pos), wall.normal);
                
                if( !first_step && game_mode == 1) {   
                    if( d < cells[i].r_h ) {
                    cells[i].pos.sub( pv.mult(wall.normal, d - cells[i].r_h) );
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
                else 
                {
                d -= cells[i].r_h;
                if( d < 0 ) {
                    cells[i].pos.sub( pv.mult(wall.normal, d) );
                }
    
                }
            }
            }
        }
    
        first_step = false;
        }
    
        let dragging = false; // Is the object being dragged?
        let dragIndex = -1;
        let offset;     // Mouseclick offset
        let lastMouse;  // Mouseclick last pos 
        let sX, sY;
    
        p.draw = function() {
            p.background(0);
            const aspect_adj = p.width / p.height;
            sX = p.width / w;
            sY = p.height / h * aspect_adj / aspect;
            p.scale( sX, sY );
            p.strokeWeight(2);
            p.noStroke();
    
            for( let r = 0; r < 25; ++r) {
                p.noStroke();
                p.fill(255,128,0,60.0 * ((game_mode == 2 ) ? 0.1 : p1.chemo) );
                p.circle(grads.pos.x, grads.pos.y, r*30);
            }
    
            t = t + p.deltaTime;
            timeStep();


            // Adjust location if being dragged
            if (dragging && dragIndex >= 0 && dragIndex < cells.length) {
                cells[dragIndex].pos.x = p.mouseX/sX;
                cells[dragIndex].pos.y = p.mouseY/sY;
            }
            

            
    
            cnts.draw(cells);
            for(let i = 0; i < cells.length; ++i) {
                cells[i].draw();
            }
    
            for( let i = 0; i < walls.length; i++) {
                const w = walls[i];
                const dx = w.normal.y * w.l / 2;
                const dy = -w.normal.x * w.l / 2;
                if( darkMode )
                    p.stroke(200);
                else
                    p.stroke(0);

                p.line(w.pos.x - dx, w.pos.y - dy, w.pos.x + dx, w.pos.y + dy)
            }
        }


        p.mousePressed = function() {
            let dm = 2*(w+h); 
            let di;
            mouse = p.createVector( p.mouseX/sX, p.mouseY/sY );
            for( let i = 0; i < cells.length; ++i) {        
                di = mouse.dist(cells[i].pos);
                if( di < dm ) {
                    dragIndex = i;
                    dm = di;
                }
            }

            if( dragIndex >= 0 && dragIndex < cells.length && dm <= cells[dragIndex].r_s ) {
                dragging = true;
            }
        }


        p.mouseReleased = function() {
            // Quit dragging
            dragging = false;
        }


        p.windowResized = function() {
            const height_proposal = parent.clientHeight;
            const width_proposal = parent.clientWidth;
            const aspect_proposal = width_proposal / height_proposal;
            p.resizeCanvas(width_proposal, height_proposal * aspect_proposal / aspect);
        }

        let run_btn = document.getElementById("sim_1_reset");
        run_btn.onclick = function(){init();};

    }
    
    let sim_cm_p5 = new p5(sim_cm, 'sim_cm');
</script>

</div>

