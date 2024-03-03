import * as THREE from 'three';
import { CSS2DRenderer } from '/external/three/CSS2DRenderer.js';
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
const N = 8;

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
const grid_origin = {x: -N * N * spacing / 2 - N * spacing, y: 0.0, z: 0.0};


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

const [device_posns, shard_posns] = multiGrid(
  grid_origin,
  {x:N, y:1},  // outer numbers
  {x:(N+3)*spacing, y:(N+3)*spacing, z:0},  // outer delta
  {x:spacing, y:-(N+1)*spacing, z:0},  // offset into inner grid
  {x:1, y:N},  // inner numbers
  {x:spacing, y:spacing, z:0},  // inner delta
  );


// Drawn elements

// device boxes
let devices = arr2dInit(device_posns.length, device_posns[0].length);
for(let i = 0; i < device_posns.length; i++) {
  for(let j = 0; j < device_posns[0].length; j++) {
    devices[i][j] = new Box(device_posns[i][j], {x: (N+2)*spacing, y: (N+2)*spacing}, grey, 0.0, scene);
  }
}

// shards
let shards = arr2dInit(N, N);
for(let i = 0; i < N; i++) {
  for(let j = 0; j < N; j++) {
    shards[i][j] = new Box(
      sub3(shard_posns[i][0][0][j], {x: 0, y:0, z:0}),
      {x: N*spacing, y: spacing},
      red, 0.0, scene);
  }
}

// shard colors
const clrs = [];
for(let n = 0; n < N; n++) {
  clrs.push(hsl_color(n / (N-1) * 4/5, 0.9, 0.5));
}

const x_delta = sub3(shard_posns[1][0][0][0],
                     shard_posns[0][0][0][0]);
const z_delta = {x:0, y:0, z:.1};


// Edge condition: white blocks to mask R/L edge shards moving.
let whiteblockL = new Box(add3(add3(device_posns[N-1][0], x_delta), z_delta),
                          {x: (N+2)*spacing, y: (N+2)*spacing}, white, 1.0, scene);
let whiteblockR = new Box(add3(sub3(device_posns[0][0], x_delta), z_delta),
                          {x: (N+2)*spacing, y: (N+2)*spacing}, white, 1.0, scene);

let pos = add3(device_posns[N/2][0], v3(0,2,0));

const caption = new Label(pos, "", "3em", black, 0.0, scene);


// Main Animation

let disappearing_box, left_boundary, right_boundary;


let t = 0.0;


caption.toText("Reduce Scatter", t).toOpacity(1.0, t, 4*tick);

// t+=8*tick; caption.toText("we have an set of arrays", t).toOpacity(1.0, t, 4*tick);

t+=2*tick;

for(let i = 0; i < N; i++) {
  for(let j = 0; j < N; j++) {
    shards[i][j].toOpacity(1.0 / N, t);
  }
}

t+=2*tick;

for(let i = 0; i < device_posns.length; i++) {
  devices[i][0].toOpacity(1.0, t, 4*tick);
  const y_delta = {x: 1*spacing, y: 2*spacing, z:0};
  let foo = new Text(add3(device_posns[i][0], y_delta), `${i}`, 0.2, black, 0.0, scene).toOpacity(1.0, t, 4*tick);
}

// for(let n = 0; n < N; n++) { shards[n][n].toOpacity(1.0, t); }

t+=2*tick;

// reveal shards
// caption.toText("we have a <i>sharded</i> array", t);

for(let i = 0; i < N; i++) {
  for(let j = 0; j < N; j++) {
    shards[i][j].toColor(clrs[j], t, 2*tick);
  }
}

t+=2*tick;

// move shards to devices, reveal devices

// caption.toText("distributed across devices", t);

// for(let n = 0; n < N; n++) {
//   shards[n][n].toPosition(shard_posns[n][0][0][n], t, 4*tick);
//   devices[n][0].toOpacity(1.0, t, 4*tick);
// }

// label devices

// t+=8*tick; caption.toText("we'd like the full copy on each device", t);
// t+=4*tick; caption.toText("this requires copying shards across devices", t);
// t+=4*tick; caption.toText("in N/2 bidirectional data transfers", t);
t+= 2*tick;




const rs_dur = 8*tick;

const shard_center_offset = {x: N*spacing/2, y: -spacing/2, z: 0.1};

for(let p = 0; p < N/2; p++) {
  for(let n = 0; n < N; n++) {
    let fwd = mod(n + 1, N);
    let which = mod(n + N/2 - p, N);
    if(n != N-1) {
      shards[n][which].toPosition(shard_posns[fwd][0][0][which], t, rs_dur)
                      .toOpacity(0.0, t + rs_dur, 0);
      shards[fwd][which].toOpacity( Math.pow(2, p+1) / Math.pow(2, N/2), t+rs_dur, 0);
    }
    else {
      right_boundary = add3(shard_posns[n][0][0][which], x_delta);
      left_boundary = sub3(shard_posns[fwd][0][0][which], x_delta);

      shards[n][which].toPosition(right_boundary, t, rs_dur);
      shards[n][which].clone(true, t).toPosition(left_boundary, t, 0.0)
                                     .toPosition(shard_posns[fwd][0][0][which], t, rs_dur)
                                     .toOpacity(0.0, t + rs_dur, 0);
      shards[fwd][which].toOpacity( Math.pow(2, p+1) / Math.pow(2, N/2), t + rs_dur, 0);
    }
    let plus = new Text(add3(shard_posns[fwd][0][0][which], shard_center_offset), '+', 0.15, black, 0.0, scene)
                    .toOpacity(1.0, t + rs_dur*0.8, 0.2 * rs_dur)
                    .toOpacity(0.0, t + rs_dur, 0.2 * rs_dur);
  }

  if( p != N/2-1) {
    for(let n = 0; n < N; n++) {
      let bwd = mod(n - 1, N);
      let which = mod(n + N/2 + 1 + p, N);
      if(n != 0) {
        shards[n][which].toPosition(shard_posns[bwd][0][0][which], t, rs_dur)
                        .toOpacity(0.0, t + rs_dur, 0);
        shards[bwd][which].toOpacity( Math.pow(2, p+1) / Math.pow(2, N/2), t + rs_dur, 0);
      }
      else {
        left_boundary = sub3(shard_posns[n][0][0][which], x_delta);
        right_boundary = add3(shard_posns[bwd][0][0][which], x_delta);

        shards[n][which].toPosition(left_boundary, t, rs_dur);
        shards[n][which].clone(true, t).toPosition(right_boundary, t, 0.0)
                                       .toPosition(shard_posns[bwd][0][0][which], t, rs_dur)
                                       .toOpacity(0.0, t + rs_dur, 0);
        shards[bwd][which].toOpacity( Math.pow(2, p+1) / Math.pow(2, N/2), t + rs_dur, 0);
      }
    let plus = new Text(add3(shard_posns[bwd][0][0][which], shard_center_offset), '+', 0.15, black, 0.0, scene)
                    .toOpacity(1.0, t + rs_dur*0.8, 0.2 * rs_dur)
                    .toOpacity(0.0, t + rs_dur, 0.2 * rs_dur);
    }
  }

  t+=rs_dur;
}


// caption.toText("all devices now have a full copy of the array", t);


// Animation Loop
function animation(time) {
    renderer.render( scene, camera );
    labelRenderer.render( scene, camera );
}
renderer.setAnimationLoop(animation);
