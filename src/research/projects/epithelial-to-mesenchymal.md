---
title: Mechanical modelling of epithelial-to-mesenchymal transitions
start: 2019-10-01
layout: markdown
desc: Modelling of different EMT scenarios to study their effect on metastasis. (Read more...)
order: 1
img: ./imgs/EMT/cells.png
---

_Short project description:_
# {{ title }}

_This project is a collaboration with Eric Theveneau, Marina A. Ferreria, Diane Peurichard, Pierre Degond and Sara Merino-Aceituno._

The epithelial-to-mesenchymal transition (EMT) is a process during which epithelial cells[^1]
transition into mesenchymal cells. During this transition fundamental cell properties change.
For example, epithelial cells typical have adhesive bonds within each other. But as mesenchymal cells 
they might loss these adhesive bonds and become suddenly mobile. 

<p><a href="https://commons.wikimedia.org/wiki/File:Epithelial-Mesenchymal_Transition.gif#/media/File:Epithelial-Mesenchymal_Transition.gif"><img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Epithelial-Mesenchymal_Transition.gif" alt="Epithelial-Mesenchymal Transition.gif"></a><br>
<span class="float-right">Image source: <a href="https://commons.wikimedia.org/w/index.php?curid=25952399">wikipedia.org</a></span></p>

## Project aims

The overall aim of our mathematically modelling is to understand 
the mechanical factors involved in epithelial-to-mesenchymal transtion and the
resulting cell migration of these cells.
As there are many different aspects which could explain the _in vivo_ findings, 
such an insight would help in the design of experiments, as unrelated factors 
might be sorted out by the model already.

Concretely, we want to come up with biological hypotheses which can be tested _in vivo_. 

A second goal is to use the computer model also to study scenarios which are 
difficult or almost impossible with current experimental tools. For example,
we can easily control the mixture of different cell types to model _heterogeneity_. 
While it is observed that cell during EMT are very heterogeneous, it is not clear
right now if this has an actualy mechanical advantage or if the heterogeneity emerges for other reasons.



## The model


<img class="max-w-xs md:float-right mx-auto md:mx-0" src="./imgs/EMT/model_simple.png"></img>

Without going into too much details, our model is a continuation of [Marina's model](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1007171) where we added extra rules to model EMT.

The core of the model is a "tenisball in a sock" description of the cells: Since the cell membrane is streched out (like a sock) 
and the nucleus is the hardest part of the cell (like the tenisball) we consider the nucleus as a _sphere-like object_ and the membrane and the other cell structure as _linear springs_.

Without further ado. This is how a simulation _without_ EMT looks like:


## Mathematical aspects

The main mathematical change was to use a first-order differential equation instead of a quasi-steady state simulation. This transition allows to use different numerical methods. And it turned out 
that [position-based dynamics]({{ '/research/projects/position-based-dynamics' | url }}) was with quite some margin the fastest method for our model.

The model is (roughly) of the form
$$
\dot z = f(z,t) + \sum_{k} \lambda_k \nabla_z g_k(z, t)
$$
with the conditions
$$
g_k(z) \geq 0, \quad \lambda_k \geq 0 \quad \text{and} \quad g_k(z) \lambda_k = 0.
$$

The degrees of freedom are the positions of the nuclei and the upper- and lower-endpoints of the cell membrane (which we call apical- and basal-points).

In addition to the differential equation, there are many additional rules which change certain properties of the model at discrete times. For example:
- Cell division,
- Growth of the cell prior division,
- Typical of pseudo-stratified tissue: The cytoskeleton pulls the nucleus towards the apical layer, just before the division starts.

### The EMT model

To model EMT we added the following events
- **A: Loss of apical adhesion** (removal of apical-nuclei spring),
- **B: Loss of basal adhesion** (removal of basal-nuclei spring),
- **S: Degeneration of cell straigthness** (reduction of the bending spring),
- **p: Protrusions** (cells start moving in direction of their polarity).

In an easy world cells would perform $A \to B \to S \to p$ in a regular manner. But in reality it is sometimes a complete mess.
Cells might only do some of these steps, or have completely different timings.

### Studying the role of heterogeneity



[^1]: For non-biologists: An example for epithelial tissue is your skin.




