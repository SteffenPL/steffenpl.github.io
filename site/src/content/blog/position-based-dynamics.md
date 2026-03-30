---
title: "First-order position-based dynamics"
date: "2020-10-01"
slug: "position-based-dynamics"
tags:
  - Constrained dynamics
  - Particle simulations
  - Numerical analysis
---

# First-order position-based dynamics

*This project is a collaboration with [Sara Merino-Aceituno](https://sites.google.com/view/saramerinoaceituno).*


### Preprint:

- **S. Plunder, [S. Merino-Aceituno](https://sites.google.com/view/saramerinoaceituno)**, _Convergence proof for first-order position-based dynamics: An efficient scheme for inequality constrained ODEs._ **(2023)** [arxiv](https://arxiv.org/abs/2310.01215).


## Fast and simple simulations with contact forces


Position-based dynamics (PBD) can be used to **simulate first-order differential equations with inequality constraints.** I aim to show mathematically that the method converges.

I used this numerical method for both of my modelling projects, for example in the [cell migration model for plithotaxis](/blog/cell-migration-model) and the [EMT model](/blog/epithelial-to-mesenchymal).

## The magic of position-based dynamics (PBD)

[Matthias Muller](https://matthias-research.github.io/pages/challenges/challenges.html)
challenges everyone to find a method that beats PBD in terms of
- accuracy
- speed,
- simplicity or
- stability.

For my applications in the simulation of [epithelial tissue](/blog/epithelial-to-mesenchymal) and [cell migration](/blog/cell-migration-model), all these properties were definitely visible and provided a huge advantage; especially **the speed of PBD allowed us to simulate up to $100\times$ faster compared to multiple other methods!**

## How does it work?

There are many similar ways to mix inequality constraints and differential equations. In this brief description, I will use the velocity projection approach.

Let $x = (x_1,\dots,x_N) \in \mathbb{R}^{2N}$ denote the position of all $N$ disks with radius $R > 0$. If we denote the forces as $f(x)$ then the typical model would be a differential equation
$$
\dot x = f(x).
$$
However, if we impose that the disks do not overlap, we need to add extra conditions.
One way to integrate those is to define a set of feasible configurations, first for individual non-overlap
$$
S_{ij} = \{ x \in \mathbb{R}^{2N} \mid \Vert x_i - x_j \Vert \geq 2R \}
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

[^Tangent_cone]: As the set $S$ happens to be uniformly proxy-regular, the different notions
for tangent cones coincide. See for example [Wikipedia: Clarke tangent cone](https://en.wikipedia.org/wiki/Tangent_cone#Clarke_tangent_cone) for a definition.

The PBD method for this first-order problem is very simple. For a numerical time-step $h > 0$ and initial condition $x_0 \in S$, the PBD method reads
$$
x_{k+1} = P_{S_{12}} \circ P_{S_{13}} \circ\cdots \circ P_{S_{N-1\, N}} ( x_k + h f(x_k) )
\quad
\text{for } k \geq 0.
$$

The remarkable feature of PBD is that it only performs a few very fast projections, one for each (active) constraint. This is much less than comparable methods use!
Because of this minimalistic approach, it will most likely happen that the constraints are not always satisfied, i.e. that sometimes $x_k \notin S$. However, these small infeasibility issues reduce with a smaller time-step. The time saved thanks to fast projections can be well invested by taking smaller time-steps! And taking smaller time-steps has many advantages and improves both the stability and physical accuracy of the method! For this reason, the authors called the corresponding publication ["Small Steps in Physics Simulation"](https://matthias-research.github.io/pages/publications/smallsteps.pdf).


### Visualisation of the intermediate projections

The following video visualises how PBD works.
It shows not only the time-steps $x_0, x_1, \ldots$ but also the intermediate
steps of PBD, i.e. $x_k + h f(x_k)$ (Euler step), $P_{S_{1 2}}(x_k + h f(x_k))$ (Fix constraint (1,2)), $P_{S_{1 3}}( P_{S_{1 2}}(x_k + h f(x_k)))$ (Fix constraint (1,3)), ...

**To make the effect visible, the time-step size $h$ is very large in the second video. Usually the overlap is visually neglectable.**

<div class="grid md:grid-cols-2 gap-4">
<div class="mx-auto">
    <video width="320" class="mx-auto" autoplay loop muted>
    <source type="video/mp4" src="/videos/000_pbd_small_dt.mp4">
    </video>
</div>

<div class="mx-auto">
    <video width="320" class="mx-auto" autoplay loop muted>
    <source type="video/mp4" src="/videos/003_pbd_large_dt.mp4">
    </video>
</div>
</div>


## Our new convergence proof

Up to my knowledge, it is not clear if PBD converges in a mathematically rigorous sense! Many numerical
experiments show that the method is very capable. However, it is often also used in contexts where the
method only gives visually pleasing but inaccurate results.

In the case of **overdamped** dynamics, we could show that for sufficiently small time-steps $h$ the numerical approximation of PBD $x_h(t)$ converges towards the exact solution $x(t)$, i.e.
$$
\sup_{t \in [0,T]} \Vert x_h(t) - x(t) \Vert \to 0
\quad
\text{for } h \to 0.
$$

We refer to our [preprint](https://arxiv.org/abs/2310.01215) for details.

### Key ideas of the convergence proof

Dealing with the theory of non-smooth dynamics is technically involved, as it requires
generalisations from non-convex analysis such as proximal normal cones and subdifferential calculus.

The two main ingredients of the convergence are, to show that
the feasible sets $S_{ij}$ are uniformly prox-regular and that projection onto the intersection
$S = \bigcap_{ij} S_{ij}$ is locally a contraction.

Showing the contraction property is the main challenge, but if one assumes that the
intersection is **metrically calm**, that is, that there exists a constant $\gamma > 0$ such that locally
$$
\mathrm{dist}(x, S) \leq \gamma \sum_{1 \leq i < j \leq N} \mathrm{dist}(x, S_{ij}),
$$
then one can show the contraction property which is the key step to numerical stability.


For numerical consistency, we introduce a new notation of so-called **scalarly upper semicontinuous consistency**.
The idea here is that the tangent cone $T(S,x)$ is not defined for $x \notin S$ and numerical approximations might
be indeed outside of the set $S$. To compensate for this, we need the right generalisation of numerical consistency.
However, the notion of convergence for $h \to 0$ cannot be very strong, since otherwise it would imply that the
solution is differentiable, but this cannot be since contact forces always imply that the solution will have discontinuous velocities
and points where the trajectory is not differentiable. Using the notion of scalarly upper semicontinuity turns out to be just
strong enough to show convergence, but weak enough to be applicable.


Together, these two ideas allow us to show that the numerical approximation $x_h(t)$ converges towards the exact solution $x(t)$.

For more details and proofs, we refer to our [preprint](https://arxiv.org/abs/2310.01215).
