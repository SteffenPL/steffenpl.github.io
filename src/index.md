---
title: "About me"
date: 2022-05-28T21:55:16+02:00
layout: markdown
---


<div class="sm:float-right sm:max-w-[12em] sm:ml-2 md:flex hidden">
    <img src="/steffen_white.jpg">
</div>

I'm a program-specific researcher (post doc) at [ASHBi, KUIAS, Kyoto University](https://ashbi.kyoto-u.ac.jp/).

> My expertise is to apply math and computer science to real biology.

I studied mathematics at [TU Kaiserslautern](https://www.mathematik.uni-kl.de/en/) with stays at [TU Delft](https://www.tudelft.nl/en/eemcs/the-faculty/departments/applied-mathematics) and [The University of Auckland](https://www.auckland.ac.nz/en/science/about-the-faculty/department-of-mathematics.html), obtained my PhD at [University of Vienna](https://mathematik.univie.ac.at/en/research/biomathematics-and-dynamical-systems/) in [Sara Merino-Aceituno's](https://sites.google.com/view/saramerinoaceituno/about) group and did a post doc in [Seirin-Lee's](https://sites.google.com/site/seirin711lee/home) lab.

<div class="container md:hidden drop-shadow-xl">
<img class="mx-auto max-w-[12em]" src="./steffen_white.jpg">
</div>


You can find a description of my current projects in the [research section]({{ '/research' | url }}), talk and activities [here]({{'/activities' | url}}) and more info in my [CV]({{'/cv' | url}}).

## News and Blog

- _September 2025:_ New preptint on digit organoids!
- _May 2025:_ Two new preprints! 
- _September 2024:_ **New Nature Communications publications on [EMT](https://doi.org/10.1038/s41467-024-51372-z){target="_blank"} and [gastrulation](https://doi.org/10.1038/s41467-024-51638-6){target="_blank"} are out!**
- _March 2024:_ Our **standalone EMT simulator**[^1] is online [semtor.github.io](https://semtor.github.io/){target="_blank"}! 🎉

_My blog posts:_ 
<ul class="list-inside mt-0 pt-0">
{% for item in collections.blog %}
<li>
    <i>{{item.data.date | readableDateMonths}}:</i>
    <a href="{{ item.url | url}}">{{ item.data.title }}</a>
</li>
{% endfor %}
</ul>

## Contact and links

<!--Office 03.125, Faculty of Mathematics, Oskar-Morgenstern-Platz 1, Vienna.<br>-->
📧 <a href="mailto:plunder.steffen.2a@kyoto-u.ac.jp">plunder.steffen.2a@kyoto-u.ac.jp</a>

🔗 [GitHub/SteffenPL](https://github.com/SteffenPL) | [Google Scholar](https://scholar.google.com/citations?user=-QyslKMAAAAJ&hl=en)  | [ORCID](https://orcid.org/0000-0002-3371-3790) | [researchmap.jp](https://researchmap.jp/steffen-plunder) | [ResearchGate](https://www.researchgate.net/profile/Steffen-Plunder) | [LinkedIn](https://at.linkedin.com/in/steffen-plunder) | [Twitter/X](https://twitter.com/SteffenPlunder)



## Preprints

13. [R. Tsutsumi](https://ashbi.kyoto-u.ac.jp/member/rio-tsutsumi/){target="_blank"}, [A. Diez](https://antoinediez.gitlab.io/){target="_blank"}, S. Plunder, R. Kimura, S. Oki, K. Takizawa, H. Akiyama, [Y. Mii](https://sites.google.com/view/yusukemii/home){target="_blank"}, R. Takada, [S. Takada](https://www.nibb.ac.jp/cib2/english.html){target="_blank"}, [Mototsugu Eiraku](https://www2.infront.kyoto-u.ac.jp/bs01/){target-"_blank"},
_Self-organized fingering instabilities drive the emergence of tissue morphogenesis in digit organoids._ **(2025)** [bioRxiv](https://doi.org/10.1101/2025.08.31.673315).
{reversed=reversed}

12. [T. Ichikawa](https://ashbi.kyoto-u.ac.jp/member/takafumi-ichikawa/){target="_blank"}, [P. C. Guruciaga](https://sites.google.com/view/pamelaguruciaga/home){target="_blank"}, S. Hu, S. Plunder, M. Makino, M. Hamaji, A. Stokkermans, S. Yoshida, [A. Erzberger](https://www.embl.org/people/person/anna-erzberger/){target="_blank"}, [T. Hiiragi](https://ashbi.kyoto-u.ac.jp/research-group/hiiragi-group/){target="_blank"}, _Boundary-guided cell alignment drives mouse epiblast maturation._ **(2025)** [bioRxiv](https://doi.org/10.1101/2025.04.28.650859).
{reversed=reversed}

11. [M. Mira Osuna](https://sbcf.fr/en/member/marta-mira-osuna/){target="_blank"}, S. Plunder, [E. Theveneau](https://cbi-toulouse.fr/eng/equipe-theveneau){target="_blank"}, [Roland Le Borgne](https://igdr.univ-rennes.fr/en/roland-le-borgne){target="_blank"}, _The directionality of collective cell delamination is governed by tissue architecture and cell adhesion in a Drosophila carcinoma model._ **(2024)** [bioRxiv](https://www.biorxiv.org/content/10.1101/2024.10.08.617152v1).
{reversed=reversed}

9. [P. C. Guruciaga](https://sites.google.com/view/pamelaguruciaga/home){target="_blank"}, [T. Ichikawa](https://ashbi.kyoto-u.ac.jp/member/takafumi-ichikawa/){target="_blank"}, S. Plunder, [T. Hiiragi](https://ashbi.kyoto-u.ac.jp/research-group/hiiragi-group/){target="_blank"}, [A. Erzberger](https://www.embl.org/people/person/anna-erzberger/), _Boundary geometry controls a topological defect transition that determines lumen nucleation in embryonic development_ **(2024)**
[arxiv](https://arxiv.org/abs/2403.08710).
{reversed=reversed}

8. S. Plunder, [S. Merino-Aceituno](https://sites.google.com/view/saramerinoaceituno){target="_blank"}, _Convergence proof for first-order position-based dynamics: An efficient scheme for inequality constrained ODEs._ **(2023)** [arxiv](https://arxiv.org/abs/2310.01215){target="_blank"}.
{reversed=reversed}

## Publications (peer-reviewed)

1. [S. Merino-Aceituno](https://sites.google.com/view/saramerinoaceituno){target="_blank"}, S. Plunder, C. Wytrzens, [H. Yoldaş](https://sites.google.com/view/havvayoldas/home){target="_blank"}, _Macroscopic effects of an anisotropic Gaussian-type repulsive potential: nematic alignment and spatial effects._ **Mathematical Models and Methods in Applied Sciences** **(2025)** [DOI:10.1142/S0218202525500356](https://doi.org/10.1142/S0218202525500356){target="_blank"}, [arxiv](http://arxiv.org/abs/2410.06740){target="_blank"}.
{reversed=reversed}

2. H. Jäger, [É. Grosjean](https://grosjean1.github.io/){target="_blank"}, S. Plunder, C. Redenbach, A. Keilmann, [B. Simeon](https://www.mathematik.uni-kl.de/en/das/people/head/simeon){target="_blank"}, C. Surulescu, _Cell seeding dynamics in a porous scaffold material designed for meniscus tissue regeneration._ **Proceedings in Applied Mathematics & Mechanics** **(2024)** [DOI: 10.1002/pamm.202400133](http://doi.org/10.1002/pamm.202400133){target="_blank"}.
{reversed=reversed}

2. E. Despin-Guitard, V. S. Rosa, S. Plunder, N. Mathiah, K. Van Schoor, E. Nehme, S. Merino-Aceituno, J. Egea, M. N. Shahbazi, [E. Theveneau](https://cbi-toulouse.fr/eng/equipe-theveneau){target="_blank"} & [I. Migeotte](https://iribhm.org/isabelle-migeotte/){target="_blank"}, _Non-apical mitoses contribute to cell delamination during mouse gastrulation._ **Nature Communications** **(2024)** [DOI:10.1038/s41467-024-51638-6](https://doi.org/10.1038/s41467-024-51638-6){target="_blank"}.
{reversed=reversed}

2. S. Plunder, C. Danesin, B. Glise, [M. A. Ferreira](https://marinaaferreira.com/){target="_blank"}, [S. Merino-Aceituno](https://sites.google.com/view/saramerinoaceituno){target="_blank"}, [E. Theveneau](https://cbi-toulouse.fr/eng/equipe-theveneau){target="_blank"}, _Modelling variability and heterogeneity of EMT scenarios highlights nuclear positioning and protrusions as main drivers of extrusion._ **Nature Communications** **(2024)** [DOI:10.1038/s41467-024-51372-z](https://doi.org/10.1038/s41467-024-51372-z){target="_blank"}.
{reversed=reversed}

2. S. Plunder, M. Burkard, T, Helling, U. M. Lauer, L. E. Hoelzle, [L. Marongiu](https://nutritionalbiochemistry.uni-hohenheim.de/en/luigi-marongiu-en){target="_blank"}, _Determination of optimal phage load and administration time for antibacterial treatment._ **Current Protocols** **(2024)** [DOI:10.1002/cpz1.954](https://doi.org/10.1002/cpz1.954){target="_blank"}.{reversed=reversed}

2. S. Plunder, [B. Simeon](https://www.mathematik.uni-kl.de/en/das/people/head/simeon){target="_blank"}, _The mean-field limit for particle systems with uniform full-rank constraints._ **Kinetic and Related Models** **(2023)** [DOI:10.3934/krm.2023012](https://www.aimsciences.org/article/doi/10.3934/krm.2023012){target="_blank"}, [arxiv](https://arxiv.org/abs/2203.07249){target="_blank"}.
{reversed=reversed}

2. S. Plunder, M. Burkard, U. Lauer, S. Venturelli, [L. Marongiu](https://nutritionalbiochemistry.uni-hohenheim.de/en/luigi-marongiu-en){target="_blank"}, _Determination of phage load and administration time in simulated occurrences of antibacterial treatments._ **Frontiers of Medicine** **(2022)** [DOI: 10.3389/fmed.2022.1040457](https://doi.org/10.3389/fmed.2022.1040457){target="_blank"}.
{reversed=reversed}

2. S. Plunder, [B. Simeon](https://www.mathematik.uni-kl.de/en/das/people/head/simeon){target="_blank"}, _Coupled Systems of Linear Differential-Algebraic and Kinetic Equations with Application to the Mathematical Modelling of Muscle Tissue._
In: Reis, T., Grundel, S., Schöps, S. (eds) **Progress in Differential-Algebraic Equations II. Differential-Algebraic Equations Forum. Springer** **(2020)** [DOI: 10.1007/978-3-030-53905-4_12](https://doi.org/10.1007/978-3-030-53905-4_12){target="_blank"}, [arxiv](https://arxiv.org/abs/1911.05468){target="_blank"}.
{reversed=reversed}

## Software packages

*I am currently making various tools for **agent-based modelling** available as Julia packages.*

- [SpatialHashTables.jl](https://github.com/SteffenPL/SpatialHashTables.jl){target="_blank"}: A Julia package for spatial hashing of particles (in 2D and 3D). This allows fast collision detection even is unbounded domains.
- [BoundedDegreeGraphs.jl](https://github.com/SteffenPL/BoundedDegreeGraphs.jl){target="_blank"}: A Julia package for graphs with bounded degree, with focus on allocation free operations commonly 
used in agent-based modelling. 

[^1]: EMT stands for epithelial-to-mesenchymal transitions, a process responsible for good things like neural crest formation and wound healing, but also bad thinks like cancer and fibrosis.
