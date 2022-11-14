import * as THREE from 'three';
import { FontLoader } from './FontLoader.js';
import { CSS2DRenderer, CSS2DObject } from './CSS2DRenderer.js';
import { gsap } from './gsap/all.js';
import { simple_mat, Box, makeGrid, Text, Label} from './boxpusher.js';
import * as _ from 'lodash';

window.THREE = THREE;

// Colors
const teal = new THREE.Color(0, 0.66, 0.99);
const red = new THREE.Color(0.99, 0., 0.);
const blue = new THREE.Color("blue");
const green = new THREE.Color("green");
const orange = new THREE.Color("orange");
const purple = new THREE.Color("purple");
const pink = new THREE.Color("pink");

const grey = new THREE.Color(0.9, 0.9, 0.9);
const greyred = new THREE.Color(0.9, 0.6, 0.6);
const white = new THREE.Color(0xffffff);
const black = new THREE.Color(0x000000);

const hsl_color = (h, s=0.9, l=0.8) => new THREE.Color().setHSL(h, s, l);

// Clock
let clock = new THREE.Clock();

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

// Utils
const v3 = (x,y,z) => new THREE.Vector3(x,y,z);

export function arr1dInit(nx) {
  return new Array(nx).fill(null);
}
export function arr2dInit(nx, ny) {
  return new Array(nx).fill(null).map(() => arr1dInit(ny));
}
export function arr3dInit(nx, ny, nz) {
  return new Array(nx).fill(null).map(() => arr2dInit(ny, nz));
}
export function arr4dInit(nx, ny, nz, nw) {
  return new Array(nx).fill(null).map(() => arr3dInit(ny, nz, nw));
}

// basic vector math
const mod = (n, m) => ((n % m) + m) % m;
const add3 = (a, b) => ({x: a.x + b.x, y: a.y + b.y, z: a.z + b.z});
const sub3 = (a, b) => ({x: a.x - b.x, y: a.y - b.y, z: a.z - b.z});
const mul3 = (a, b) => ({x: a.x * b.x, y: a.y * b.y, z: a.z * b.z});
const div3 = (a, b) => ({x: a.x / b.x, y: a.y / b.y, z: a.z / b.z});
const smul3 = (s, a) => ({x: s * a.x, y: s * a.y, z: s * a.z});


// Animation Constants

// speed
let tick = 0.3;

// matrix sizes
const N = 4;


// Cameras
const frustumSize = 3*N;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
    /*left*/   frustumSize * aspect / - 2,
    /*right*/  frustumSize * aspect / 2,
    /*top*/    frustumSize / 2,
    /*bottom*/ frustumSize / - 2,
    /*near*/   0.01,
    /*far*/    10);
camera.position.z = 1;

// const camera = new THREE.PerspectiveCamera(
// 	/*fov*/    70,
// 	/*aspect*/ aspect,
// 	/*near*/   0.01,
// 	/*far*/    10);
// // camera.position.z = 1;
// camera.position.set( 0, 0, 5 );


// grid spacing
const size = 0.1;
const delta = 0.025;
const spacing = size + delta;

// origins
const col_origin = {x: -N * N * spacing / 2 - N*spacing, y: 0., z:0.};


// Position grids

function multiGrid(origin, num, delta, ioffset, inum, idelta) {
  let orows = arr2dInit(num.x, num.y);
  let rows = arr4dInit(num.x, num.y, inum.x, inum.y);

  for(let i = 0; i < num.x; i++) {
    for(let j = 0; j < num.y; j++) {
      let oidx = {x: i, y: num.y-j, z: 0};
      orows[i][j] = add3(origin, mul3(oidx, delta));

      for(let k = 0; k < inum.x; k++) {
        for(let l = 0; l < inum.y; l++) {
          let iidx = {x: k, y: inum.y-l, z: 0};
          rows[i][j][k][l] = add3(add3(orows[i][j], ioffset), mul3(iidx, idelta));
        }
      }

    }
  }
  return [orows, rows];
}


// function multiGrid(origin, num, delta, ioffset, inum, idelta) {
//   let orows = new Array();
//   let rows = new Array();
//   for(let i = 0; i < num.x; i++) {
//     let ocols = new Array();
//     let cols = new Array();
//     for(let j = 0; j < num.y; j++) {
//       let oidx = {x: i, y: num.y-j, z: 0};
//       let outer = add3(origin, mul3(oidx, delta));
//       ocols.push(outer);
//       let irows = new Array();
//       for(let k = 0; k < inum.x; k++) {
//         let icols = new Array();
//         for(let l = 0; l < inum.y; l++) {
//           let iidx = {x: k, y: inum.y-l, z: 0};
//           let inner = add3(add3(outer, ioffset), mul3(iidx, idelta));
//           icols.push(inner);
//         }
//         irows.push(icols);
//       }
//       cols.push(irows);
//     }
//     orows.push(ocols);
//     rows.push(cols);
//   }
//   return [orows, rows];
// }


const [device_posns, shard_posns] = multiGrid(
  col_origin,
  {x:N, y:1},
  {x:(N+3)*spacing, y:(N+3)*spacing, z:0},
  {x:spacing, y:-2*spacing, z:0},
  {x:N, y:1},
  {x:spacing, y:spacing, z:0},
  );


// shards
let shards = arr2dInit(N, N);

// device boxes
let devices = arr2dInit(device_posns.length, device_posns[0].length);
for(let i = 0; i < device_posns.length; i++) {
  for(let j = 0; j < device_posns[0].length; j++) {
    devices[i][j] = new Box(device_posns[i][j], {x: (N+2)*spacing, y: (N+2)*spacing}, grey, 0.0, scene);
  }
}


// Main Loop

let pos, tmp;
let t = 0.0

t+=1*tick;


for(let n = 0; n < N; n++) {
    shards[n][n] = new Box(sub3(shard_posns[N/2][0][n][0], {x:N*spacing/2, y:0, z:0}),
                         {x: spacing, y: N*spacing},
                         black, 1.0, scene);
}


t+=2*tick;


const clrs = [];
for(let n = 0; n < N; n++) {
  clrs.push(hsl_color(n / (N-1) * 4/5, 0.9, 0.5));
}

for(let n = 0; n < N; n++) {
  shards[n][n].toColor(clrs[n], t);
}

t+=4*tick;

for(let n = 0; n < N; n++) {
  shards[n][n].toPosition(shard_posns[n][0][n][0], t);
  devices[n][0].toOpacity(1.0, t);
}

t+=4*tick;

let x_delta = sub3(shard_posns[1][0][0][0], shard_posns[0][0][0][0]);

for(let p = 0; p < N/2; p++) {

  for(let n = 0; n < N; n++) {
    let fwd = mod(n + 1, N);
    let last = mod(n - p, N);
    if(n != N-1) {
      shards[fwd][last] = shards[n][last].clone().replay().toPosition(shard_posns[fwd][0][last][0], t, 4*tick).toOpacity(1.0, t);
    }
    else {
      pos = add3(shard_posns[n][0][last][0], x_delta);
      tmp = shards[n][last].clone().replay().toVisible(t).toPosition(pos, t, 4*tick).toOpacity(0.0, t, 2*tick);
      pos = sub3(shard_posns[fwd][0][last][0], x_delta);
      shards[fwd][last] = shards[n][last].clone().replay().toPosition(pos, t, 0.0).toPosition(shard_posns[fwd][0][last][0], t, 4*tick).toOpacity(1.0, t, 2*tick);
    }
  }

  t+=4*tick;

  if( p != N/2-1) {
    for(let n = 0; n < N; n++) {
      let bwd = mod(n - 1, N);
      let last = mod(n + p, N);
      if(n != 0) {
        shards[bwd][last] = shards[n][last].clone().replay().toPosition(shard_posns[bwd][0][last][0], t, 4*tick).toOpacity(1.0, t);
      }
      else {
        pos = sub3(shard_posns[n][0][last][0], x_delta);
        tmp = shards[n][last].clone().replay().toVisible(t).toPosition(pos, t, 4*tick).toOpacity(0.0, t, 2*tick);
        pos = add3(shard_posns[bwd][0][last][0], x_delta);
        shards[bwd][last] = shards[n][last].clone().replay().toPosition(pos, t, 0.0).toPosition(shard_posns[bwd][0][last][0], t, 4*tick).toOpacity(1.0, t, 2*tick);
      }
    }

  t+=4*tick;
  }
}


// Animation Loop
function animation(time) {
    renderer.render( scene, camera );
    labelRenderer.render( scene, camera );
}
renderer.setAnimationLoop(animation);
