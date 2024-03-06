import { gsap } from '/external/gsap/all.js';
import * as THREE from 'three';
import { CSS2DRenderer } from '/external/three/CSS2DRenderer.js';
import { capture_and_control_ui } from '/lib/control_ui.js';
import { Rect } from '/lib/boxpusher.js';
import * as nd from '/lib/nd.js';
import { v3, add, sub, scale } from '/lib/vectors.js';
import * as colors from '/lib/colors.js';

// debug
window.THREE = THREE;
window.gsap = gsap;
window.nd = nd;

// Corresponds to background SVG dims.
const WinH = 1000.0;
const WinW = 918.33;

// Scenegraph
const scene = new THREE.Scene();
scene.background = null; // transparent background

// WebGL Render
const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
renderer.setSize(WinW, WinH);
document.getElementById("canvas").appendChild( renderer.domElement );

// CSS Element Render
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(WinW, WinH);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.getElementById("canvas").appendChild( labelRenderer.domElement );

// Cameras
// Match the pixel coordinate system used in the background SVG.
const camera = new THREE.OrthographicCamera(
  /*left*/   0,
  /*right*/  WinW,
  /*top*/    0,
  /*bottom*/ WinH,
  /*near*/   0.0,
  /*far*/    1.0);
camera.position.z = 1.0;


// Animation Constants


// Number of "packets" is N * N
const N = 4;

// spacing
const spacing = 10.0;
const box_size = v3(0.95*spacing, 0.95*spacing, 0);

// unit vectors
const dx = v3(spacing, 0, 0);
const dy = v3(0, spacing, 0);
const dz = v3(0, 0, spacing);;

// offsets to push 0 and 1 halves apart visually
const neg_half_dx = scale(-0.5, dx);
const ahead_dx = scale(N + 0.5, dx);

// HBM coordinates
const x_hbm = v3(70, 610, 0);
const y_hbm = add(x_hbm, v3(130, 0, 0));
const z_hbm = add(y_hbm, v3(130, 0, 0));
const [x0_hbm, y0_hbm, z0_hbm] = [x_hbm, y_hbm, z_hbm].map(x => add(x, neg_half_dx));
const [x1_hbm, y1_hbm, z1_hbm] = [x_hbm, y_hbm, z_hbm].map(x => add(x, ahead_dx));

// VMEM coordinates
const x_vmem = v3(275, 360, 0);
const y_vmem = add(x_vmem, v3(115, 0, 0));
const z_vmem = add(y_vmem, v3(115, 0, 0));
const [x0_vmem, y0_vmem, z0_vmem] = [x_vmem, y_vmem, z_vmem].map(x => add(x, neg_half_dx));
const [x1_vmem, y1_vmem, z1_vmem] = [x_vmem, y_vmem, z_vmem].map(x => add(x, ahead_dx));

// VREG coordinates
const x_vreg = v3(350, 240, 0);
const y_vreg = add(x_vreg, v3(50, 0, 0));
const z_vreg = add(y_vreg, v3(50, 0, 0));

// Vector Core coordinates
const vector_core = v3(410.0, 110.0, 0.0);


// Helper layout and animation functions


// grid positions
function make_grid(origin, size, spacing) {
  return nd.empty([size, size])
    .indexMap( ([i, j]) => v3(i, j, 0) )
    .map( x => x.multiplyScalar(spacing).add(origin) )
    .toArray();
}
window.v3=v3;

// grid of "packet" boxes
function make_boxes(grid, color, opacity=1.0) {
  return nd.map(val => new Rect(val, box_size, color, opacity, scene), grid);
}

// shove packets along a path like:
//                  end
//                   |
//      x1----------x2
//      |
//    start
//
function push_packets(boxes, start, end, t0, tick, tick_skew=null, minimal_delay=false) {
  tick_skew = tick_skew !== null ? tick_skew : tick;
  let t = t0;
  const path_fn = (x_start, x_end, box) => {
    let delta = sub(x_end, x_start);
    let x1 = add(x_start, v3(0,       delta.y/2.0, 0));
    let x2 = add(x_start, v3(delta.x, delta.y/2.0, 0));
    box.toPosition(x1, t + tick, tick);
    box.toPosition(x2, t + tick * 2, tick);
    box.toPosition(x_end, t + tick * 3, tick);
    t += tick_skew;
  }
  nd.map(path_fn, start, end, boxes);
  if (minimal_delay) {
    return t;  // return minimal offset time for chaining animations
  } else {
    return t - tick_skew + 3 * tick;  // return time for all animations to finish
  }
}

// Make grids at each position.
const [
    x0_hbms, y0_hbms, z0_hbms, x1_hbms, y1_hbms, z1_hbms,
    x0_vmems, y0_vmems, z0_vmems, x1_vmems, y1_vmems, z1_vmems,
    x_vregs, y_vregs, z_vregs, vector_cores
  ] = [
    x0_hbm, y0_hbm, z0_hbm, x1_hbm, y1_hbm, z1_hbm,
    x0_vmem, y0_vmem, z0_vmem, x1_vmem, y1_vmem, z1_vmem,
    x_vreg, y_vreg, z_vreg, vector_core
  ].map(origin => make_grid(origin, N, spacing));

// Make boxes for animation.
let X0s = make_boxes(x0_hbms, colors.red);
let X1s = make_boxes(x1_hbms, colors.red);
let Y0s = make_boxes(y0_hbms, colors.green);
let Y1s = make_boxes(y1_hbms, colors.green);
let Z0s = make_boxes(vector_cores, colors.blue, 0.0);
let Z1s = make_boxes(vector_cores, colors.blue, 0.0);

// reshape into indexed blockwise tiles to animate chunks separately
const to_chunks = x => nd.transpose(nd.reshape(x, [2,2,2,2]), [0,2,1,3]);
const from_chunks = x => nd.reshape(nd.transpose(x, [0,2,1,3]), [4,4]);

// grab an element from the background SVG
let svg_timeline = gsap.timeline();
let svgroot = document.getElementById('background').contentDocument;
const created_buffers_in_svg = Array.from(svgroot.querySelectorAll('.st5,.st6'));


// Main Animation


// rate constants
let vmem_tick = 0.1;
let hbm_tick = 3 * vmem_tick;

// START

let t0 = 1.0;

// fade in the "z" buffers at beginning of animation
created_buffers_in_svg.forEach(element => {
  element.style.opacity=0.0;
  svg_timeline.to(element, {css:{opacity: 1.0}, duration: 1.0}, t0);
});

// move X0, Y0 from HBM to VMEM
push_packets(X0s, x0_hbms, x0_vmems, t0, hbm_tick, null, true);
let t_0s_ready = push_packets(Y0s, y0_hbms, y0_vmems, t0 + N * hbm_tick, hbm_tick, null, true);
// THEN move X1, Y1 from HBM to VMEM
push_packets(X1s, x1_hbms, x1_vmems, t_0s_ready, hbm_tick, null, true);
push_packets(Y1s, y1_hbms, y1_vmems, t_0s_ready + N * hbm_tick, hbm_tick, null, true);

// pipeline of X0, Y0 chunks from vmem->vregs->vector core->vregs->vmem
let t_next = t_0s_ready + 3 * hbm_tick;
[[1,1], [0,1], [1,0], [0,0]].forEach(
  ([i, j]) => {
    // X0, Y0 to vector unit
    t_next = push_packets(to_chunks(X0s)[i][j], to_chunks(x0_vmems)[i][j], to_chunks(x_vregs)[i][j],      t_next, vmem_tick, 0);
    t_next = push_packets(to_chunks(Y0s)[i][j], to_chunks(y0_vmems)[i][j], to_chunks(y_vregs)[i][j],      t_next, vmem_tick, 0);
             push_packets(to_chunks(X0s)[i][j], to_chunks(x_vregs)[i][j],  to_chunks(vector_cores)[i][j], t_next, vmem_tick, 0);
    t_next = push_packets(to_chunks(Y0s)[i][j], to_chunks(y_vregs)[i][j],  to_chunks(vector_cores)[i][j], t_next, vmem_tick, 0);
    // hide X0, Y0, reveal Z0
    nd.map((b) => b.toOpacity(0.0, t_next, vmem_tick*0.1), to_chunks(X0s)[i][j]);
    nd.map((b) => b.toOpacity(0.0, t_next, vmem_tick*0.1), to_chunks(Y0s)[i][j]);
    nd.map((b) => b.toOpacity(1.0, t_next, vmem_tick*0.1), to_chunks(Z0s)[i][j]);
    t_next += 2 * vmem_tick;
    // Z0 from vector unit
    t_next = push_packets(to_chunks(Z0s)[i][j], to_chunks(vector_cores)[i][j], to_chunks(z_vregs)[i][j],  t_next, vmem_tick, 0);
    t_next = push_packets(to_chunks(Z0s)[i][j], to_chunks(z_vregs)[i][j],      to_chunks(z0_vmems)[i][j], t_next, vmem_tick, 0);
});

// move finished Z 0-half back to HBM
push_packets(Z0s, z0_vmems, z0_hbms, t_next, hbm_tick);

// pipeline of X1, Y1 chunks from vmem->vregs->vector core->vregs->vmem
[[0,0], [1,1], [1,0], [0,1]].forEach(
  ([i, j]) => {
    // X1, Y1 to vector unit
    t_next = push_packets(to_chunks(X1s)[i][j], to_chunks(x1_vmems)[i][j], to_chunks(x_vregs)[i][j],      t_next, vmem_tick, 0);
    t_next = push_packets(to_chunks(Y1s)[i][j], to_chunks(y1_vmems)[i][j], to_chunks(y_vregs)[i][j],      t_next, vmem_tick, 0);
             push_packets(to_chunks(X1s)[i][j], to_chunks(x_vregs)[i][j],  to_chunks(vector_cores)[i][j], t_next, vmem_tick, 0);
    t_next = push_packets(to_chunks(Y1s)[i][j], to_chunks(y_vregs)[i][j],  to_chunks(vector_cores)[i][j], t_next, vmem_tick, 0);
    // hide X1, Y1, reveal Z1
    nd.map((b) => b.toOpacity(0.0, t_next, vmem_tick*0.1), to_chunks(X1s)[i][j]);
    nd.map((b) => b.toOpacity(0.0, t_next, vmem_tick*0.1), to_chunks(Y1s)[i][j]);
    nd.map((b) => b.toOpacity(1.0, t_next, vmem_tick*0.1), to_chunks(Z1s)[i][j]);
    t_next += 2*vmem_tick;
    // Z1 from vector unit
    t_next = push_packets(to_chunks(Z1s)[i][j], to_chunks(vector_cores)[i][j], to_chunks(z_vregs)[i][j],  t_next, vmem_tick, 0);
    t_next = push_packets(to_chunks(Z1s)[i][j], to_chunks(z_vregs)[i][j],      to_chunks(z1_vmems)[i][j], t_next, vmem_tick, 0);
});

// move finished Z 1-half back to HBM
push_packets(Z1s, z1_vmems, z1_hbms, t_next, hbm_tick);

// END

// get duration of root gsap timeline (total length of scheduled animations)
let finalTime = gsap.globalTimeline.endTime();
console.log(`Animation lasts ${finalTime} seconds.`);


// Animation Loop

function animation(time) {
    renderer.render( scene, camera );
    labelRenderer.render( scene, camera );
}
renderer.setAnimationLoop(animation);


// Capture and Control UI

capture_and_control_ui(
  "controls",               // control div id
  finalTime,                // animation time in seconds
  "pallas_pipelining.webm", // save filename
  "video/webm"              // save format
);
