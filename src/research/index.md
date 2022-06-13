---
title: Research
layout: markdown
---

# Projects
  
  {% for item in collections.projects %}
  - [{{ item.data.title }}]({{ item.url }}) 
  _{{ item.data.date | readableDate}}_
  **Goal:** {{ item.data.desc }}
  {% endfor %}