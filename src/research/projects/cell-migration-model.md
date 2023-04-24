---
title: "Cell migration model for plithotaxis"
start: 2021-06-01
layout: markdown
desc: Development of an agent-based cell migration model for plithotaxis.
order: 3
img: ./imgs/CM/LNdW.png
---


_Short project description:_
# {{ title }}

*This project is a collaboration with [Eric Theveneau](https://cbi-toulouse.fr/eng/equipe-theveneau){target="_blank"}, [Marina A. Ferreria](https://marinaaferreira.wordpress.com/){target="_blank"}, [Diane Peurichard](https://sites.google.com/site/dianepeurichard/home){target="_blank"}, [Pierre Degond](https://sites.google.com/site/degond/Home){target="_blank"} and [Sara Merino-Aceituno](https://sites.google.com/view/saramerinoaceituno){target="_blank"}.*

The cell migration of mesenchymal cells after they leave the epithelium is very specific and it is not clear 
which cell migration model is most appropriate. While there are many possible theoretical models and rules for cell migration, the experimental data do not clearly indicate which of these rules are the correct ones. 

At the moment we are building a model which includes effects such as plithotaxis, contact inhibition of locomotion
and chemotaxis. 


**The following simulation is absolutely preliminary. It is a simplified** version which I prepared for a public science event ("Lange Nacht der Forschung" in Vienna, 2022). The goal of the event was to explore under which conditions cells organise themself.

Some experiments one can perform with the simulation: 
- Do cells still migrate collectively in the absence of cell-cell repulsion?
- How important is confinement? 
- You can interactively move cells with the mouse. Can you change the direction of migration that way? 

<div>

<div class="grid md:grid-cols-3 grid-cols-2 prose-p:p-0 prose-p:m-0">
<div>
<p>Plithotaxis</p>
<input type="range" id="sl_plitho" ></input>
</div>
<div>
<p>Confinement</p>
<input type="range" id="sl_confinement" ></input>
</div>
<div>
<p>Cell-cell repulsion</p>
<input type="range" id="sl_soft_rep" ></input>
</div>
<div>
<p>Adhesion strength</p>
<input type="range" id="sl_adh_stiffness" ></input>
</div>
<div>
<p>Heterogeneity</p>
<input type="range" id="sl_heterogeneity" ></input>
</div>
<div>
<p>Chemotaxis</p>
<input type="range" id="sl_chemo" value="0"></input>
</div>
<div>
<p>Number of cells</p>
<input type="range" id="sl_N" value="90" min="0" max="120" step="10"></input>
</div>
</div>

<div id="sim_cm" class="max-w-full;">
</div>

<div class="container mx-auto w-max">
<button id="sim_1_reset" class="flex border-2 border-red-600 hover:bg-red-300 bg-red-200 rounded-xl pl-4 pr-4 mb-4 drop-shadow-xl">Restart</button>
</div>
</div>


## Description of the simulation

The green spheres represent the cells, and the transparent spheres around them indicate the 
repulsive domain. In addition, cells can form temporary adhesive bonds which are displayed as orange lines.

 Each cell is The red line displays the forces which are acting on the cell.
The black line shows the polarity, cells will always try to run in direction of their polarity.

Parameters:
- **Plithotaxis:** Cells react to the forces by changing their polarity. If the polarity and the forces are not aligned, then the cells will sooner pick a new polarity which tends to be more aligned with the forces.
- **Confinement:** Controls the upper and lower walls, hence the available space.
- **Cell-cell repulsion:** Strength of repulsion between cells.
- **Adhesion strength:** Determines how strongly the adhesive bond pulls the cells together.
- **Heterogeneity:** Determines how much the size of cells varies. [^het]
- **Chemotaxis:** Adds an attractive chemical to the right side of the domain; cells will try to turn towards the chemoattractant.

[^het]: Of course, this is only one out of many ways in which cells can vary!

## Features of the model

Even this simplified model can reproduce certain realistic aspects, such as:
- Collective cell migration of a cluster occurs only under specific conditions, e.g. if the following conditions are satisfied:
    - confinement ('limited space forces the cells to collaborate')
    - cell-cell adhesion ('cells stick together')
    - cell-cell repulsion ('cells push each other')
    - cell polarity changes according to the forces the cell experiences
- Cells do not perfectly align during migration, it is rather a messy and chaotic situation (typical for real biology).
- Cells can turn around if they run out of space in one direction.

An example of this behaviour can be seen in the image below:

![](imgs/CM/cm_01-3.png)

## Numerical method

As in my previous project, we used again [position-based dynmaics](../position-based-dynamics).



<!-- this is here to allow markdown preview with scripts -->
{%- if false -%}
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.1/p5.min.js" integrity="sha512-NxocnqsXP3zm0Xb42zqVMvjQIktKEpTIbCXXyhBPxqGZHqhcOXHs4pXI/GoZ8lE+2NJONRifuBpi9DxC58L0Lw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
{%- endif -%}


<div>

<script>



    let sim_cm = function(p) {

        let parent = document.getElementById('sim_cm');
        let sl_chemo = document.getElementById('sl_chemo');
        let sl_plitho = document.getElementById('sl_plitho');
        let sl_soft_rep = document.getElementById('sl_soft_rep');
        let sl_adh_stiffness = document.getElementById('sl_adh_stiffness');
        let sl_confinement = document.getElementById('sl_confinement');
        let sl_heterogeneity = document.getElementById('sl_heterogeneity');
        let sl_N = document.getElementById('sl_N');
    
        let p_def = {
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
            
            /*
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
            */
            p.fill(this.col.r, this.col.g, this.col.b);
            p.circle(this.pos.x, this.pos.y, this.r_h*2);

            p.stroke(0,0,0, 120);
            p.line(this.pos.x, this.pos.y, this.pos.x + this.r_s * this.pol.x, this.pos.y + this.r_s * this.pol.y);
            if( true ) {
            p.stroke(150,0,0, 70);
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

            if( sl_N.value != cells.length ) {
                N = sl_N.value; 
                init();
            }

            p1.chemo = sl_chemo.value / 100 * p_def.chemo;
            p1.plitho_align = sl_plitho.value / 100 * p_def.plitho_align;
            p1.r_spread = ( 4 - p.map(100 - sl_heterogeneity.value,0,100,0,4)) * p_def.r_spread;
            p1.adh_stiffness = p.map(sl_adh_stiffness.value,0, 100,0,2) * p.map(sl_adh_stiffness.value,0, 100,0,2) * p_def.adh_stiffness;
            p1.soft_rep = p.map(sl_soft_rep.value, 0, 100, 0.7, 2) * p_def.soft_rep;

            const p_wall = p.sqrt(sl_confinement.value / 100);
            walls[0].pos.y = 10 + p_wall*(h-40)/2;
            walls[1].pos.y = h - p_wall*(h-40)/2;

            for( let i = 0; i < cells.length; ++i) {
                cells[i].r_s = p1.r + p1.r_spread * (p.pow(cells[i].rand,2) - 0.5);
                cells[i].r_h = cells[i].r_s/2;
            }

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
            if ( (mi == modeRun || mi == modeTumble) && n_contacts > 0 && expRand(p1.cntc_dur) ) {
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
                    cells[j].pol.normalize().mult(p1.run_speed);
                    
                    cells[i].pol.set( xixj ).mult(-1);
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
                rate = p.min(p1.plitho_max, rate);
                rate = p.max(p1.plitho_min, rate);
    
                if ( expRand(rate) ) {
                    cells[i].pol.set( cells[i].f )
                    .normalize()
                    .mult(P(i).cluster_speed).rotate(p.random(-1,1)*P(i).plitho_spread);   
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
            p.background(255);
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

[^1]: Our main model are neural crest cells which undergo EMT in the early stages of the development of chicken embryo.
