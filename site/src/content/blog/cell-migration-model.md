---
title: "Cell migration model for plithotaxis"
date: "2021-06-01"
slug: "cell-migration-model"
---

<script>
import CellMigrationSim from '$lib/components/sims/CellMigrationSim.svelte';
</script>

# Cell migration model for plithotaxis

*This project is a collaboration with [Eric Theveneau](https://cbi-toulouse.fr/eng/equipe-theveneau), [Marina A. Ferreria](https://marinaaferreira.wordpress.com/), [Diane Peurichard](https://sites.google.com/site/dianepeurichard/home), [Pierre Degond](https://sites.google.com/site/degond/Home) and [Sara Merino-Aceituno](https://sites.google.com/view/saramerinoaceituno).*

The cell migration of mesenchymal cells after they leave the epithelium is very specific and it is not clear
which cell migration model is most appropriate. While there are many possible theoretical models and rules for cell migration, the experimental data do not clearly indicate which of these rules are the correct ones.

At the moment we are building a model which includes effects such as plithotaxis, contact inhibition of locomotion
and chemotaxis.


**The following simulation is absolutely preliminary. It is a simplified** version which I prepared for a public science event ("Lange Nacht der Forschung" in Vienna, 2022). The goal of the event was to explore under which conditions cells organise themself.

Some experiments one can perform with the simulation:
- Do cells still migrate collectively in the absence of cell-cell repulsion?
- How important is confinement?
- You can interactively move cells with the mouse. Can you change the direction of migration that way?

<CellMigrationSim />

## Description of the simulation

The green spheres represent the cells, and the transparent spheres around them indicate the
repulsive domain. In addition, cells can form temporary adhesive bonds which are displayed as orange lines.

Each cell is driven by forces. The red line displays the forces which are acting on the cell.
The black line shows the polarity, cells will always try to run in direction of their polarity.

Parameters:
- **Plithotaxis:** Cells react to the forces by changing their polarity. If the polarity and the forces are not aligned, then the cells will sooner pick a new polarity which tends to be more aligned with the forces.
- **Confinement:** Controls the upper and lower walls, hence the available space.
- **Cell-cell repulsion:** Strength of repulsion between cells.
- **Adhesion strength:** Determines how strongly the adhesive bond pulls the cells together.
- **Heterogeneity:** Determines how much the size of cells varies. [^het]
- **Chemotaxis:** Adds an attractive chemical to the right side of the domain; cells will try to turn towards the chemoattractant.

[^het]: Of course, this is only one out of many ways in which cells can vary!

## Features of the model

Even this simplified model can reproduce certain realistic aspects, such as:
- Collective cell migration of a cluster occurs only under specific conditions, e.g. if the following conditions are satisfied:
    - confinement ('limited space forces the cells to collaborate')
    - cell-cell adhesion ('cells stick together')
    - cell-cell repulsion ('cells push each other')
    - cell polarity changes according to the forces the cell experiences
- Cells do not perfectly align during migration, it is rather a messy and chaotic situation (typical for real biology).
- Cells can turn around if they run out of space in one direction.

An example of this behaviour can be seen in the image below:

![Cell migration simulation](/images/blog/CM/cm_01-3.png)

## Numerical method

As in my previous project, we used again [position-based dynamics](/blog/position-based-dynamics).


[^1]: Our main model are neural crest cells which undergo EMT in the early stages of the development of chicken embryo.
