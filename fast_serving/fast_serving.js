import * as THREE from 'three';
import { CSS2DRenderer } from '/external/three/CSS2DRenderer.js';
import { capture_and_control_ui } from '/lib/control_ui.js';
import { Box, Text } from '/lib/boxpusher.js';
import * as nd from '/lib/nd.js';
import { v3, multiplyScalar, add, mod } from '/lib/vectors.js';

window.THREE = THREE;

// Colors
const teal = new THREE.Color(0, 0.86, 0.99);
const lightgreen = new THREE.Color(0.7, 0.9, 0.7);
const green = new THREE.Color("green");
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
const N = 24;
const M = 4;

// Cameras
const frustumSize = 1 * N;
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

let cursor_pos = 0;
function step_cursor() {
  cursor_pos += mod(cursor + 1, N);
}

// spacing
const spacing = 1.0;
const box_size = v3(0.95*spacing, 0.95*spacing, 0);

// origin
const grid_origin = v3(-N / 2, 0, 0.0);

// unit vectors
const dx = v3(spacing, 0, 0);
const dy = v3(0, spacing, 0);
const dz = v3(0, 0, spacing);;

// grid positions
const p_grid0 = nd.empty([N, M])
                 .indexMap( ([i, j]) => {
                  return v3(i, j, 0).add(grid_origin).multiplyScalar(spacing)
                }).toArray();

// background black box (for grid)
const bg_size = v3(N * spacing + 0.05, M * spacing + 0.05);
let background = new Box(
  nd.fromArray(grid_origin)
    .map( x => add(x, v3(-0.025, (M - 1) * spacing + 0.025, 0)))
    .toArray(),
  bg_size, black, 1.0, scene);

// boxes
let Ps = nd.map(val => new Box(
    nd.fromArray(val)
    .map( x => add(x, v3(0.025, -0.025, 0)))
    .toArray(),
    box_size, white, 1.0, scene), 
  p_grid0);

// letter boxes
let Ts = nd.map(val => new Text(
    add(val, multiplyScalar(0.5, dx), multiplyScalar(-0.9, dy)), 
    '', 0.8, black, 1.0, scene),
  p_grid0);

let cursor = new Text(
    add(p_grid0[0][0],
        multiplyScalar(-0.2 + cursor_pos, dx),
        multiplyScalar(-2.1, dy)), 
    '^', 1.0, black, 1.0, scene);

let stepnum = new Text(
    add(p_grid0[0][0],
        multiplyScalar(-0.2, dx), 
        multiplyScalar(-4.1, dy)), 
    '', 1.0, black, 1.0, scene);


// Main Animation
const tick = 0.4;
let t = 0.0;

t+=4*tick;

let data = nd.empty([M]).map(x => ({prefill: "", gen: ""})).toArray();

const script = {
  0: {0: {prefill: "foobar", gen: " is False"}},
  5: {1: {prefill: "the sun", gen: " is a star"}},
  8: {2: {prefill: "2 + 2 =", gen: "4"}},
  9: {3: {prefill: "Bard is", gen: " a chat bot"}},
  20: {0: {prefill: "robots are", gen: " our friends"}},
  22: {1: {prefill: "print is", gen: " a statement"}},
  23: {2: {prefill: "veni vidi", gen: " vici"}},
  26: {3: {prefill: "please hold", gen: " the mayo"}},
};

for(let step = 0; step < 100; step++) {
  // stepnum.toText(`${step}`, t, 0.0);
  if(step in script){
    for(const prop in script[step]) {
      data[prop] = script[step][prop];
    }
    delete script[step];
  }

  cursor.toPosition(
    add(p_grid0[0][0],
        multiplyScalar(-0.2 + cursor_pos, dx),
        multiplyScalar(-2.1, dy)), t, 0.5);

  let prefill_occurred = false;

  for(let j = 0; j < M; j++) {
    let prefill = "";
    if(data[j].prefill.length > 0) {
      for(let idx=0; idx < N; idx++) { 
        Ts[idx][M-1-j].toText('', t-0.1)
                      .toColor(black, t, 0.0); 
      }
      prefill = data[j].prefill;
      for(let idx=0; idx < prefill.length; idx++) {
        Ts[mod(cursor_pos-idx-1, N)][M-1-j].toText(prefill[prefill.length - 1 - idx], t+8*tick)
                                           .toColor(green, t, 0.0);
        Ps[mod(cursor_pos-idx-1, N)][M-1-j].toColor(lightgreen, t, 0.5)
                                           .toColor(white, t+8*tick, 0.5);
      }
      data[j].prefill = "";
      prefill_occurred = true;
    }
  }
  if(false || !prefill_occurred) {
    for(let j = 0; j < M; j++) {
      let genchar = "";
      Ps[mod(cursor_pos, N)][M-1-j].toColor(teal, t, 0.5)
                                   .toColor(white, t+0.5, 0.5);
      if(data[j].gen.length > 0) {
        genchar = data[j].gen[0];
        Ts[mod(cursor_pos, N)][M-1-j].toText(genchar, t+0.5);
        data[j].gen = data[j].gen.slice(1);
      } else {
        Ts[mod(cursor_pos, N)][M-1-j].toText('', t+0.5);
      }
    }
    cursor_pos = mod(cursor_pos + 1, N);
    t+=2*tick;
  } else {
    t+=8*tick; step--;
  }
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
  t+4*tick,                // animation time in seconds
  "fast_serving.webm", // save filename
  "video/webm"              // save format
  );
