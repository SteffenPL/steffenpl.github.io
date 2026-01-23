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

<div class="flex flex-wrap justify-center gap-4 my-4">
  <video autoplay loop muted playsinline class="w-full sm:w-[30%] rounded">
    <source src="/assets/compressed/C.mp4" type="video/mp4">
  </video>
  <video autoplay loop muted playsinline class="w-full sm:w-[30%] rounded">
    <source src="/assets/compressed/bacteria.mp4" type="video/mp4">
  </video>
  <video autoplay loop muted playsinline class="w-full sm:w-[30%] rounded">
    <source src="/assets/compressed/cells.mp4" type="video/mp4">
  </video>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
<div>

## News and Blog

<ul class="list-none m-0 p-0 space-y-1">
{% for item in collections.blog %}
<li class="text-sm"><span class="text-gray-500">{{item.data.date | readableDateMonths}}</span> — <a href="{{ item.url | url}}">{{ item.data.title }}</a></li>
{% endfor %}
</ul>

</div>
<div>

## Contact and links

<div class="space-y-2">
  <p class="m-0"><i class="fa-solid fa-envelope"></i> <a href="mailto:plunder.steffen.2a@kyoto-u.ac.jp">plunder.steffen.2a@kyoto-u.ac.jp</a></p>
  <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
    <a href="https://github.com/SteffenPL" target="_blank"><i class="fa-brands fa-github"></i> GitHub</a>
    <a href="https://scholar.google.com/citations?user=-QyslKMAAAAJ&hl=en" target="_blank"><i class="ai ai-google-scholar"></i> Google Scholar</a>
    <a href="https://orcid.org/0000-0002-3371-3790" target="_blank"><i class="ai ai-orcid"></i> ORCID</a>
    <a href="https://researchmap.jp/steffen-plunder" target="_blank"><i class="fa-solid fa-map"></i> researchmap.jp</a>
    <a href="https://www.researchgate.net/profile/Steffen-Plunder" target="_blank"><i class="ai ai-researchgate"></i> ResearchGate</a>
    <a href="https://at.linkedin.com/in/steffen-plunder" target="_blank"><i class="fa-brands fa-linkedin"></i> LinkedIn</a>
  </div>
</div>

</div>
</div>



## Preprints

{% for pub in publications.preprints %}
{{ pub.id }}. {% for author in pub.authors %}{% if author.url %}[{{ author.name }}]({{ author.url }}){target="_blank"}{% else %}{{ author.name }}{% endif %}{% if not loop.last %}, {% endif %}{% endfor %}, _{{ pub.title }}_ {% if pub.journal %}{{ pub.journal }} {% endif %}**{{ pub.year }}**{% for link in pub.links %} [{{ link.name }}]({{ link.url }}){target="_blank"}{% if not loop.last %}, {% endif %}{% endfor %}
{reversed=reversed}
{% endfor %}

## Publications (peer-reviewed)

{% for pub in publications.peer_reviewed %}
{{ pub.id }}. {% for author in pub.authors %}{% if author.url %}[{{ author.name }}]({{ author.url }}){target="_blank"}{% else %}{{ author.name }}{% endif %}{% if not loop.last %}, {% endif %}{% endfor %}, _{{ pub.title }}_ {{ pub.journal }} {{ pub.year }} {% for link in pub.links %} [{{ link.name }}]({{ link.url }}){target="_blank"}{% if not loop.last %}, {% endif %}{% endfor %}
{reversed=reversed}
{% endfor %}

## Software packages

*I am currently making various tools for **agent-based modelling** available as Julia packages.*

- [SpatialHashTables.jl](https://github.com/SteffenPL/SpatialHashTables.jl){target="_blank"}: A Julia package for spatial hashing of particles (in 2D and 3D). This allows fast collision detection even is unbounded domains.
- [BoundedDegreeGraphs.jl](https://github.com/SteffenPL/BoundedDegreeGraphs.jl){target="_blank"}: A Julia package for graphs with bounded degree, with focus on allocation free operations commonly 
used in agent-based modelling. 

[^1]: EMT stands for epithelial-to-mesenchymal transitions, a process responsible for good things like neural crest formation and wound healing, but also bad thinks like cancer and fibrosis.
