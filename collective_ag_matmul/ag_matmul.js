import * as THREE from 'three';
import { CSS2DRenderer } from '/external/three/CSS2DRenderer.js';
import { Box, Text, Label } from './boxpusher.js';
import * as nd from './nd.js';
import { mod, neg3, add3, sub3, scalar3 } from './nd.js';

window.THREE = THREE;

// Colors
const teal = new THREE.Color(0, 0.66, 0.99);
const red = new THREE.Color(0.99, 0., 0.);
const blue = new THREE.Color("blue");
const green = new THREE.Color("green");
const orange = new THREE.Color("orange");
const purple = new THREE.Color("purple");
const pink = new THREE.Color("pink");
const greyred = new THREE.Color(0.9, 0.6, 0.6);
const grey = new THREE.Color(0.9, 0.9, 0.9);
const white = new THREE.Color(0xffffff);
const black = new THREE.Color(0x000000);

const hsl_color = (h, s=0.9, l=0.8) => new THREE.Color().setHSL(h, s, l);

// Scenegraph
const scene = new THREE.Scene();
scene.background = new THREE.Color(white);

// WebGL Render
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// CSS Element Render
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize( window.innerWidth, window.innerHeight );
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild( labelRenderer.domElement );

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
const box_size = {x: spacing, y: spacing};
const devSpacing = (2 * N + 3) * spacing;
const devSize = (2 * N + 2) * spacing;
const devSpacingV = {x: devSpacing, y: devSpacing, z: devSpacing};
const devSizeV = {x: devSize, y: devSize, z: devSize};

// origin
const grid_origin = {x: -N * N * spacing / 2 - 4 * N * spacing, y: devSpacing, z: 0.0};

// unit vectors
const DX = {x: devSpacing, y:0, z: 0};
const DY = {x: 0, y:devSpacing, z: 0};
const dx = {x:spacing, y:0, z:0};
const dy = {x:0, y:spacing, z:0};
const dz = {x:0, y:0, z: spacing};

const down_y = scalar3(-2, dy);


// unsharded positions
const p_grid0 = nd.empty([N, N])
                 .indexMap( ([i, j]) => ({x: j, y: i, z: 0}) )
                 .add3({x: 0, y: 5, z: 0})
                 .scalar3(spacing).arr;
const q_grid0 = nd.empty([N])
                  .indexMap( ([i]) => ({x: 0, y: -i, z: 0}) )
                  .add3({x: N+2, y: N+4, z: 0})
                  .scalar3(spacing).arr;
const a_grid0 = nd.empty([N])
                  .indexMap( ([i]) => ({x: 0, y: -i, z: 0}) )
                  .add3({x: N+5, y: N+4, z: 0})
                  .scalar3(spacing).arr;

// sharded positions
const device_grid = nd.empty([N, 1])
                      .indexMap( ([i, j]) => ({x: i, y: j, z: 0}) )
                      .scalar3(devSpacing)
                      .add3(grid_origin);
const p_grid = nd.empty([N, 1])
                 .indexMap( ([i, j]) => ({x: i, y: j, z: 0}) )
                 .add3({x: 1, y: -2, z: 0})
                 .scalar3(spacing);
const q_grid = nd.empty([1, 1])
                 .indexMap( ([i, j]) => ({x: i, y: j, z: 0}) )
                 .add3({x: N+2, y: -4, z: 0})
                 .scalar3(spacing);
const a_grid = nd.empty([1, 1])
                 .indexMap( ([i, j]) => ({x: i, y: j, z: 0}) )
                 .add3({x: 2*N, y: -2, z: 0})
                 .scalar3(spacing);
const p_posns = device_grid.outerMap(add3, p_grid).squeeze().arr;
const q_posns = device_grid.outerMap(add3, q_grid).squeeze().arr;
const a_posns = device_grid.outerMap(add3, a_grid).squeeze().arr;
const device_posns = device_grid.arr;

const right_boundary = add3(q_posns[N-1], down_y, DX);
const left_boundary = add3(q_posns[0], down_y, neg3(DX));


// devices
let devices = nd.map(val => new Box(val, devSizeV, grey, 0.0, scene), device_posns);

// Edge condition: white blocks to mask R/L edge shards moving.
let maskL = new Box(add3(device_posns[N-1][0], DX, dz), devSpacingV, white, 1.0, scene);
let maskR = new Box(add3(device_posns[0][0], neg3(DX), dz), devSpacingV, white, 1.0, scene);

const multiply_0 = new Text(add3(q_grid0[N/2], scalar3(-1.2, dx), scalar3(-0.8, dy)), "*", 0.2, black, 1.0, scene);
const equals_0 = new Text(add3(q_grid0[N/2], scalar3(2, dx), scalar3(-0.4, dy)), "=", 0.2, black, 0.0, scene);

const multiplies = q_posns.map(v => new Text(add3(v, scalar3(-0.6, dx), scalar3(-0.8, dy)), "*", 0.1, black, 0.0, scene));
const plusses = a_posns.map(v => new Text(add3(v, scalar3(-0.6, dx), scalar3(-0.5, dy)), "+", 0.1, black, 0.0, scene));

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
                            .toPosition(sub3(q_posns[i], scalar3(2, dx)), t);
    Ps[i][idx].toOpacity(0.1, t, 0.0);
    multiplies[i].toOpacity(1.0, t, tick+tick).toOpacity(0.0, t+2*tick);
    if(step != N-1) {
      movingQs[i] = Qs[i].clone(true, t)
                         .toPosition(add3(q_posns[i], down_y), t);
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
               .toPosition(add3(a_posns[i], scalar3(-2, dx)), t+einsum_dur-2*tick)
               .toPosition(a_posns[i], t+einsum_dur);
    if(step != 0) {
      plusses[i].toOpacity(1.0, t, t+einsum_dur-tick).toOpacity(0.0, t+einsum_dur);
    }
  }

  // collective permute (roll) of Q copy
  if(step != N-1) {
    for(let i = 0; i < N; i++) {
      let fwd = mod(i + 1, N);
      if(i != N-1) {
        movingQs[i].toPosition(add3(q_posns[fwd], down_y), t, einsum_dur)
                   .toPosition(q_posns[fwd], t+einsum_dur, 2*tick);
      }
      else {
        movingQs[i].clone(true, t)
                   .toPosition(right_boundary, t, einsum_dur);
        movingQs[i].toPosition(left_boundary, t, 0.0)
                   .toPosition(add3(q_posns[fwd], down_y), t, einsum_dur)
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
