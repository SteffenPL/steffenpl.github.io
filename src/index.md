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

- _November 2025:_ New iScience publication.
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

{% for pub in publications.preprints %}
{{ pub.id }}. {% for author in pub.authors %}{% if author.url %}[{{ author.name }}]({{ author.url }}){target="_blank"}{% else %}{{ author.name }}{% endif %}{% if not loop.last %}, {% endif %}{% endfor %}, _{{ pub.title }}_ **{{ pub.year }}**{% for link in pub.links %} [{{ link.name }}]({{ link.url }}){target="_blank"}{% if not loop.last %}, {% endif %}{% endfor %}
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
