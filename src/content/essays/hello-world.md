---
title: "Hello, world - all 2×10¹³ watts of it"
description: "What this blog is about, and how far a 0.73 civilisation has left to climb."
date: 2026-07-04
---

Every blog starts with a hello-world post.
This one also states its thesis: the most interesting number in the world is how much energy humanity can usefully command, and it is growing.

In 1964, [Nikolai Kardashev](https://en.wikipedia.org/wiki/Kardashev_scale) proposed ranking civilisations by exactly that number.
A Type 1 civilisation commands the full energy budget of its planet, around 10¹⁶ watts.
Humanity currently runs on roughly 2×10¹³ watts.

Carl Sagan's interpolation puts us on the scale:

```python
# K = (log10(P) - 6) / 10, with P in watts
>>> from math import log10
>>> (log10(2e13) - 6) / 10
0.7301029995663981
```

We are a 0.73 civilisation.

<figure>
<pre>
Type 0.73  ████████████████████░░░░░░░  2×10¹³ W   ← we are here
Type 1.0   ███████████████████████████  10¹⁶ W     planetary budget
</pre>
<figcaption>Fig. 1 - Humanity's energy throughput vs. the Type 1 threshold</figcaption>
</figure>

The remaining 0.27 is not a rounding error: it is a 500-fold increase in throughput.
This blog is about what moves those needles - the reactors, panels, and grids that grow the energy budget; the chips and models that grow what we can do with it; and any idea that makes the sci-fi future arrive early.
