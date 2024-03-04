### Troubles

Turns out that by default transparent materials don't really work correctly in three.js?!
One sees flickering, unstable transparency, esp w. camera angle changes.

It's a known issue.  I thought this was what z-buffers were for, lol.
https://github.com/mrdoob/three.js/pull/24271

Damn it, am I really going to have to write a pile of shaders w. webGPU to get simple 
flat transparent material handled right?
