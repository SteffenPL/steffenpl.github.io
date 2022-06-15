---
title: Blog
layout: markdown
---

# Blog
  
This blog contains curiosities from mathematics, programming and science!

{% for item in collections.blog %}
- **#{{ item.data.id }}** [{{ item.data.title }}]({{ item.url | url}}) 
{% endfor %}


<br>

---

<br>

<div>
<img src="math_joke.png"></img>
</div>