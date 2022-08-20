---
title: 🎨 MyPaintEdSlides
id: 2
date: 2022-06-14
layout: markdown
---

# {{ title }}

_Till today I couldn't find any satisfying tool to create
handdrawn slides. So I made one myself!_

If you want to try it, check out the repository [github.com/SteffenPL/MyPaintEdSlides](https://github.com/SteffenPL/MyPaintEdSlides).

It allows you to create slides like this. <br>(Use the ⬇️ for the next content and ⬅️, ➡️ to navigate slides.)

<div class="container mx-auto bg-lime-200 aspect-video">
<iframe class="h-full w-full" width="16" height="9" src="
https://steffenpl.github.io/MyPaintEdSlidesExamples/talks/2018/student_talk/index.html#/2/11">
</iframe>
</div>

These kind of slides totally change how content is presented, images and formulas are at the front page 
and only your drawing skills are the limit (instead of LaTeX).

<div class="container mx-auto bg-lime-200 aspect-video">
<iframe class="h-full w-full" width="16" height="9" src="https://steffenpl.github.io/MyPaintEdSlidesExamples/talks/2018/master_thesis/index.html#/3/1">
</iframe>
</div>

More examples are on [Vishnupriya Anupindi's homepage](https://vishnupriya-anupindi.github.io/research/#talks-and-slides) and [here]({{ '/activities#talks-and-slides' | url }}). 

## How does it work? 

As the name indicates, my simple python script mainly builds upon the free, open-source program
[MyPaint](http://mypaint.org/) or alternatively [Krita](https://krita.org/en/).

Each slide of the presentation is just on `.ora` (Open Raster Format) file created with one of these programs.
The main feature is, that the image layers and layer groups represent the elements which apear one-by-one when going through the slides!
In this way one can change each layer separate, even afterwards, which is essential especially for complicated slides.


Given a folder of `.ora` files, the MyPaintEdSlides python script 
generates images for each step of the presentation and bundles these images as a [reveal.js](https://revealjs.com/) presentation.

If you want to use it, check out the [MyPaintEdSlides readme](https://github.com/SteffenPL/MyPaintEdSlides#readme) or write me if you need further help! 

