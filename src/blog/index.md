---
title: Blog
layout: markdown
---

# Blog
  
  This blog contains curious things from mathematics, programming and science!

  {% for item in collections.blog %}
  - [{{ item.data.title }}]({{ item.url }}) 
  {% endfor %}