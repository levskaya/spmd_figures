import * as THREE from 'three';
import { CSS2DRenderer } from '/libs/three/CSS2DRenderer.js';
import { Box, Text, Label } from './boxpusher.js';

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

// Number of shards / Number of devices
// we assume an even number
const N = 4;

// grid spacing
const spacing = 0.125;


// Cameras
const frustumSize = 2 * N;
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
// Perspective
// const camera = new THREE.PerspectiveCamera(
// 	/*fov*/    70,
// 	/*aspect*/ aspect,
// 	/*near*/   0.01,
// 	/*far*/    10);
// // camera.position.z = 1;
// camera.position.set( 0, 0, 10 );
// camera.lookAt(0,0,0);


// origins
const grid_origin = {x: -N * N * spacing / 2 - 3 * N * spacing, y: 0.0, z: 0.0};

const devSpacing = (2 * N + 3)*spacing;
const devSize = (2 * N + 2)*spacing;


// Position grid
// 2d outer device grid
// 2d inner shard grid
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

function mgrid(ioffset, inum) {
  return multiGrid(
    grid_origin,
    {x:N, y:1},  // outer numbers
    {x:devSpacing, y:1, z:0},  // outer delta
    ioffset,  // offset into inner grid
    inum,  // inner numbers
    {x:spacing, y:spacing, z:0},  // inner delta
    );
}

const [device_posns, p_posns] = mgrid(
  {x:spacing, y:-(N-1)*spacing, z:0},  // offset into inner grid
  {x:N, y:1}  // inner numbers
  );

const q_posns = mgrid(
  {x:(N+1)*spacing, y:-(N+1)*spacing, z:0},  // offset into inner grid
  {x:1, y:1},  // inner numbers
  )[1];

  const a_posns = mgrid(
  {x:(N+3)*spacing, y:-(N-1)*spacing, z:0},  // offset into inner grid
  {x:1, y:1},  // inner numbers
  )[1];


// devices
let devices = arr2dInit(device_posns.length, device_posns[0].length);
for(let i = 0; i < device_posns.length; i++) {
  for(let j = 0; j < device_posns[0].length; j++) {
    devices[i][j] = new Box(device_posns[i][j], {x: devSize, y: devSize}, grey, 1.0, scene);
  }
}

const DX = sub3(p_posns[1][0][0][0], p_posns[0][0][0][0]);

// Edge condition: white blocks to mask R/L edge shards moving.
const z_out = {x:0, y:0, z:.1};
let whiteblockL = new Box(add3(add3(device_posns[N-1][0], DX), z_out),
                          {x: devSize, y: devSize}, white, 1.0, scene);
let whiteblockR = new Box(add3(sub3(device_posns[0][0], DX), z_out),
                          {x: devSize, y: devSize}, white, 1.0, scene);


// P, Q arrays and accumulator A
let Ps = arr2dInit(N, N);
let Qs = arr2dInit(N, 1);
let As = arr2dInit(N, 1);

for(let i = 0; i < N; i++) {
  for(let j = 0; j < N; j++) {
    Ps[i][j] = new Box(
      sub3(p_posns[i][0][j][0], {x: 0, y: 0, z: 0}),
      {x: spacing, y: spacing},
      purple, 0.1, scene);
  }
  Qs[i][0] = new Box(
    sub3(q_posns[i][0][0][0], {x: 0, y: 0, z: 0}),
    {x: spacing, y: spacing},
    green, 1.0, scene);
  As[i][0] = new Box(
    sub3(a_posns[i][0][0][0], {x: 0, y: 0, z: 0}),
    {x: spacing, y: spacing},
    teal, 0.0, scene);
}


// Main Animation

let movingQs = new Array(N).fill(null);
let movingPs = new Array(N).fill(null);

const dy = {x:0, y:-2*spacing, z:0};
const dx = {x:-spacing, y:0, z:0};
const right_boundary = add3(add3(q_posns[N-1][0][0][0], dy), DX);
const left_boundary = sub3(add3(q_posns[0][0][0][0], dy), DX);

let v;
let t = 0.0;


for(let I = 0; I < N; I++) {

  t+=2*tick;

  // highlight P slice
  for(let i = 0; i < N; i++) {
    let idx = (i + I) % N;
    Ps[i][idx].toOpacity(1.0, t);
  }

  t+=2*tick;

  // P slice moves, Q copied
  for(let i = 0; i < N; i++) {
    let idx = (i + I) % N;
    v = add3(q_posns[i][0][0][0], dx);
    movingPs[i] = Ps[i][idx].clone(true, t).toPosition(v, t);
    Ps[i][idx].toOpacity(0.1, t, 0.0);
    if(I != N-1) {
      v = add3(q_posns[i][0][0][0], dy)
      movingQs[i] = Qs[i][0].clone(true, t).toPosition(v, t);
    }
  }

  t+=2*tick;

  // P * Q einsum
  for(let i = 0; i < N; i++) {
    Qs[i][0].toColor(teal, t, tick);
    if(I != N-1){
      Qs[i][0].toOpacity(0.0, t+tick, 0.0);
    } else {
      Qs[i][0].toColor(green, t+tick, 0.0);
    }
    let av = a_posns[i][0][0][0]
    movingPs[i].toPosition(q_posns[i][0][0][0], t, tick).toColor(teal, t, tick).toPosition(av, t+3*tick);
  }

  // collective permute (roll) of Q copy
  if(I != N-1) {
      for(let i = 0; i < N; i++) {
      let rs_dur = 4*tick;
      let fwd = mod(i + 1, N);
      v = add3(q_posns[fwd][0][0][0], dy)
      if(i != N-1) {
        movingQs[i].toPosition(v, t, rs_dur).toPosition(q_posns[fwd][0][0][0]);
      }
      else {
        movingQs[i].clone(true, t).toPosition(right_boundary, t, rs_dur);
        movingQs[i].toPosition(left_boundary, t, 0.0)
                                  .toPosition(v, t, rs_dur)
                                  .toPosition(q_posns[fwd][0][0][0], t+rs_dur, 2*tick);
      }
    }
  }
  t+= 6*tick;

  // reset
  if(I != N-1) {
    for(let i = 0; i < N; i++) {
      Qs[i][0].toColor(green, t, 0.0).toOpacity(1.0, t, 0.0);
      movingQs[i].toOpacity(0.0, t, 0.0);
    }
  }

}



// Animation Loop
function animation(time) {
    renderer.render( scene, camera );
    labelRenderer.render( scene, camera );
}
renderer.setAnimationLoop(animation);
