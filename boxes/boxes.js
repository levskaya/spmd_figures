import { gsap } from '/external/gsap/all.js';
import * as THREE from 'three';
import { CSS2DRenderer } from '/external/three/CSS2DRenderer.js';
import { Box, Rect, Text, Label } from '/lib/boxpusher.js';
import { v3, add, sub, mul, mod} from '/lib/vectors.js';
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
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  logarithmicDepthBuffer: true,
  // localClippingEnabled: false,
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("canvas").appendChild( renderer.domElement );

// CSS Element Render
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize( window.innerWidth, window.innerHeight );
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.getElementById("canvas").appendChild( labelRenderer.domElement );

// Animation Constants

// we assume an even number
const N = 3;

// grid spacing
const spacing = 0.125;

// Cameras
const frustumSize = 2 * N;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(
	/*fov*/    45,
	/*aspect*/ aspect,
	/*near*/   0.01,
	/*far*/    40);

// camera.position.set( 0, 0, 10 );
// camera.lookAt(0, 0, 0);
let pos = v3(10*Math.sin(1), 4, 10*Math.cos(1));
camera.position.set(...pos);
camera.lookAt(v3(0,0,0));


const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );

// origins
const grid_origin = v3( 0.0, 0.0, 0.0);

// Position grid
// 2d outer device grid
const outer_sizes = v3(N, N, N);
const outer_delta = v3((N+3)*spacing, (N+3)*spacing, (N+3)*spacing);

let device_posns = empty([outer_sizes.x, outer_sizes.y, outer_sizes.z]).indexMap( 
  ([i, j, k]) => add(grid_origin, mul(v3(i, outer_sizes.y-j, k), outer_delta)))
  .toArray();

// 2d inner shard grid
const inner_offset = v3(spacing, -(N+1)*spacing, -spacing);  // offset into inner grid
const inner_sizes = v3(N, N, N);
const inner_delta = v3(spacing*1.1, spacing*1.1, spacing*1.1);

let shard_posns = empty([outer_sizes.x, outer_sizes.y, outer_sizes.z,
                         inner_sizes.x, inner_sizes.y, inner_sizes.z])
    .indexMap( 
        ([i, j, k, l, m, n]) => add(add(device_posns[i][j][k], inner_offset), 
                                    mul(v3(l, inner_sizes.y-m, n), inner_delta)))
    .toArray();

console.log(shard_posns);

// Drawn elements

// trouble as-is, need to convert to wireframe?

// let devices = fromArray(device_posns).map( 
//       posn => new Box(posn, 
//                       v3((N+2)*spacing, (N+2)*spacing, (N+2)*spacing), // size
//                       grey, 0.1, scene)
//   ).toArray();

// starting shards in center device position
let shards = empty([N, N, N]).indexMap(
  ([i, j, k]) => {
    let idx = i*N*N + j*N + k;
    let clr = hsl_color(idx / (N*N*N-1) * 4/5, 0.9, 0.5);
    return new Box(shard_posns[1][1][1][i][j][k], 
            v3(spacing, spacing, spacing),
            clr, 1.0, scene)
    }
).toArray();

// shard colors
const clrs = empty([N])
             .indexMap( ([n]) => hsl_color(n / (N-1) * 4/5, 0.9, 0.5) )
             .toArray();

let camera_timeline = gsap.timeline();

let t = 0.0;
const tick = 1.0;

// bleh, flickering, unstable transparency w. camera angle, 
// known issue, sigh.... wtf I thought this was what z-buffers were for, lol.
// https://github.com/mrdoob/three.js/pull/24271

// for(let n = 0; n < 1000; n++) {
//   let pos = v3(10*Math.sin(t), 4, 10*Math.cos(t));
//   camera_timeline.to(camera.position, {...pos, duration: 0.0}, t);
//   camera_timeline.call(camera => {
//     camera.lookAt(v3(0,0,0));
//   }, [camera], t);
//   t += 0.01;
// }


// fromArray(shards).indexedMap(
//   ([i, j, k], shard) => shard.toPosition(shard_posns[i][j][k][i][j][k], 0.0, tick)
// );

// t+=tick;

for(let foo = 0; foo < 10; foo++) {

let inc_I = 0; 
let inc_J = 0; 
let inc_K = 0;
for(let m = 0; m < 3; m++) {
  let inc_i = 0; 
  let inc_j = 0; 
  let inc_k = 0;  
  for(let n = 0; n < 3; n++) {
    fromArray(shards).indexedMap(
    ([i, j, k], shard) => {
        let next_I = mod(i + inc_I, N);
        let next_J = mod(j + inc_J, N);
        let next_K = mod(k + inc_K, N);  
        let next_i = mod(i + inc_i, N);
        let next_j = mod(j + inc_j, N);
        let next_k = mod(k + inc_k, N);
        shard.toPosition(shard_posns[next_I][next_J][next_K][next_i][next_j][next_k], 
                         t, tick)
    });
    inc_i+=1;
    inc_j+=1;
    inc_k+=1;
    t += tick;
  }
  inc_I+=1;
  inc_J+=1;
  inc_K+=1;
}
}

// Animation Loop
function animation(time) {
    renderer.render( scene, camera );
    labelRenderer.render( scene, camera );
}
renderer.setAnimationLoop(animation);


// Capture and Control UI

// capture_and_control_ui(
//   "controls",               // control div id
//   t + 4 * tick,             // animation time in seconds
//   "allgather.webm",         // save filename
//   "video/webm"              // save format
//   );
