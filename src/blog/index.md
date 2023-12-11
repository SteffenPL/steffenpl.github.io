---
title: Blog
layout: markdown
---
<!-- 
# 🗾 Kyoto Blog 

I recently moved to Kyoto. Here are some notes from the first days since my arrival. 


{% for item in collections.kyoto_blog %}
- **#{{ item.data.id }}** [{{ item.data.title }}]({{ item.url | url}}) 
{% endfor %}


--->

# Math/Programming/Science Blog
  
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