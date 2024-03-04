import { gsap } from '/external/gsap/all.js';
import * as THREE from 'three';
import { CSS2DRenderer } from '/external/three/CSS2DRenderer.js';
import { Box, Text } from '/lib/boxpusher.js';
import * as nd from '/lib/nd.js';
import { v3, add, sub, mul, scale, neg, mod} from '/lib/vectors.js';
import { empty } from '/lib/nd.js';
import { capture_and_control_ui } from '/lib/control_ui.js';

// debug
window.THREE = THREE;
window.gsap = gsap;

// Colors
const teal = new THREE.Color(0, 0.66, 0.99);
const green = new THREE.Color("green");
const purple = new THREE.Color("purple");
const grey = new THREE.Color(0.9, 0.9, 0.9);
const white = new THREE.Color(0xffffff);
const black = new THREE.Color(0x000000);

// Scenegraph
const scene = new THREE.Scene();
scene.background = new THREE.Color(white);

// WebGL Render
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("canvas").appendChild( renderer.domElement );

// CSS Element Render
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize( window.innerWidth, window.innerHeight );
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.getElementById("canvas").appendChild( labelRenderer.domElement );

// Animation Constants

// Number of shards / Number of devices
// we assume an even number
const N = 4;

// Cameras
const frustumSize = 3 * N;
const aspect = window.innerWidth / window.innerHeight;
// Orthographic
const camera = new THREE.OrthographicCamera(
    /*left*/   frustumSize * aspect / - 2,
    /*right*/  frustumSize * aspect / 2,
    /*top*/    frustumSize / 2,
    /*bottom*/ frustumSize / - 2,
    /*near*/   0.01,
    /*far*/    10);
camera.position.z = 1;


// spacing
const spacing = 0.125;
const box_size = v3(spacing, spacing, 0);
const devSpacing = (2 * N + 3) * spacing;
const devSize = (2 * N + 2) * spacing;
const devSpacingV = v3(devSpacing, devSpacing, devSpacing);
const devSizeV = v3(devSize, devSize, devSize);

// origin
const grid_origin = v3(-N * N * spacing / 2 - 4 * N * spacing,
                       devSpacing,
                       0.0);

// unit vectors
const DX = v3(devSpacing, 0, 0);
const DY = v3(0, devSpacing, 0);
const dx = v3(spacing, 0, 0);
const dy = v3(0, spacing, 0);
const dz = v3(0, 0, spacing);

// unsharded positions
const p_grid0 = nd.empty([N, N])
                 .indexMap( ([i, j]) => v3(j, i, 0).add(v3(0, 5, 0)).multiplyScalar(spacing) )
                 .toArray();
const q_grid0 = nd.empty([N])
                  .indexMap( ([i]) => v3(0, -i, 0).add(v3(N+2, N+4, 0)).multiplyScalar(spacing) )
                  .toArray();
const a_grid0 = nd.empty([N])
                  .indexMap( ([i]) => v3(0, -i, 0).add(v3(N+5, N+4, 0)).multiplyScalar(spacing) )
                  .toArray();

// sharded positions
const device_grid = nd.empty([N, 1])
    .indexMap( ([i, j]) => v3(i, j, 0).multiplyScalar(devSpacing).add(grid_origin) );
const p_grid = nd.empty([N, 1])
    .indexMap( ([i, j]) => v3(i, j, 0).add(v3(1, -2, 0)).multiplyScalar(spacing) );
const q_grid = nd.empty([1, 1])
    .indexMap( ([i, j]) => v3(i, j, 0).add(v3(N+2, -4, 0)).multiplyScalar(spacing) );
const a_grid = nd.empty([1, 1])
    .indexMap( ([i, j]) => v3(i, j, 0).add(v3(2*N, -2, 0)).multiplyScalar(spacing) );
const p_posns = device_grid.outerMap(add, p_grid).squeeze().toArray();
const q_posns = device_grid.outerMap(add, q_grid).squeeze().toArray();
const a_posns = device_grid.outerMap(add, a_grid).squeeze().toArray();
const device_posns = device_grid.toArray();

const right_boundary = add(q_posns[N-1], scale(-2, dy), DX);
const left_boundary = add(q_posns[0], scale(-2, dy), neg(DX));


// devices
let devices = nd.map(val => new Box(val, devSizeV, grey, 0.0, scene), device_posns);

// Edge condition: white blocks to mask R/L edge shards moving.
let maskL = new Box(add(device_posns[N-1][0], DX, dz), devSpacingV, white, 1.0, scene);
let maskR = new Box(add(device_posns[0][0], neg(DX), dz), devSpacingV, white, 1.0, scene);

const multiply_0 = new Text(add(q_grid0[N/2], scale(-1.2, dx), scale(-0.8, dy)),
                            "*", 0.2, black, 1.0, scene);
const equals_0 = new Text(add(q_grid0[N/2], scale(2, dx), scale(-0.4, dy)), 
                          "=", 0.2, black, 0.0, scene);

const multiplies = q_posns.map(
    v => new Text(add(v, scale(-0.6, dx), scale(-0.8, dy)), "*", 0.1, black, 0.0, scene));
const plusses = a_posns.map(
    v => new Text(add(v, scale(-0.6, dx), scale(-0.75, dy)), "+", 0.1, black, 0.0, scene));

// P, Q arrays and accumulator A
let Ps = nd.map(val => new Box(val, box_size, purple, 1.0, scene), p_grid0);
let Qs = nd.map(val => new Box(val, box_size, green, 1.0, scene), q_grid0);
let As = nd.map(val => new Box(val, box_size, teal, 0.0, scene), a_grid0);

let movingQs = nd.empty([N]).arr;
let movingPs = nd.empty([N]).arr;

// Main Animation

const tick = 0.4;
let t = 0.0;

t+=6*tick;
multiply_0.toOpacity(0.0, t, 6*tick);
for(let i = 0; i < N; i++) {
  // fade-in device boxes.
  devices[i][0].toOpacity(0.0, t, 0.0).toOpacity(1.0, t, 6*tick);
  // initial view of unsharded P, Q --> move to sharded view.
  for(let j = 0; j < N; j++) {
    Ps[i][j].toPosition(p_grid0[i][j], t, 0.0)
            .toPosition(p_posns[i][j], t, 6*tick)
            .toOpacity(0.1, t, 6*tick);
  }
  Qs[i].toPosition(q_grid0[i], t, 0.0)
       .toPosition(q_posns[i], t, 6*tick);
  As[i].toPosition(a_posns[i], t, 0.0);
}
t+=6*tick;

for(let step = 0; step < N; step++) {

  t+=2*tick;

  // highlight P slice
  for(let i = 0; i < N; i++) {
    let idx = (i + step) % N;
    Ps[i][idx].toOpacity(1.0, t);
  }

  t+=2*tick;

  // P slice moves, Q copied
  for(let i = 0; i < N; i++) {
    let idx = mod(i + step, N);
    movingPs[i] = Ps[i][idx].clone(true, t)
                            .toPosition(sub(q_posns[i], scale(2, dx)), t);
    Ps[i][idx].toOpacity(0.1, t, 0.0);
    multiplies[i].toOpacity(1.0, t, tick+tick).toOpacity(0.0, t+2*tick);
    if(step != N-1) {
      movingQs[i] = Qs[i].clone(true, t)
                         .toPosition(add(q_posns[i], scale(-2, dy)), t);
    }
  }

  t+=2*tick;

  const einsum_dur = 4*tick;
  // P * Q einsum
  for(let i = 0; i < N; i++) {
    Qs[i].toColor(teal, t, tick);
    // if(step != N-1){
    Qs[i].toOpacity(0.0, t+tick, 0.0);
    // } else {
      // Qs[i].toColor(green, t+tick, 0.0);
    // }
    movingPs[i].toPosition(q_posns[i], t, tick)
               .toColor(teal, t, tick)
               .toPosition(add(a_posns[i], scale(-2, dx)), t+einsum_dur-2*tick)
               .toPosition(a_posns[i], t+einsum_dur);
    if(step != 0) {
      plusses[i]
      .toOpacity(1.0, t, t+einsum_dur-tick)
      .toOpacity(0.0, t+einsum_dur);
    }
  }

  // collective permute (roll) of Q copy
  if(step != N-1) {
    for(let i = 0; i < N; i++) {
      let fwd = mod(i + 1, N);
      if(i != N-1) {
        movingQs[i].toPosition(add(q_posns[fwd], scale(-2, dy)), t, einsum_dur)
                   .toPosition(q_posns[fwd], t+einsum_dur, 2*tick);
      }
      else {
        movingQs[i].clone(true, t)
                   .toPosition(right_boundary, t, einsum_dur);
        movingQs[i].toPosition(left_boundary, t, 0.0)
                   .toPosition(add(q_posns[fwd], scale(-2, dy)), t, einsum_dur)
                   .toPosition(q_posns[fwd], t+einsum_dur, 2*tick);
      }
    }
  }
  t+= 6*tick;

  // reset
  if(step != N-1) {
    for(let i = 0; i < N; i++) {
      Qs[i].toColor(green, t, 0.0).toOpacity(1.0, t, 0.0);
      movingQs[i].toOpacity(0.0, t, 0.0);
      movingPs[i].toOpacity(0.0, t, 0.0);
      As[i].toOpacity(1.0, t, 0.0);
    }
  }

}


for(let i = 0; i < N; i++) {
  devices[i][0].toOpacity(0.0, t, 6*tick);
  movingQs[i].toOpacity(0.0, t, 0.0);
  movingPs[i].toOpacity(0.0, t, 0.0);
  for(let j = 0; j < N; j++) {
    Ps[i][j].toOpacity(0.0, t, tick);
  }
  Qs[i].toOpacity(0.0, t, tick);
  for(let j = 0; j < N; j++) {
    Ps[i][j].toPosition(p_grid0[i][j], t+tick, 6*tick);
  }
  Qs[i].toPosition(q_grid0[i], t+tick, 6*tick);
  As[i].toPosition(a_grid0[i], t+tick, 6*tick);
}
t+=6*tick;

multiply_0.toOpacity(1.0, t, tick);
equals_0.toOpacity(1.0, t, tick);
for(let i = 0; i < N; i++) {
  for(let j = 0; j < N; j++) {
    Ps[i][j].toOpacity(1.0, t, tick);
  }
  Qs[i].toColor(green, t, 0.0).toOpacity(1.0, t, tick);
}


// Animation Loop
function animation(time) {
    renderer.render( scene, camera );
    labelRenderer.render( scene, camera );
}
renderer.setAnimationLoop(animation);


// Capture and Control UI

capture_and_control_ui(
  "controls",               // control div id
  t + 4 * tick,             // animation time in seconds
  "ag_matmul.webm",         // save filename
  "video/webm"              // save format
  );
