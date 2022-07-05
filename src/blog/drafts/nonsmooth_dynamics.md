---
title: 💥 Non-smooth dynamics
id: 4
date: 2022-06-24
layout: markdown
---

# {{ title }}

Finding the right terms is sometimes the hardest part of working on new projects.
In my case finding the term _non-smooth dynamics__ took almost a year. But I'm glad I found it eventually.
Among other aspects, non-smooth dynamics is about the study of dynamics with non-smooth velocities.
There are many related terms, which I will mention later as well.

## First-things-first: non-smooth analysis

We are used to solving many problems with derivatives. But not all functions have smooth derivatives, but that doesn't mean we cannot use them!

The most prominent example might be the distance function to a closed set $A \subset \Reals^d$, i.e.
$$
d(x, A) = \sup_{a \in \Reals^d} \Vert x - a \Vert.
$$

If is clear that
$$
\partial_x d(x,A) = 0 \quad \text{for } x \in A \setminus \partial A
$$
and even outside we can do
$$
\partial_x d(x,A) = \argmin
$$
