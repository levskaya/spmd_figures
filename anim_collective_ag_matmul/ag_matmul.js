import * as THREE from 'three';
import { CSS2DRenderer } from '/libs/three/CSS2DRenderer.js';
import { Box, Text, Label } from './boxpusher.js';
import * as nd from './nd.js';

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


// basic vector math
const mod = (n, m) => ((n % m) + m) % m;
// const add3 = (a, b) => ({x: a.x + b.x, y: a.y + b.y, z: a.z + b.z});
const sub3 = (a, b) => ({x: a.x - b.x, y: a.y - b.y, z: a.z - b.z});
const mul3 = (a, b) => ({x: a.x * b.x, y: a.y * b.y, z: a.z * b.z});
const div3 = (a, b) => ({x: a.x / b.x, y: a.y / b.y, z: a.z / b.z});
const smul3 = (s, a) => ({x: s * a.x, y: s * a.y, z: s * a.z});
const neg3 = (a) => ({x: -a.x, y: -a.y, z: -a.z});

function add3(...vs){
  if(vs.length === 1){
    return {x: vs[0].x , y: vs[0].y, z: vs[0].z};
  } else {
    const accum = add3(...vs.slice(1));
    return {x: vs[0].x + accum.x, y: vs[0].y + accum.y, z: vs[0].z + accum.z}
  }
}

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


// origins
const grid_origin = {x: -N * N * spacing / 2 - 3 * N * spacing, y: 0.0, z: 0.0};

// spacing
const box_size = {x: spacing, y: spacing};
const devSpacing = (2 * N + 3) * spacing;
const devSize = (2 * N + 2) * spacing;
const devSpacingV = {x: devSpacing, y: devSpacing, z: devSpacing};
const devSizeV = {x: devSize, y: devSize, z: devSize};

// unit vectors
const DX = {x: devSpacing, y:0, z: 0};
const dz = {x:0, y:0, z: spacing};
const dy = {x:0, y:-2*spacing, z:0};
const dx = {x:-spacing, y:0, z:0};

// Position grid
// 2d outer device grid
// 2d inner shard grid
// function multiGrid(origin, num, delta, ioffset, inum, idelta) {
//   let orows = nd.empty([num.x, num.y]);
//   let rows = nd.empty([num.x, num.y, inum.x, inum.y]);

//   for(let i = 0; i < num.x; i++) {
//     for(let j = 0; j < num.y; j++) {
//       let oidx = {x: i, y: num.y-j, z: 0};
//       orows[i][j] = add3(origin, mul3(oidx, delta));

//       for(let k = 0; k < inum.x; k++) {
//         for(let l = 0; l < inum.y; l++) {
//           let iidx = {x: k, y: inum.y-l, z: 0};
//           rows[i][j][k][l] = add3(orows[i][j], ioffset, mul3(iidx, idelta));
//         }
//       }

//     }
//   }
//   return [orows, rows];
// }

// function mgrid(ioffset, inum) {
//   return multiGrid(
//     grid_origin,
//     {x:N, y:1},  // outer numbers
//     {x:devSpacing, y:devSpacing, z:devSpacing},  // outer delta
//     ioffset,  // offset into inner grid
//     inum,  // inner numbers
//     {x:spacing, y:spacing, z:0},  // inner delta
//     );
// }

let device_posns = new nd.ndArray([N, 1])
                         .indexMap( ([i, j]) => ({x: i, y: j+1, z: 0}) )
                         .smul3(devSpacing)
                         .add3(grid_origin);

let p_posns = new nd.ndArray([N, 1])
                    .indexMap( ([i, j]) => ({x: i, y: 1, z: 0}) )
                    .add3({x: 1, y: -(N-1), z: 0})
                    .smul3(spacing);
p_posns = device_posns.outerMap(add3, p_posns).squeeze().arr;
let q_posns = new nd.ndArray([1, 1])
                    .indexMap( ([i, j]) => ({x: 1, y: 1, z: 0}) )
                    .add3({x: N+1, y: -(N+1), z: 0})
                    .smul3(spacing);
q_posns = device_posns.outerMap(add3, q_posns).squeeze().arr;
let a_posns = new nd.ndArray([1, 1])
                    .indexMap( ([i, j]) => ({x: 1, y: 1, z: 0}) )
                    .add3({x: N+3, y: -(N-1), z: 0})
                    .smul3(spacing);
a_posns = device_posns.outerMap(add3, a_posns).squeeze().arr;


// let [_, p_posns] = mgrid(
//   {x:spacing, y:-(N-1)*spacing, z:0},  // offset into inner grid
//   {x:N, y:1}  // inner numbers
//   );
// p_posns = nd.squeeze(p_posns);

// let q_posns = mgrid(
//   {x:(N+1)*spacing, y:-(N+1)*spacing, z:0},  // offset into inner grid
//   {x:1, y:1},  // inner numbers
//   )[1];
// q_posns = nd.squeeze(q_posns);

// let a_posns = mgrid(
//   {x:(N+3)*spacing, y:-(N-1)*spacing, z:0},  // offset into inner grid
//   {x:1, y:1},  // inner numbers
// )[1];
// a_posns = nd.squeeze(a_posns);


// devices
let devices = nd.map(val => new Box(val, devSizeV, grey, 1.0, scene), device_posns.arr);


// Edge condition: white blocks to mask R/L edge shards moving.
let whiteblockL = new Box(add3(device_posns.arr[N-1][0], DX, dz), devSpacingV, white, 1.0, scene);
let whiteblockR = new Box(add3(device_posns.arr[0][0], neg3(DX), dz), devSpacingV, white, 1.0, scene);



// P, Q arrays and accumulator A
let Ps = nd.map(val => new Box(val, box_size, purple, 0.1, scene), p_posns);
let Qs = nd.map(val => new Box(val, box_size, green, 1.0, scene),  q_posns);
// let As = nd.indexMap((_, val) => new Box(val, grid_spacing, teal, 0.0, scene),  a_posns);


// Main Animation

let movingQs = nd.empty([N]);
let movingPs = nd.empty([N]);


const right_boundary = add3(q_posns[N-1], dy, DX);
const left_boundary = add3(q_posns[0], dy, neg3(DX));

let v;
let t = 0.0;


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
    let idx = (i + step) % N;
    movingPs[i] = Ps[i][idx].clone(true, t)
                            .toPosition(add3(q_posns[i], dx), t);
    Ps[i][idx].toOpacity(0.1, t, 0.0);
    if(step != N-1) {
      movingQs[i] = Qs[i].clone(true, t)
                         .toPosition(add3(q_posns[i], dy), t);
    }
  }

  t+=2*tick;

  let rs_dur = 4*tick;
  // P * Q einsum
  for(let i = 0; i < N; i++) {
    Qs[i].toColor(teal, t, tick);
    if(step != N-1){
      Qs[i].toOpacity(0.0, t+tick, 0.0);
    } else {
      Qs[i].toColor(green, t+tick, 0.0);
    }
    movingPs[i].toPosition(q_posns[i], t, tick)
               .toColor(teal, t, tick)
               .toPosition(a_posns[i], t+rs_dur);
  }

  // collective permute (roll) of Q copy
  if(step != N-1) {
    for(let i = 0; i < N; i++) {
      let fwd = mod(i + 1, N);
      if(i != N-1) {
        movingQs[i].toPosition(add3(q_posns[fwd], dy), t, rs_dur)
                   .toPosition(q_posns[fwd], t+rs_dur, 2*tick);
      }
      else {
        movingQs[i].clone(true, t)
                   .toPosition(right_boundary, t, rs_dur);
        movingQs[i].toPosition(left_boundary, t, 0.0)
                   .toPosition(add3(q_posns[fwd], dy), t, rs_dur)
                   .toPosition(q_posns[fwd], t+rs_dur, 2*tick);
      }
    }
  }
  t+= 6*tick;

  // reset
  if(step != N-1) {
    for(let i = 0; i < N; i++) {
      Qs[i].toColor(green, t, 0.0).toOpacity(1.0, t, 0.0);
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
