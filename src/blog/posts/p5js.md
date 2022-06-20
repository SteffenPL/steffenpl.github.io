---
title: 🍎 Interactive modelling with p5.js
layout: markdown
id: 1
date: 2022-06-13
---

# {{ title }}

I worked a lot with particle models (molecular dynamics, agent-based models).
In all those cases plotting is at times even more tedious than writing the simulation itself.

A nice tool to circumvent this issue in the prototyping stage is the javascript library [p5js](https://p5js.org)!
Let's dive straight into it.

## First steps first: the model

Every simulation starts (hopefully) with a rough model in mind.
Let's simulate an apple 🍎 falling down. The corresponding model is of course Newton's second law
$$
m \ddot x = -m g x.
$$

## Example simulation with p5js

Below you can see a simple example for this model using p5js. 

**Click into the white area to add more apples** 😉. [^0] 
[^0]: For the curious reader, to add more objects we need to deal with collisions. I used the Position-based dynamics method, you can read more about this method [here]({{ '/research/projects/position-based-dynamics' | url }}) and in the cited references therein.

<div>

<div class="container mx-auto w-max">
<button id="demo_1_run" class="flex border-2 border-red-600 hover:bg-red-300 bg-red-200 rounded-xl pl-4 pr-4 mb-4 drop-shadow-xl">Restart</button>
</div>
<div class="container mx-auto w-max">
<div id="demo_1" class="flex drop-shadow-xl border-2 w-[240px]"></div>
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
        let cooldown = 0;
        
        const g = 10 * 9.81; // in pixel ;)
        function f(z) { return q5.createVector(0.0, g); }
        
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

            if( cooldown <= 0 ) {
              for( let i = 0; i < N; ++i ) {
                  V[i].add( qv.mult(f(X[i]), dt) );
                  X[i].add( qv.mult(V[i], dt) );
              }
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

            if( cooldown <= 0 ) {
              for( let i = 0; i < N; ++i ) {
                V[i] = qv.mult(qv.sub(X[i],X_old[i]),1.0/dt);
              }
            }
            else {
              cooldown = cooldown - 1;
            }
        }

          q5.noStroke();
          for( let i = 0; i < N; ++i ) {
            q5.fill(200,50,50);
            q5.circle(X[i].x, X[i].y, 2*R);
            q5.fill(30,150,30);
            q5.triangle(X[i].x - 0.1*R, X[i].y - 0.8*R, X[i].x + 0.5*R, X[i].y - 1.1*R, X[i].x + 0.3*R, X[i].y - 1.3*R);
          }
        }
        
        q5.mouseClicked = function(){
            N = X.length; 
            X[N] = q5.createVector( q5.mouseX, q5.mouseY );
            V[N] = q5.createVector( 0.0, 0.0 );


            cooldown = 0;
            N = X.length; 
            for( let i = 0; i < N; ++i ) {
                for( let j = 0; j < i; ++j ) {
                    let d = qv.dist(X[i], X[j]);
                    if( d-2*R < 0 && d > 0) {
                      cooldown = 2*n_sub;
                    }
                }
            }
        }

        let run_btn = document.getElementById("demo_1_run");
        run_btn.onclick = function(){init();};
</script>


## How does it work?

For simplicity, we just simulate one apple 👍. 
How many lines do we need for that, including the simulation and plotting?

**With p5js, we need only 32 lines!**[^F]
[^F]: In case you are wondering: The full simulation shown above, with restart button and arbitray many apples, just needs 111 lines!

First we define the objects we need.
```javascript
let pv = p5.Vector;  // shortcut for using p5.Vector functions

let X, V, gravity;      // position, velocity and gravity
const R = 20;        // radius in pixel
```

For p5js we only need to define two functions: `setup` and `draw`. The `setup` function is called once in the beginning and the `draw` for each time-step. Easy 🙂!

The `setup` function in our case just initiated the initial position, velocity and a vector pointing downwards.
```javascript
function setup() {
  createCanvas(240, 320);
  frameRate(30);
  
  X = createVector(width/2, height/4);
  V = createVector(0.0, 0.0);
  gravity = createVector(0.0, 0.001);
}
```

Finally, the `draw` function will draw the canvas white and iterate the _symplectic Euler method_ [^2]
[^2]: The symplectic Euler method is preferable to the explicit or implicit Euler method here, as it will almost conserve the total energy of the system.

$$
v_{n+1} = v_n + \Delta t f(x_n), \\ 
x_{n+1} = x_n + \Delta t v_{n+1}.
$$
Then we ensure that the apple stays within the canvas[^1] 
and draw it.
[^1]: The only small complication is that the point $(0,0)$ is on the top right of the image canvas, which means that the ground is at $(0,h)$ when $h$ is the height of the canvas.

```javascript
function draw() {
  background(255,255,255);
  
  // symplectic Euler method
  V.add( pv.mult( gravity, deltaTime ) );
  X.add( pv.mult( V, deltaTime) );
  
  // keep apple above the ground
  if( X.y + R > height){
    X.y = height - R;
    V.y = 0.0;
  }

  // draw apple
  fill(200,50,50);
  noStroke();
  circle(X.x, X.y, 2*R);
}
```
_Voila._ That's it! From here you could start to experiment
with the simulation. For example using the online [p5js-editor 🚀 ](https://editor.p5js.org/SteffenPL/sketches/U9U_L6N4X)!

**Challenge:** Can you modify the example such that
there are two falling apples?  

_You can find all available functions of p5js in the [reference](https://p5js.org/reference/). 
For adding two apples you might want to use the `p5.Vector.dist` function._


