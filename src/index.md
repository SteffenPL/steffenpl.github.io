---
title: "About me"
date: 2022-05-28T21:55:16+02:00
layout: markdown
---


<div class="sm:float-right sm:max-w-[12em] sm:ml-2 md:flex hidden drop-shadow-xl">

![](/steffen_red.jpg)
</div>

I'm a program-specific researcher (post doc) at [ASHBi, KUIAS, Kyoto University](https://ashbi.kyoto-u.ac.jp/) in [Seirin-Lee's](https://sites.google.com/site/seirin711lee/home) lab.

I studied mathematics at [TU Kaiserslautern](https://www.mathematik.uni-kl.de/en/) with stays at [TU Delft](https://www.tudelft.nl/en/eemcs/the-faculty/departments/applied-mathematics) and [The University of Auckland](https://www.auckland.ac.nz/en/science/about-the-faculty/department-of-mathematics.html),
and obtained my PhD at [University of Vienna](https://mathematik.univie.ac.at/en/research/biomathematics-and-dynamical-systems/) in [Sara Merino-Aceituno's](https://sites.google.com/view/saramerinoaceituno/about) group.


<div class="container md:hidden drop-shadow-xl">
<img class="mx-auto max-w-[12em]" src="./steffen_red.jpg">
</div>

With my research, I want to answer **questions in biology using mathematical tools**. I have worked on mechanical models in developmental biology (epithelial-to-mesenchymal transitions), muscle dynamics, molecular dynamics and phage-bacterial interactions.

My mathematical toolset includes **mathematical modelling** with ordinary, stochastic and partial differential equations. An emphasis lies on **constrained systems** such as differential inclusions and differential-algebraic equations. My key experties is the implementation of efficient **numerical simulations** for such models and the development of **models in collaboration with biologists**.

You can find a description of my current projects in the [research section]({{ '/research' | url }}), talk slides [here]({{'/activities' | url}}) and some more general posts in my [blog]({{ '/blog' | url }}).

## News

Our **standalone EMT simulator** is online: [semtor.github.io](https://semtor.github.io/){target="_blank"}. <br>
See also the corresponding preprint [Modelling variability and heterogeneity of EMT scenarios highlights nuclear positioning and protrusions as main drivers of extrusion](https://www.biorxiv.org/content/10.1101/2023.11.17.567510v1){target="_blank"} for more details.

## Contact and links

<small>
<!--Office 03.125, Faculty of Mathematics, Oskar-Morgenstern-Platz 1, Vienna.<br>-->
E-Mail: <a href="mailto:plunder.steffen.2a@kyoto-u.ac.jp">plunder.steffen.2a@kyoto-u.ac.jp</a>
</small>

Links: [GitHub/SteffenPL](https://github.com/SteffenPL) | [ResearchGate](https://www.researchgate.net/profile/Steffen-Plunder) | [ORCID](https://orcid.org/0000-0002-3371-3790) | [LinkedIn](https://at.linkedin.com/in/steffen-plunder) | [Twitter/X](https://twitter.com/SteffenPlunder)


## Preprints

6. **S. Plunder, C. Danesin, B. Glise, M. A. Ferreira, [S. Merino-Aceituno](https://sites.google.com/view/saramerinoaceituno){target="_blank"}, [E. Theveneau](https://cbi-toulouse.fr/eng/equipe-theveneau){target="_blank"}**, _Modelling variability and heterogeneity of EMT scenarios highlights nuclear positioning and protrusions as main drivers of extrusion._ **(2023)** [bioRxiv](https://www.biorxiv.org/content/10.1101/2023.11.17.567510v1){target="_blank"}.
{reversed=reversed}

5. **S. Plunder, [S. Merino-Aceituno](https://sites.google.com/view/saramerinoaceituno){target="_blank"}**, _Convergence proof for first-order position-based dynamics: An efficient scheme for inequality constrained ODEs._ **(2023)** [arxiv](https://arxiv.org/abs/2310.01215){target="_blank"}.
{reversed=reversed}

## Publications (peer-reviewed)

1. **S. Plunder, M. Burkard, T, Helling, U. M. Lauer, L. E. Hoelzle and [L. Marongiu](https://nutritionalbiochemistry.uni-hohenheim.de/en/luigi-marongiu-en){target="_blank"}** _Determination of optimal phage load and administration time for antibacterial treatment._ Current Protocols. **(2024)** [DOI:10.1002/cpz1.954](https://doi.org/10.1002/cpz1.954){target="_blank"}.{reversed=reversed}

3. **S. Plunder, [B. Simeon](https://www.mathematik.uni-kl.de/en/das/people/head/simeon){target="_blank"},** _The mean-field limit for particle systems with uniform full-rank constraints._ Kinetic and Related Models. **(2023)** [DOI:10.3934/krm.2023012](https://www.aimsciences.org/article/doi/10.3934/krm.2023012){target="_blank"}, [arxiv](https://arxiv.org/abs/2203.07249){target="_blank"}.
{reversed=reversed}

2. **S. Plunder, M. Burkard, U. Lauer, S. Venturelli, [L. Marongiu](https://nutritionalbiochemistry.uni-hohenheim.de/en/luigi-marongiu-en){target="_blank"},** _Determination of phage load and administration time in simulated occurrences of antibacterial treatments._ Frontiers of Medicine, **(2022).** [DOI: 10.3389/fmed.2022.1040457](https://doi.org/10.3389/fmed.2022.1040457){target="_blank"}.
{reversed=reversed}

1. **S. Plunder, [B. Simeon](https://www.mathematik.uni-kl.de/en/das/people/head/simeon){target="_blank"},** _Coupled Systems of Linear Differential-Algebraic and Kinetic Equations with Application to the Mathematical Modelling of Muscle Tissue._
In: Reis, T., Grundel, S., Schöps, S. (eds) Progress in Differential-Algebraic Equations II. Differential-Algebraic Equations Forum. Springer, Cham. **(2020).** [DOI: 10.1007/978-3-030-53905-4_12](https://doi.org/10.1007/978-3-030-53905-4_12){target="_blank"}, [arxiv](https://arxiv.org/abs/1911.05468){target="_blank"}.
{reversed=reversed}

## Software packages

*I am currently making various tools for **agent-based modelling** available as Julia packages.*

- [SpatialHashTables.jl](https://github.com/SteffenPL/SpatialHashTables.jl){target="_blank"}: A Julia package for spatial hashing of particles (in 2D and 3D). This allows fast collision detection even is unbounded domains.
- [BoundedDegreeGraphs.jl](https://github.com/SteffenPL/BoundedDegreeGraphs.jl){target="_blank"}: A Julia package for graphs with bounded degree, with focus on allocation free operations commonly 
used in agent-based modelling. 