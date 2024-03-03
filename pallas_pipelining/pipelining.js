import { gsap } from '/external/gsap/all.js';
import * as THREE from 'three';
import { CSS2DRenderer } from '/external/three/CSS2DRenderer.js';
import { capture_and_control_ui } from '/lib/control_ui.js';
import { Box, Text, Label } from '/lib/boxpusher.js';
import { map, empty} from '/lib/nd.js';
import { v3 } from '/lib/vectors.js';
import * as colors from '/lib/colors.js';

// debug
window.THREE = THREE;
window.gsap = gsap;

// Corresponds to background SVG dims.
const WinH = 1000.0;
const WinW = 918.33;

// Clock
let clock = new THREE.Clock();
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

// GSAP Settings
// by default, globalTimeline removes finished children animations, which
// prevents us from seeking across the timeline correctly.
gsap.globalTimeline.autoRemoveChildren = false;

// Cameras
// Orthographic
const camera = new THREE.OrthographicCamera(
  /*left*/   0,
  /*right*/  WinW,
  /*top*/    0,
  /*bottom*/ WinH,
  /*near*/   0.0,
  /*far*/    1.0);
camera.position.z = 1.0;

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
const neg_half_dx = dx.clone().multiplyScalar(-0.5);
const ahead_dx = dx.clone().multiplyScalar(N + 0.5)

// HBM coordinates
const x_hbm = v3(70.0, 610.0, 0.0);
const y_hbm = v3(200.0, 610.0, 0.0);
const z_hbm = v3(330.0, 610.0, 0.0);
const x0_hbm = x_hbm.clone().add(neg_half_dx);
const y0_hbm = y_hbm.clone().add(neg_half_dx);
const z0_hbm = z_hbm.clone().add(neg_half_dx);
const x1_hbm = x_hbm.clone().add(ahead_dx);
const y1_hbm = y_hbm.clone().add(ahead_dx);
const z1_hbm = z_hbm.clone().add(ahead_dx);

// VMEM coordinates
const x_vmem = v3(275.0, 360.0, 0.0);
const y_vmem = v3(390.0, 360.0, 0.0);
const z_vmem = v3(505.0, 360.0, 0.0);
const x0_vmem = x_vmem.clone().add(neg_half_dx);
const y0_vmem = y_vmem.clone().add(neg_half_dx);
const z0_vmem = z_vmem.clone().add(neg_half_dx);
const x1_vmem = x_vmem.clone().add(ahead_dx);
const y1_vmem = y_vmem.clone().add(ahead_dx);
const z1_vmem = z_vmem.clone().add(ahead_dx);

// VREG coordinates
const x_vreg = v3(350.0, 240.0, 0.0);
const y_vreg = v3(400.0, 240.0, 0.0);
const z_vreg = v3(450.0, 240.0, 0.0);

// Vector Core coordinates
const vector_core = v3(410.0, 110.0, 0.0);

// Helper layout and animation functions

// grid positions
function make_grid(origin) {
  return empty([N, N])
    .indexMap( ([i, j]) => v3(i, j, 0) )
    .map( x => x.multiplyScalar(spacing).add(origin) )
    .arr
}

// grid of "packet" boxes
function make_boxes(origin, color, opacity=1.0) {
  return map(
    val => new Box(val, box_size, color, opacity, scene),
    make_grid(origin)
  );
}

// shove packets along a path like:
//                  end
//                   |
//      x1----------x2
//      |
//    start
//
function push_packets(boxes, start, end, t0, tick, tick_skew=null) {
  tick_skew = tick_skew !== null ? tick_skew : tick;
  let t = t0;
  const path_fn = (x_start, x_end, box) => {
    let delta = x_end.clone().sub(x_start);
    let x1 = x_start.clone().add(v3(0, delta.y/2.0, 0));
    let x2 = x_start.clone().add(v3(delta.x, delta.y/2.0, 0));
    box.toPosition(x1, t + tick, tick);
    box.toPosition(x2, t + tick * 2, tick);
    box.toPosition(x_end, t + tick * 3, tick);
    t += tick_skew;
  }
  map(path_fn, make_grid(start), make_grid(end), boxes);
  return t;
  // add delay until last box movement has finished.
  //return boxes[shape[0]-1][shape[1]-1].timeline.endTime();
}

// Make boxes for animation.
let X0s = make_boxes(x0_hbm, colors.red);
let X1s = make_boxes(x1_hbm, colors.red);
let Y0s = make_boxes(y0_hbm, colors.green);
let Y1s = make_boxes(y1_hbm, colors.green);

let Z0s = make_boxes(vector_core, colors.blue, 0.0);
let Z1s = make_boxes(vector_core, colors.blue, 0.0);

// grab an element from background SVG
let svg_timeline = gsap.timeline();
let svgroot = document.getElementById('background').contentDocument;
const created_buffers_in_svg = Array.from(svgroot.querySelectorAll('.st5,.st6'));

// Main Animation
let tick = 0.1;
let hbm_tick = 3 * tick;
let vmem_tick = 1 * tick;
let vpu_tick = 0.5 * tick;

let t0 = 1.0;

// fade in the "z" buffers at beginning of animation
created_buffers_in_svg.forEach(element => {
  element.style.opacity=0.0;
  svg_timeline.to(element, {css:{opacity: 1.0}, duration: 1.0}, t0);
});

let t1 = push_packets(X0s, x0_hbm, x0_vmem, t0, hbm_tick);
let t2 = push_packets(Y0s, y0_hbm, y0_vmem, t1, hbm_tick);
let t3 = push_packets(X1s, x1_hbm, x1_vmem, t2, hbm_tick);
let t4 = push_packets(Y1s, y1_hbm, y1_vmem, t3, hbm_tick);

let t5 = push_packets(X0s, x0_vmem, x_vreg, t2, vmem_tick);
let t6 = push_packets(Y0s, y0_vmem, y_vreg, t5, vmem_tick);

let t7 = push_packets(X0s, x_vreg, vector_core, t6, vpu_tick);
         push_packets(Y0s, y_vreg, vector_core, t6, vpu_tick);

// hide green/red, reveal blue
map((b) => b.toOpacity(0.0, t7, tick*0.1), X0s);
map((b) => b.toOpacity(0.0, t7, tick*0.1), Y0s);
map((b) => b.toOpacity(1.0, t7, tick*0.1), Z0s);

let t8 = push_packets(Z0s, vector_core, z_vreg, t7, vpu_tick);
let t9 = push_packets(Z0s, z_vreg, z0_vmem, t8, vpu_tick);
let t10 = push_packets(Z0s, z0_vmem, z0_hbm, Math.max(t9, t4), hbm_tick);

let t11 = push_packets(X1s, x1_vmem, x_vreg, Math.max(t4, t9), vmem_tick);
let t12 = push_packets(Y1s, y1_vmem, y_vreg, Math.max(t11, t4 + 4*hbm_tick), vmem_tick);
let t13 = push_packets(X1s, x_vreg, vector_core, t12, vpu_tick);
          push_packets(Y1s, y_vreg, vector_core, t12, vpu_tick);

// hide green/red inputs, reveal blue outputs
map((b) => b.toOpacity(0.0, t13, tick*0.1), X1s);
map((b) => b.toOpacity(0.0, t13, tick*0.1), Y1s);
map((b) => b.toOpacity(1.0, t13, tick*0.1), Z1s);

let t14 = push_packets(Z1s, vector_core, z_vreg, t13, vpu_tick);
let t15 = push_packets(Z1s, z_vreg, z1_vmem, t14, vpu_tick);
let t16 = push_packets(Z1s, z1_vmem, z1_hbm, Math.max(t15, t10), hbm_tick);

// duration of root gsap timeline (total length of scheduled animations)
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
