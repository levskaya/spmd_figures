### Notes

- `three/addons` files used in threejs examples live in `examples/jsm` repo directory
- json-exported font paths live in repo direcotry `examples/fonts`

 ## animations

Ignore most directories for now, focus on these:

To view, run `python -m http.server 8000` from the repo root:

 - matmul_anim - matmuls cost 2 * p * n * m animation
    - still messing with both CSS and WebGL text rendering
    - katex support feels like overkill maybe?  easy to do though.
 - allgather_anim - 1D allgather animation
 - reducescatter_anim - 1D reduce scatter animation


### more equal luminescent colors
#817 #a35 #c66 #e94 #ed0 #9d5 #4d8 #2cb #0bc #09c #36b #639

```
"three": "https://unpkg.com/three/build/three.module.js",
"gsap": "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.3/gsap.min.js",
"katex": "https://cdn.jsdelivr.net/npm/katex@0.16.3/dist/katex.mjs",
"katexautorender": "https://cdn.jsdelivr.net/npm/katex@0.16.3/dist/contrib/auto-render.mjs",
"lodash": "https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"
```