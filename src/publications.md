---
title: Publications
layout: markdown 
---

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

## Thesis documents

<div class="md:grid md:grid-cols-2 gap-4 md:flex-none flex flex-col-reverse md:max-w-none max-w-xs mx-auto">

<div onclick="location.href='/assets/thesis/plunder_phd_thesis.pdf'" class="cursor-pointer drop-shadow-xl">
<img src="{{ 'imgs/phd_thesis_preview.png' | url }}">
<a href="{{ '/assets/thesis/plunder_phd_thesis.pdf'| url }}">PhD thesis on Mathematical modelling and simulation of
epithelial-to-mesenchymal transitions leading to cell migration</a> (supervisor Prof. Sara Merino-Aceituno). 
</div>

<div onclick="location.href='/assets/thesis/plunder_masters_thesis.pdf'" class="cursor-pointer drop-shadow-xl">
<img src="{{ 'imgs/master_thesis_preview.png' | url }}">
<a href="{{ '/assets/thesis/plunder_masters_thesis.pdf'| url }}">Master's thesis on modelling and simulation of skeletal muscle tissue</a> (supervisor Prof. Bernd Simeon). 
</div>

<div onclick="location.href='/assets/thesis/plunder_bachelor_thesis.pdf'" class="cursor-pointer drop-shadow-xl">
<img src="{{ 'imgs/bachelor_thesis_preview.png' | url }}">
<a href="{{ '/assets/thesis/plunder_bachelor_thesis.pdf'| url }}">Bachelor's thesis on molecular dynamics</a> (supervisor Dr. Wolfgang Bock).
</div>


</div>
