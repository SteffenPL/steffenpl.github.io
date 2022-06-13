---
title: 🍎 Interactive modelling with p5.js
layout: markdown
date: 2022-06-13
---

# {{ title }}

I worked a lot with particle models (molecular dynamics, agent-based models)...
in all those cases a typical problem is that plotting the results is just tedious, at times even more than the simulation itself.

A nice tool to circumvent this issue in the prototyping stage is the javascript library [p5js](https://p5js.org)!
Let's dive straight into it.

## The model

Every simulation starts (hopefully) with a rough model in mind.
Let's simulate an apple 🍎 falling down. The corresponding model is of course Newton's second law
$$
m \ddot x = -m g x.
$$

## The visualisation



<div>

<button id="demo_1_run" class="border-2 border-red-600 hover:bg-red-300 bg-red-200 rounded-xl pl-4 pr-4 drop-shadow-xl">Run</button>
<div class="container justify-items-center">
<div id="demo_1" class="drop-shadow-xl border-2 w-[240px]"></div>
</div>
</div>

<script>
  let q5 = new Q5();
        let qv = q5.Vector;
        let parent = document.getElementById("demo_1");
        const w = 240;
        const h = 320;
        const n_sub = 40;
        const dt = 1.0 / 30.0 / n_sub;
        const x_0 = w/2;
        const y_0 = h/4;
        
        const g = 0.1 * 9.81; // in pixel ;)
        function f(z) { return q5.createVector(0.0, g*z.y); }
        
        const R = 20;
        let X = [];
        let V = []; [q5.createVector(0, 0)];
        let X_old = [];
        
        q5.setup = function(){
          q5.createCanvas(w, h);
          parent.appendChild(q5.canvas);
          q5.frameRate(30);
        }
        
        function init(){
          X.length = 0;
          V.length = 0;
          X[0] = q5.createVector(x_0, y_0);
          V[0] = q5.createVector(0.0, 0.0);
        }
        init();
        
        q5.draw = function(){
          q5.background(255,255,255);
        
          const N = X.length;

        
          for( let k = 0; k < n_sub; ++k ) 
          {

            for( let i = 0; i < N; ++i ) {
              if( X_old.length <= i) {
                X_old[i] = q5.createVector(0.0,0.0);
              }
              X_old[i].set(X[i].x, X[i].y);
            }

            for( let i = 0; i < N; ++i ) {
                V[i].add( qv.mult(f(X[i]), dt) );
                X[i].add( qv.mult(V[i], dt) );
            }
                
            for( let i = 0; i < N; ++i ) {
                if( X[i].y > h - R ) {
                X[i].y = h - R;
                }
                if( X[i].x > w - R ) {
                X[i].x = w - R;
                }
                if( X[i].x < R ) {
                X[i].x = R;
                }
            }

            for( let i = 0; i < N; ++i ) {
                for( let j = 0; j < i; ++j ) {
                    let d = qv.dist(X[i], X[j]);
                    if( d-2*R < 0 && d > 0) {
                        const xixj = qv.mult(qv.sub( X[i], X[j] ), 0.5*(d-2*R)/d);
                        X[i].sub( xixj );
                        X[j].add( xixj );
                    }
                }
            }


            for( let i = 0; i < N; ++i ) {
              V[i] = qv.mult(qv.sub(X[i],X_old[i]),1.0/dt);
            }
        }

          q5.fill(200,50,50);
          q5.noStroke();
          for( let i = 0; i < N; ++i ) {
            q5.circle(X[i].x, X[i].y, 2*R);
          }
        }
        
        q5.mouseClicked = function(){
            N = X.length; 
            X[N] = q5.createVector( q5.mouseX, q5.mouseY );
            V[N] = q5.createVector( 0.0, 0.0 );
        }

        let run_btn = document.getElementById("demo_1_run");
        run_btn.onclick = function(){init();};
</script>

## The simulation

## Interact!