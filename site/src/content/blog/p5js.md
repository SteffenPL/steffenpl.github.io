---
title: "Interactive modelling with p5.js"
date: "2022-06-13"
slug: "p5js"
---

<script>
import AppleSim from '$lib/components/sims/AppleSim.svelte';
</script>

I worked a lot with particle models (molecular dynamics, agent-based models).
In all those cases plotting is at times even more tedious than writing the simulation itself.

A nice tool to circumvent this issue in the prototyping stage is the javascript library [p5js](https://p5js.org)!
Let's dive straight into it.

## First steps first: the model

Every simulation starts (hopefully) with a rough model in mind.
Let's simulate an apple falling down. The corresponding model is of course Newton's second law
$$
m \ddot x = -m g x.
$$

## Example simulation with p5js

Below you can see a simple example for this model using p5js.

**Click into the white area to add more apples**. [^0]
[^0]: For the curious reader, to add more objects we need to deal with collisions. I used the Position-based dynamics method, you can read more about this method [here](/research/projects/position-based-dynamics) and in the cited references therein.

<AppleSim />


## How does it work?

For simplicity, we just simulate one apple.
How many lines do we need for that, including the simulation and plotting?

**With p5js, we need only 32 lines!**[^F]
[^F]: In case you are wondering: The full simulation shown above, with restart button and arbitray many apples, just needs 111 lines!

First we define the objects we need.
```javascript
let pv = p5.Vector;  // shortcut for using p5.Vector functions

let X, V, gravity;      // position, velocity and gravity
const R = 20;        // radius in pixel
```

For p5js we only need to define two functions: `setup` and `draw`. The `setup` function is called once in the beginning and the `draw` for each time-step. Easy!

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
\begin{aligned}
v_{n+1} &= v_n + \Delta t f(x_n), \\
x_{n+1} &= x_n + \Delta t v_{n+1}.
\end{aligned}
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
with the simulation. For example using the online [p5js-editor](https://editor.p5js.org/SteffenPL/sketches/U9U_L6N4X)!

**Challenge:** Can you modify the example such that
there are two falling apples?

_You can find all available functions of p5js in the [reference](https://p5js.org/reference/).
For adding two apples you might want to use the `p5.Vector.dist` function._

If you want to read more on the numerical method, check out my project description about [position-based dynamics](/research/projects/position-based-dynamics).
