---
layout: markdown
title: "Retreat 2026 - Limb Development Simulations"
---

# Simulations of Digit Organoids

## Overview

Below are three cases showing the different requirements for digit growth:
1. Clustering: distal cell-cell adhesion is strongest, leading to engulfment
2. FGF-driven chemotaxis: by combining preferential cell-cell adhesion with FGF-driven migration, we get clusters on the boundary
3. WNT-driven convergent-extension: proximal-distal interface creates a WNT-gradient, which facilitates convergent extension

---

<div class="space-y-12 my-8">

<div>

## Step 1: Differential adhesion

Unsurprisingly, the distal cells with strongest adhesion cluster in the center.

<div class="my-4">
  <video autoplay loop muted playsinline class="w-full rounded">
    <source src="/assets/limb/movie_case1_alpha1_eta1_fgf.mp4" type="video/mp4">
  </video>
</div>

</div>

<div>

## Step 2: Differential adhesion + FGF-driven chemotaxis

Chemotaxis explains the location of digits, but differential adhesion alone is not sufficient to drive elongation.

<div class="my-4">
  <video autoplay loop muted playsinline class="w-full rounded">
    <source src="/assets/limb/movie_case2_alpha1_eta3_fgf.mp4" type="video/mp4">
  </video>
</div>

</div>

<div>

## Step 3: WNT-driven convergent-extension

Distal cells secrete WNT, which creates a gradient that facilitates elongation.

<div class="my-4">
  <video autoplay loop muted playsinline class="w-full rounded">
    <source src="/assets/limb/movie_case3_alpha1_eta3_fgf+wnt.mp4" type="video/mp4">
  </video>
</div>

</div>

</div>

## Variations

Variations of number of cells and cell type ratio match with organoid experiments, showing that the model captures several cases of the organoid.

<div class="space-y-4 my-4">
  <img src="/sizes.png" alt="Variations in cell numbers" class="w-full rounded">
  <img src="/ratio.png" alt="Variations in cell type ratio" class="w-full rounded">
</div>

---

## Conclusions

The combination of these three mechanisms explains the digit organoid behavior, showing a pathway of digit formation which is not chemical dominated, but instead based on a hybrid mechano-chemical model. 