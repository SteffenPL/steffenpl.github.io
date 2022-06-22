---
title: First-order position-based dynamics
start: 2020-10-01
layout: markdown
desc: Numerical analysis of a very simple, but equally fast and stable numerical method from computer graphics.
order: 2
img: ./imgs/PBD/2spheres.png
---

_Short project description:_

# {{ title }}

_This project is a collaboration with Sara Merino-Aceituno._

Position-based dynamics (PBD) can be used to **simulate first-order differential equations with inequality constraints.** I aim to show mathematically that the method converges.


Before we go into the mathematics behind PBD, let's have a look how such simulations can look like.

_Note: You can add more disks by clicking inside the rectangle._

<div class="container mx-auto w-max">
<button id="sim_1_run" class="flex border-2 border-lime-800 hover:bg-lime-300 bg-lime-200 rounded-xl pl-4 pr-4 my-4 drop-shadow-xl">Restart</button>
</div>
<div class="container mx-auto w-max">
<div id="sim_1" class="flex drop-shadow-xl border-2 w-[240px]"></div>
</div>

## The magic of position-based dynamics (PBD)

The simulation above uses a very simple numerical method. In fact, [Matthias Müller](https://matthias-research.github.io/pages/challenges/challenges.html) 
challenges everyone to find a method that beats PBD in terms of
- accuracy[^1]
- speed,
- simplicity or 
- stability.

For my applications in the simulation of [epithelial tissue](../epithelial-to-mesenchymal) and [cell migration](../cell-migration-model), all these properties were definitely visible and provided a huge advantage; especially **the speed of PBD allowed us to simulate up to $100\times$ faster compared to multiple other methods!**

## How does it work?

There are many similar ways to mix inequality constraints and differential equations. In this brief description, I will use the velocity projection approach.

Let $x = (x_1,\dots,x_N) \in \Reals^{2N}$ denote the position of all $N$ disks with radius $R > 0$. If we denote the forces as $f(x)$ then the typical model would be a differential equation
$$
\dot x = f(x).
$$
However, if we impose that the disks do not overlap, we need to add extra conditions.
One way to integrate those is to define a set of feasible configurations, first for individual non-overlap
$$
S_{ij} = \{ x \in \Reals^{2N} \mid \Vert x_i - x_j \Vert \geq 2R \}
$$
and then combined 
$$
S = \bigcap_{ij} S_{ij}.
$$
With the set of feasible states $S$, the resulting projected dynamics are
$$
\dot x = P_{T(S,x)}( \, f(x) \, )
$$
where $P_{T(S,x)}$ denotes the projection onto the tangent cone $T(S,x)$ of $S$ at $x$.
[^Tangent_cone]

[^Tangent_cone]: As the set $S$ happens to be uniformly proxy-regular, the differnt notions
for tangent cones coincided. See for example [Wikipedia: Clarke tangent cone](https://en.wikipedia.org/wiki/Tangent_cone#Clarke_tangent_cone) for a definition.

The PBD method for this first-order problem is very simple. For a numerical time-step $h > 0$ and inital condition $x_0 \in S$, the PBD method reads
$$
x_{k+1} = P_{S_{12}} \circ P_{S_{13}} \circ\cdots \circ P_{S_{N-1 N}} ( x_{k} + h f(x_{k}) )
\quad 
\text{for } k \geq 0.
$$

The remarkable feature of PBD is that it only performs a few very fast projections, one for each (active) constraint. This is much less than comparable methods use!
Because of this minimalistic approach, it will most likely happen that the constraints are not always satisfied, i.e. that sometimes $x_k \notin S$. However, these small infeasibility issues reduce with a smaller time-step. The time saved thanks to fast projections can be well invested by taking smaller time-steps! And taking smaller time-steps has many advantages and improves both the stability and physical accuracy of the method! For this reason, the authors called the corresponding publication ["Small Steps in Physics Simulation"](https://matthias-research.github.io/pages/publications/smallsteps.pdf).


### Visualisation of the intermediate projections

The following video visualises how PBD works.
It shows not only the time-steps $x_0, x_1, ...$ but also the intermediate 
steps of PBD, i.e. $x_k + h f(x_k)$ (Euler step), $P_{S_{1 2}}(x_k + h f(x_k))$ (Fix constraint (1,2)), $P_{S_{1 3}}( P_{S_{1 2}}(x_k + h f(x_k)))$ (Fix constraint (1,3)), ...

**To make the effect visible, the time-step size $h$ is very large in the second video. Usually the overlap is visually neglectable.**

<div class="container md:columns-2">
<div class="mx-auto">
    <video width="320" class="mx-auto" autoplay loop>
    <source type="video/mp4" src="{{ '/assets/videos/000_pbd_small_dt.mp4' | url }}">
    </video>
</div>

<div class="mx-auto">
    <video width="320" class="mx-auto pt-8" autoplay loop>
    <source type="video/mp4" src="{{ '/assets/videos/003_pbd_large_dt.mp4' | url }}">
    </video>
</div>
</div>


## Project aim

Up to my knowledge, it is not clear if PBD converges in a mathematically rigorous sense!

The goal is to show that for sufficiently small time-steps $h$ the numerical approximation of PBD $x_h(t)$ converges towards the exact solution $x(t)$, i.e.
$$
\sup_{t \in [0,T]} \Vert x_h(t) - x(t) \Vert \to 0
\quad 
\text{for } h \to 0.
$$

Numerical tests seem to support this claim (with order of convergence $\frac{1}{2}$ which is similar to [these results](https://arxiv.org/abs/1009.2837)). But even if no strict convergence is archived, the method might still be useful if the global error admits some useable upper bounds.


## Mathematical details

There exists already some great related work
on similar problems. Without attempting to give full references here I will just point to Juliette Venel's work, in particular, her publication on a ["Numerical scheme for a whole class of sweeping process"](https://arxiv.org/abs/0904.2694).

Some related details:
- It is known that the method
$$
x_{k+1} = P_S( x_k + h f(x_k))
$$
converges to the unique solution, provided that
$S$ is a uniform proxy-regular set and $f$ is Lipschitz and has at most linear growth.
But projections onto a non-conves set $S$ are numerically very time consuming.  

- The PBD method is originally proposed for second-order equations (Newton's laws).
I have used the second-order version of PBD in [this example]({{ '/blog/posts/p5js' | url }}).

- There are many related results in convex and variational analysis
which provide many useful results to study the
geometric properties of the projections and tangent/normal cones.

## To be continued...

This page describes ongoing research, as such, it is subject to change.
Feel free to contact me, if you find this project interesting or if you have ideas related to it!



[^1]: I couldn't find mathematical proof for the 
accuracy of PBD yet. But it is clear that for applications in computer graphics PBD excels in terms of accuracy.

<!-- this is here to allow markdown preview with scripts -->
{%- if false -%}
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.1/p5.min.js" integrity="sha512-NxocnqsXP3zm0Xb42zqVMvjQIktKEpTIbCXXyhBPxqGZHqhcOXHs4pXI/GoZ8lE+2NJONRifuBpi9DxC58L0Lw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
{%- endif -%}


<div>

<script>
    const pv = p5.Vector;
    var sim_1 = function(p) {

        const w = 240;
        const h = 320;

        const n_sub = 40;
        const x_0 = w/2;
        const y_0 = h/4;

        function f(z) { return p.createVector(0.0, 0.1); }
        
        const R = 20;
        let X = [];

        p.setup = function() {
          p.createCanvas(w, h);
          p.frameRate(30);

        }

        function init(){
          X.length = 0;

          for( let i = 0; i < 10; ++i) {
           X[i] = p.createVector(x_0 + p.random(-R,R), y_0 + p.random(-R,R));
          }
        }
        init();

        p.draw = function() {
            p.background(255,255,255);
            
            const N = X.length;
            const dt = p.deltaTime / n_sub;
            
            for( let k = 0; k < n_sub; ++k ) 
            {
                for( let i = 0; i < N; ++i ) {
                    X[i].add( pv.mult(f(X[i]), dt) );
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
                        let d = pv.dist(X[i], X[j]);
                        if( d-2*R < 0 && d > 0) {
                            const xixj = pv.mult(pv.sub( X[i], X[j] ), 0.5*(d-2*R)/d);
                            X[i].sub( xixj );
                            X[j].add( xixj );
                        }
                    }
                }
            }

          p.noStroke();
          for( let i = 0; i < N; ++i ) {
            p.fill(100,150,70);
            p.circle(X[i].x, X[i].y, 2*R);
          }
        }


        p.mouseClicked = function(){
            let N = X.length; 
            if( p.mouseX > 0 && p.mouseX < p.width 
                && p.mouseY > 0 && p.mouseY < p.height) {
                X[N] = p.createVector( p.mouseX, p.mouseY );
            }
        }

        let run_btn = document.getElementById("sim_1_run");
        run_btn.onclick = function(){init();};

    };



    let myp5 = new p5(sim_1, 'sim_1');
</script>
</div>
