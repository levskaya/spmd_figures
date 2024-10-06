# Math animations

Attempts to illustrate fiddly concepts in distributed numerical computing.

This set of animations use three.js for the scenegraph as it nicely supports combined WebGL, CSS, and SVG renderers on the same scenegraph.
It avoids three's authoring-tool export-oriented animation system in favor of gsap for handwriting animation scripts.

## Usage

To view, run `python -m http.server 8000` from the repo root.

## Animations

 - matmul - matmuls cost 2 * p * n * m animation
 - allgather - 1D bidirectional ring all-gather
 - reducescatter - 1D bidirectional ring reduce-scatter
 - alltoall - 1D bidirectional ring all-to-all
 - pallas pipelining - pallas software pipelining animation
 - fast_serving - interleaved ring-buffer serving
 - collective_ag_matmul - bad attempt at a collective matmul animation
 - boxes - trying to wrestle three.js into behaving in actual 3d renders...

## Movies

The scripts can use screen capture APIs to dump webm videos from chrome.  Quicktime can't read these, but one can use
ffmpeg to crop and convert them:

e.g. to gif
```
ffmpeg -i alltoall.webm -vf "crop=1700:600:950:480,scale=850:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=32[p];[s1][p]paletteuse=dither=bayer" -r 30 alltoall.gif
```
or to webm
```
ffmpeg -i alltoall.webm -vf "crop=1700:600:950:480,scale=850:-1:flags=lanczos" -r 30 alltoall2.webm
```

## TODO

 - The animations are just simple global scripts used to capture video, they aren't scoped as components for inclusion in webpages.
 - Currently we use a single global gsap timeline, probably want to encapsulate that as well.
 - gsap's `timeline.call(fn, args, t)` doesn't reliably trigger on seeking.
 - make better palettes, e.g. more equal luminescent colors `#817 #a35 #c66 #e94 #ed0 #9d5 #4d8 #2cb #0bc #09c #36b #639`
