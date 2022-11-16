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

