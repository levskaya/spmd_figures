# Math animations

Attempts to illustrate fiddly concepts in distributed numerical computing.

This set of animations use three.js for the scenegraph as it nicely supports combined WebGL, CSS, and SVG renderers on the same scenegraph.  It avoids three's rather 
tool-export-oriented animation system in favor of gsap for handwriting animation scripts.

## Usage

To view, run `python -m http.server 8000` from the repo root.

## Animations

 - matmul_anim - matmuls cost 2 * p * n * m animation
    - still messing with both CSS and WebGL text rendering
    - katex support in css text
 - allgather - 1D bidirectional all-gather
 - reducescatter - 1D bidirectional reduce-scatter
 - fast_serving - interleaved ring-buffer serving
 - pallas pipelining - pallas software pipelining animation
 - collective_ag_matmul - bad attempt at a collective matmul animation

## TODO

 - The animations are just simple global scripts used to capture video, they aren't scoped as components for inclusion in webpages.  We'd want to encapsulate them as react components or something similar for that.
 - Currently we use a single global gsap timeline, probably want to encapsulate that as well.
 - gsap's `timeline.call(fn, args, t)` doesn't reliably trigger on seeking.
 - make better palettes, e.g. more equal luminescent colors `#817 #a35 #c66 #e94 #ed0 #9d5 #4d8 #2cb #0bc #09c #36b #639`
