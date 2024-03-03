import { gsap } from '/external/gsap/all.js';
import * as THREE from 'three';
import { CSS2DRenderer } from '/external/three/CSS2DRenderer.js';
import { Box, Text, Label } from '/lib/boxpusher.js';
import { v3, add, sub, mul, mod} from '/lib/vectors.js';
import { empty } from '/lib/nd.js';
import { capture_and_control_ui } from '/lib/control_ui.js';

// debug
window.THREE = THREE;
window.gsap = gsap;

// Colors
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
document.getElementById("canvas").appendChild( renderer.domElement );

// CSS Element Render
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize( window.innerWidth, window.innerHeight );
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.getElementById("canvas").appendChild( labelRenderer.domElement );

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


// origins
const grid_origin = v3( -N * N * spacing / 2 - N * spacing, 0.0, 0.0);

// Position grid
// 2d outer device grid
// 2d inner shard grid
function multiGrid(origin, num, delta, ioffset, inum, idelta) {
  let outer_rows = empty([num.x, num.y]).indexMap( 
    ([i, j]) => add(origin, mul(v3(i, num.y-j, 0), delta)))
    .toArray();
  let rows = empty([num.x, num.y, inum.x, inum.y]).indexMap( 
    ([i, j, k ,l]) => add(add(outer_rows[i][j], ioffset), 
                          mul(v3(k, inum.y-l, 0), idelta)))
    .toArray();
  return [outer_rows, rows];
}

const [device_posns, shard_posns] = multiGrid(
  grid_origin,
  v3(N, 1, 0),  // outer numbers
  v3((N+3)*spacing, (N+3)*spacing, 0),  // outer delta
  v3(spacing, -(N+1)*spacing, 0),  // offset into inner grid
  v3(1, N, 0),  // inner numbers
  v3(spacing, spacing, 0),  // inner delta
  );


// Drawn elements

// device boxes
let devices = empty([device_posns.length, device_posns[0].length])
    .indexMap( ([i, j]) => new Box(device_posns[i][j],
                                v3( (N+2)*spacing, (N+2)*spacing,0),
                                grey, 0.0, scene)).toArray();
// shards
let shards = empty([N, N]).toArray();
for(let n = 0; n < N; n++) {
  shards[n][n] = new Box(
    sub(shard_posns[N/2][0][0][n], v3( N * spacing/2,0,0)),
    v3( N*spacing, spacing, 0),
    black, 0.0, scene);
}

// shard colors
const clrs = [];
for(let n = 0; n < N; n++) {
  clrs.push(hsl_color(n / (N-1) * 4/5, 0.9, 0.5));
}


const x_delta = sub(shard_posns[1][0][0][0],
                    shard_posns[0][0][0][0]);
const z_delta = v3(0,0,.1);

// Edge condition: white blocks to mask R/L edge shards moving.
new Box(add(add(device_posns[N-1][0], x_delta), z_delta),
        v3( (N+2)*spacing, (N+2)*spacing, 0 ),
        white, 1.0, scene);
new Box(add(sub(device_posns[0][0], x_delta), z_delta),
        v3( (N+2)*spacing, (N+2)*spacing, 0 ),
        white, 1.0, scene);

let pos = add(device_posns[N/2][0], v3(0,2,0));

// expository caption above graphics
const caption = new Label(pos, "", "3em", black, 0.0, scene);


// Main Animation

let disappearing_box, left_boundary, right_boundary;

let t = 0.0;

caption.toText("All Gather", t).toOpacity(1.0, t, 4*tick);

t += 8*tick;

caption.toText("we have an array", t).toOpacity(1.0, t, 4*tick);

for(let n = 0; n < N; n++) { shards[n][n].toOpacity(1.0, t); }

t += 4*tick;

// reveal shards
caption.toText("we have a <i>sharded</i> array", t);

for(let n = 0; n < N; n++) {
  shards[n][n].toColor(clrs[n], t, 2*tick);
}

t += 8*tick;

// move shards to devices, reveal devices

caption.toText("distributed across devices", t);

for(let n = 0; n < N; n++) {
  shards[n][n].toPosition(shard_posns[n][0][0][n], t, 4*tick);
  devices[n][0].toOpacity(1.0, t, 4*tick);
}

// label devices
for(let i = 0; i < device_posns.length; i++) {
  const y_delta = v3( 1*spacing, 2*spacing,0);
  let foo = new Text(
    add(device_posns[i][0], y_delta), `${i}`, 0.2, black, 0.0, scene)
    .toOpacity(1.0, t, 4*tick);
}

t+=8*tick; caption.toText("we'd like the full copy on each device", t);
t+=4*tick; caption.toText("this requires copying shards across devices", t);
t+=4*tick; caption.toText("in N/2 bidirectional data transfers", t);

// Allgather: N / 2 bidirectional toroidal shifts
for(let p = 0; p < N/2; p++) {
  // Forward Shifts
  for(let n = 0; n < N; n++) {
    let fwd = mod(n + 1, N);
    let last = mod(n - p, N);
    if(n != N-1) {
      shards[fwd][last] = shards[n][last]
          .clone(true, t)
          .toPosition(shard_posns[fwd][0][0][last], t, 4*tick);
    }
    // Boundary condition handling for rightmost transfer
    else {
      // vanish to right
      right_boundary = add(shard_posns[n][0][0][last], x_delta);
      disappearing_box = shards[n][last]
          .clone(true, t)
          .toPosition(right_boundary, t, 4*tick);
      // appear from left edge
      left_boundary = sub(shard_posns[fwd][0][0][last], x_delta);
      shards[fwd][last] = shards[n][last]
          .clone(true, t)
          .toPosition(left_boundary, t, 0.0)
          .toPosition(shard_posns[fwd][0][0][last], t, 4*tick);
    }
  }

  // optional, stagger bidirectional transfer, but reality is bidirectional
  // t+=4*tick;

  // Backwards Shifts
  if( p != N/2-1) {  // last allgather only needs forward shift.
    for(let n = 0; n < N; n++) {
      let bwd = mod(n - 1, N);
      let last = mod(n + p, N);
      if(n != 0) {
        shards[bwd][last] = shards[n][last]
            .clone(true, t)
            .toPosition(shard_posns[bwd][0][0][last], t, 4*tick);
      }
      // Boundary condition handling for leftmost transfer
      else {
        // vanish to left
        left_boundary = sub(shard_posns[n][0][0][last], x_delta);
        disappearing_box = shards[n][last]
            .clone(true, t)
            .toPosition(left_boundary, t, 4*tick);
        // appear from right edge
        right_boundary = add(shard_posns[bwd][0][0][last], x_delta);
        shards[bwd][last] = shards[n][last]
            .clone(true, t)
            .toPosition(right_boundary, t, 0.0)
            .toPosition(shard_posns[bwd][0][0][last], t, 4*tick);
      }
    }
  }

  t+=4*tick;
}

caption.toText("all devices now have a full copy of the array", t);


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
  "allgather.webm",         // save filename
  "video/webm"              // save format
  );
