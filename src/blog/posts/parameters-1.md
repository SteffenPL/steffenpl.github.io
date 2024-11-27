---
title: 🧮 On the road of clean parameter estimation
layout: markdown
id: 5
date: 2024-11-27
---

# {{ title }}

I recently gave a lecture on parameter estimation. While we covered some material and in the end people learned how to use Julia, it left me unsatisfied. In this and the following blog posts I want to document my journey in studying parameter estimation more deeply.

## The usual approach

Modelling in biology often leads to models with some known parameters and many unknown factors. It has been like this for ages, and somehow people are able to still find good parameters.

The automated techniques are quite established at this point:
1. Implement your model to allow fast simulations and **automatic differentiation**.
2. Pick either
    1. **Optimisation-based parameter estimation**,
    2. **Bayesian inference**.
3. Define a **cost function**.
4. Define **bounds** or **prior distribtuions** to your unknown parameters.
5. Click optimize or infer and pray.

There seem to be subtlties such as how to compute the derivatives (forward-sensitivities for small models or lazy people or adjoint-sensitivities for large problems), but the overall outline is faily simple. 

## The usual shortcoming: Easy in simple cases, hard in real life?

However, the practice of it seems much less satisfying. Many online tutorials take the Lotka-Volterra predetor-prey model as an example, where a simple cost function gives satisfying results:

<div class="drop-shadow-lg mx-auto">

    <img src="{{ 'imgs/anim_fps5.gif' | url }}" class="mx-auto"></img>

</div>

<div class="text-center text-sm">

    *Figure:* Example parameter fitting using an $L^2$ error and a quasi-Newton (LBFGS) solver. 

</div>

But this is just an ODE model with 4 parameters and 2 unknowns. It hardly represents any real setting. 

For example, in my current project with Seirin-Lee and Jinghao Chen, we face a model with 7 equations, over 20 unknowns and as little data as 4 time points with 6 values each. 

<div class="drop-shadow-lg mx-auto">

    <img src="{{ 'imgs/2024_11_06_params.png' | url }}" class="mx-auto"></img>

</div>

<div class="text-center text-sm">

    *Figure:* Example of our simulations and some preliminary fitting.

</div>

Finding all parameters automatically was not possible so far, which makes me question if I really know the tools well?


## Next steps: Never stop learning!

To tackle this issue, I decided that I need to study more existing examples. Here is my reading list for the next weeks:

1. [PEtab – a data format for specifying parameter estimation problems in systems biology](https://petab.readthedocs.io/en/latest/)
    - It seems great that this initiative exists to exchange tools and techniques. See also [PEtab.jl](https://github.com/sebapersson/PEtab.jl).
2. [Benchmarking-Initiative/Benchmark-Models-PEtab](https://github.com/Benchmarking-Initiative/Benchmark-Models-PEtab)
    - This is the first resource I found with extensive and non-trivial fitting benchmarks! I should train with these models.
3. [SMBLToolkit.jl](https://github.com/SciML/SBMLToolkit.jl)
    - Always good to know how to load other people's models.

I hope that this study will help me to improve my lecture material: [Parameter Estimation for Differential Equations with Julia]({{ '/lectures/param-est-2024' | url }})! 🚧




