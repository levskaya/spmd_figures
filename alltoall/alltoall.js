import { gsap } from '/external/gsap/all.js';
import * as THREE from 'three';
import { CSS2DRenderer } from '/external/three/CSS2DRenderer.js';
import { Rect, Text, Label } from '/lib/boxpusher.js';
import { v3, add, sub, mul, mod, scale} from '/lib/vectors.js';
import { fromArray, empty } from '/lib/nd.js';
import { capture_and_control_ui } from '/lib/control_ui.js';
// import { fromArray } from '../lib/nd';

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
const outer_sizes = v3(N, 1, 0);
const outer_delta = v3((N+3)*spacing, (N+3)*spacing, 0);

let device_posns = empty([outer_sizes.x, outer_sizes.y]).indexMap(
  ([i, j]) => add(grid_origin, mul(v3(i, outer_sizes.y-j, 0), outer_delta)))
  .toArray();

// 2d inner shard grid
const inner_offset = v3(spacing - 0.08, -(N+1)*spacing, 0);  // offset into inner grid
const inner_sizes = v3(N, N, 0);
const inner_delta = v3(spacing + 0.02, spacing, 0);

let shard_posns = empty([outer_sizes.x, outer_sizes.y, inner_sizes.x, inner_sizes.y])
    .indexMap(
        ([i, j, k, l]) => add(add(device_posns[i][j], inner_offset),
                              mul(v3(l, inner_sizes.y - k, 0), inner_delta)))
    .toArray();

// let shard_posns_T = empty([outer_sizes.x, outer_sizes.y, inner_sizes.x, inner_sizes.y])
//     .indexMap(
//         ([i, j, k, l]) => add(add(device_posns[k][j], inner_offset),
//                               mul(v3(k, inner_sizes.x - i, 0), inner_delta)))
//     .toArray();

// Simplify indexing as devices only range over x-axis and shards over y-axis.
device_posns = fromArray(device_posns).squeeze().toArray();  // now 1D
shard_posns = fromArray(shard_posns).squeeze().toArray();    // now 2D
// shard_posns_T = fromArray(shard_posns_T).squeeze().toArray();    // now 2D


// Drawn elements

let devices = fromArray(device_posns).map(
      posn => new Rect(posn,
                      v3((N+2)*spacing, (N+2)*spacing, 0), // size
                      grey, 0.0, scene)
  ).toArray();

// starting shards in center device position
let shards = empty([N, N]).toArray();
for(let n = 0; n < N; n++) {
  for(let m = 0; m < N; m++) {
      shards[n][m] = new Rect(
      sub(shard_posns[N/2][0][N/2], v3( (N-1-m) * spacing, n * spacing, 0)),
      v3( spacing, spacing, 0),
      black, 0.0, scene);
  }
}

// shard colors
const clrs = empty([N])
             .indexMap( ([n]) => hsl_color(n / (N-1) * 4/5, 0.9, 0.5) )
             .toArray();

const x_delta = sub(shard_posns[1][0][0], shard_posns[0][0][0]);
// const x_delta = v3(spacing, 0, 0);
// const y_delta = v3(0, spacing, 0);
const z_delta = v3(0, 0, .1);

// Edge Masks: white blocks to mask R/L edge shards moving.
new Rect(add(add(device_posns[N-1], x_delta), z_delta),
        v3( (N+2)*spacing, (N+2)*spacing, 0 ),
        white, 1.0, scene);
new Rect(add(sub(device_posns[0], x_delta), z_delta),
        v3( (N+2)*spacing, (N+2)*spacing, 0 ),
        white, 1.0, scene);

// expository caption above graphics
const caption = new Label(
  add(device_posns[N/2], v3(0,2,0)),
  "", "3em", black, 0.0, scene);


// Main Animation

let disappearing_box, left_boundary, right_boundary;

let t = 0.0;

caption.toText("All to All", t).toOpacity(1.0, t, 4*tick);

t += 8*tick;

// caption.toText("we have an array", t).toOpacity(1.0, t, 4*tick);

for(let n = 0; n < N; n++) {
  for(let m = 0; m < N; m++) {
      shards[n][m].toOpacity(1.0, t);
  }
}

// t += 4*tick;

// reveal shards
// caption.toText("we have a <i>sharded</i> array", t);

for(let n = 0; n < N; n++) {
  for(let m = 0; m < N; m++) {
     shards[n][m].toColor(clrs[n], t, 2*tick);
  }
}

t += 8*tick;

// move shards to devices, reveal devices

// caption.toText("distributed across devices", t);

let cur_posns = empty([inner_sizes.x, inner_sizes.y]).toArray();
let final_posns = empty([inner_sizes.x, inner_sizes.y]).toArray();
let cur_idx = empty([inner_sizes.x, inner_sizes.y]).toArray();
let final_idx = empty([inner_sizes.x, inner_sizes.y]).toArray();

for(let n = 0; n < N; n++) {
  for(let m = 0; m < N; m++) {
    shards[n][m].toPosition(shard_posns[n][n][m], t, 4*tick);
    cur_posns[n][m] = shard_posns[n][n][m];
    cur_idx[n][m] = n;
    final_posns[n][m] = shard_posns[m][n][m];
    final_idx[n][m] = m;
    devices[n].toOpacity(1.0, t, 4*tick);
  }
}



// label devices
for(let i = 0; i < device_posns.length; i++) {
  const y_delta = v3( 1*spacing, 2*spacing,0);
  let foo = new Text(
    add(device_posns[i], y_delta), `${i}`, 0.2, black, 0.0, scene)
    .toOpacity(1.0, t, 4*tick);
}


t += 4*tick;

// for(let n = 0; n < N; n++) {
//   for(let m = 0; m < N; m++) {
//     shards[n][m].toPosition(final_posns[n][m], t, 4*tick);
//   }
// }

function close(a, b){
  let delta = sub(b, a);
  return delta.length() < 1e-6;
}

const step_done = Symbol("step_done");
const step_right = Symbol("step_right");
const step_left = Symbol("step_left");



// A2A
// shard_posns[n][n][m] // INITIAL
// shard_posns[m][n][m] // FINAL


function step_data(start, stop) {
  let right_len = mod(stop - start, N);
  let left_len = mod(start - stop, N);
  if(right_len == 0) {
    // [next, status, right overflow, left overflow]
    return [start, step_done, false, false];
  }
  else if(right_len <= left_len) {
    let next = mod(start + 1, N);
    return [next, step_right, next < start, false];
  }
  else {
    let next = mod(start - 1, N);
    return [next, step_left, false, next > start];
  }
}


for(let step = 0; step < N/2; step++) {
  for(let n = 0; n < N; n++) {
    for(let m = 0; m < N; m++) {
      let cur = cur_idx[n][m];
      let dest = final_idx[n][m];
      let [next, status, right_overflow, left_overflow] = step_data(cur, dest);
      cur_idx[n][m] = next;
      if(status == step_right) {
        if(right_overflow) {
          shards[n][m].clone(true, t).toPosition(add(shard_posns[cur][n][m], x_delta), t, 4*tick);
          shards[n][m].toPosition(sub(shard_posns[next][n][m], x_delta), t, 0)
                      .toPosition(shard_posns[next][n][m], t, 4*tick);
        } else {
          shards[n][m].toPosition(shard_posns[next][n][m], t, 4*tick);
        }
      } else if(status == step_left) {
        if(left_overflow) {
          shards[n][m].clone(true, t).toPosition(sub(shard_posns[cur][n][m], x_delta), t, 4*tick);
          shards[n][m].toPosition(add(shard_posns[next][n][m], x_delta), t, 0)
                      .toPosition(shard_posns[next][n][m], t, 4*tick);
        } else {
          shards[n][m].toPosition(shard_posns[next][n][m], t, 4*tick);
        }
      }
    }
  }
  t += 4*tick;
}


// for(let step = 0; step < N/2; step++) {
//   let n = 1;
//   for(let m = 0; m < N/2; m++) {
//     if(!close(cur_posns[n][m], final_posns[n][m])) {
//       cur_posns[n][m] = shard_posns[mod(n+step, N)][n][m];
//       shards[n][m].toPosition(cur_posns[n][m], t, 4*tick);
//     }
//   }
//   t += 4*tick;
// }

// t += 8*tick;
// for(let n = 0; n < N; n++) {
//   for(let m = 0; m < N; m++) {
//     shards[n][m].toPosition(shard_posns[m][n][m], t, 16*tick);
//   }
// }
// t += 8*tick;

// t+=8*tick; caption.toText("we'd like the full copy on each device", t);
// t+=4*tick; caption.toText("this requires copying shards across devices", t);
// t+=4*tick; caption.toText("in N/2 bidirectional data transfers", t);

// reference
// t += 4*tick;
// for(let p = 0; p < N/2; p++) {
//     for(let m = p+1; m < N/2; m++) {
//       shards[0][m].toPosition(shard_posns[mod(N-p-1, N)][0][N-m], t, 4*tick);
//     }
//     for(let m = p; m < N/2; m++) {
//       shards[0][N/2+m].toPosition(shard_posns[p+1][0][m+1], t, 4*tick);
//     }
//   t+=4*tick;
// }

// Allgather: N / 2 bidirectional toroidal shifts
// for(let p = 0; p < N/2; p++) {
//   // Forward Shifts
//   for(let n = 0; n < N; n++) {
//     let fwd = mod(n + 1, N);
//     let last = mod(n - p, N);
//     if(n != N-1) {
//       shards[fwd][last] = shards[n][last]
//           .clone(true, t)
//           .toPosition(shard_posns[fwd][last], t, 4*tick);
//     }
//     // Boundary condition handling for rightmost transfer
//     else {
//       // vanish to right
//       right_boundary = add(shard_posns[n][last], x_delta);
//       disappearing_box = shards[n][last]
//           .clone(true, t)
//           .toPosition(right_boundary, t, 4*tick);
//       // appear from left edge
//       left_boundary = sub(shard_posns[fwd][last], x_delta);
//       shards[fwd][last] = shards[n][last]
//           .clone(true, t)
//           .toPosition(left_boundary, t, 0.0)
//           .toPosition(shard_posns[fwd][last], t, 4*tick);
//     }
//   }

//   // optional, stagger bidirectional transfer, but reality is bidirectional
//   // t+=4*tick;

//   // Backwards Shifts
//   if( p != N/2-1) {  // last allgather only needs forward shift.
//     for(let n = 0; n < N; n++) {
//       let bwd = mod(n - 1, N);
//       let last = mod(n + p, N);
//       if(n != 0) {
//         shards[bwd][last] = shards[n][last]
//             .clone(true, t)
//             .toPosition(shard_posns[bwd][last], t, 4*tick);
//       }
//       // Boundary condition handling for leftmost transfer
//       else {
//         // vanish to left
//         left_boundary = sub(shard_posns[n][last], x_delta);
//         disappearing_box = shards[n][last]
//             .clone(true, t)
//             .toPosition(left_boundary, t, 4*tick);
//         // appear from right edge
//         right_boundary = add(shard_posns[bwd][last], x_delta);
//         shards[bwd][last] = shards[n][last]
//             .clone(true, t)
//             .toPosition(right_boundary, t, 0.0)
//             .toPosition(shard_posns[bwd][last], t, 4*tick);
//       }
//     }
//   }

//   t+=4*tick;
// }

// caption.toText("all devices now have a full copy of the array", t);


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
