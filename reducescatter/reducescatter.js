import { gsap } from '/external/gsap/all.js';
import * as THREE from 'three';
import { CSS2DRenderer } from '/external/three/CSS2DRenderer.js';
import { capture_and_control_ui } from '/lib/control_ui.js';
import { Rect, Text, Label } from '/lib/boxpusher.js';
import { v3, add, sub, mul, mod} from '/lib/vectors.js';
import { empty, fromArray } from '/lib/nd.js';
// import { fromArray } from '../lib/nd';

// debug
window.THREE = THREE;
window.gsap = gsap;

// Colors
const red = new THREE.Color(0.99, 0., 0.);
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
const grid_origin = v3( -N * N * spacing / 2 - N * spacing,  0.0,  0.0);

// Position grid
// 2d outer device grid
const outer_sizes = v3(N, 1, 0);
const outer_delta = v3((N+3)*spacing, (N+3)*spacing, 0);

let device_posns = empty([outer_sizes.x, outer_sizes.y]).indexMap( 
  ([i, j]) => add(grid_origin, mul(v3(i, outer_sizes.y-j, 0), outer_delta)))
  .toArray();

// 2d inner shard grid
const inner_offset = v3(spacing, -(N+1)*spacing, 0);  // offset into inner grid
const inner_sizes = v3(1, N, 0);
const inner_delta = v3(spacing, spacing, 0);

let shard_posns = empty([outer_sizes.x, outer_sizes.y, inner_sizes.x, inner_sizes.y])
    .indexMap( 
        ([i, j, k ,l]) => add(add(device_posns[i][j], inner_offset), 
                              mul(v3(k, inner_sizes.y-l, 0), inner_delta)))
    .toArray();

// Simplify indexing as devices only range over x-axis and shards over y-axis.
device_posns = fromArray(device_posns).squeeze().toArray();  // now 1D
shard_posns = fromArray(shard_posns).squeeze().toArray();    // now 2D


// Drawn elements

// device boxes
let devices = fromArray(device_posns).map( 
    posn => new Rect(
      posn, v3((N+2)*spacing, (N+2)*spacing, 0), grey, 0.0, scene))
    .toArray();

// shards
let shards = fromArray(shard_posns).map(
    posn => new Rect(
        posn, v3(N*spacing, spacing, 0), red, 0.0, scene))
    .toArray()

// shard colors
const clrs = empty([N])
             .indexMap( ([n]) => hsl_color(n / (N-1) * 4/5, 0.9, 0.5) )
             .toArray();

// delta-x increment to move shards across device boxes
const x_delta = sub(shard_posns[1][0], shard_posns[0][0]);

// Edge condition masks: white blocks to mask R/L edge shards moving.
new Rect(add(add(device_posns[N-1], x_delta), v3(0, 0, .1)),
        v3((N+2)*spacing, (N+2)*spacing, 0),
        white, 1.0, scene);
new Rect(add(sub(device_posns[0], x_delta), v3(0, 0, .1)),
        v3((N+2)*spacing, (N+2)*spacing, 0),
        white, 1.0, scene);

// expository caption
const caption = new Label(
    add(device_posns[N/2], v3(0,2,0)),
    "", "3em", black, 0.0, scene);


// Main Animation


let left_boundary, right_boundary;

let t = 0.0;

caption.toText("Reduce Scatter", t).toOpacity(1.0, t, 4*tick);

t+=2*tick;

for(let i = 0; i < N; i++) {
  for(let j = 0; j < N; j++) {
    shards[i][j].toOpacity(1.0 / N, t);
  }
}

t+=2*tick;

for(let i = 0; i < device_posns.length; i++) {
  devices[i].toOpacity(1.0, t, 4*tick);
  const y_delta = v3( 1*spacing,  2*spacing, 0);
  new Text(add(device_posns[i], y_delta), 
           `${i}`, 0.2, black, 0.0, scene)
      .toOpacity(1.0, t, 4*tick);
}

t+=2*tick;

for(let i = 0; i < N; i++) {
  for(let j = 0; j < N; j++) {
    shards[i][j].toColor(clrs[j], t, 2*tick);
  }
}

t+= 2*tick;
t+= 2*tick;

const rs_dur = 8*tick;
// to center "+" symbols over shard during reduction
const shard_center_offset = v3( N*spacing/2,  -spacing - 0.05,  0.1);

for(let p = 0; p < N/2; p++) {
  for(let n = 0; n < N; n++) {
    let fwd = mod(n + 1, N);
    let which = mod(n + N/2 - p, N);
    if(n != N-1) {
      shards[n][which].toPosition(shard_posns[fwd][which], t, rs_dur)
                      .toOpacity(0.0, t + rs_dur, 0);
      shards[fwd][which].toOpacity( Math.pow(2, p+1) / Math.pow(2, N/2), t+rs_dur, 0);
    }
    else {
      right_boundary = add(shard_posns[n][which], x_delta);
      left_boundary = sub(shard_posns[fwd][which], x_delta);

      shards[n][which].toPosition(right_boundary, t, rs_dur);
      shards[n][which].clone(true, t).toPosition(left_boundary, t, 0.0)
                                     .toPosition(shard_posns[fwd][which], t, rs_dur)
                                     .toOpacity(0.0, t + rs_dur, 0);
      shards[fwd][which].toOpacity( Math.pow(2, p+1) / Math.pow(2, N/2), t + rs_dur, 0);
    }
    let plus = new Text(add(shard_posns[fwd][which], shard_center_offset), '+', 0.25, black, 0.0, scene)
                    .toOpacity(1.0, t + rs_dur*0.8, 0.2 * rs_dur)
                    .toOpacity(0.0, t + rs_dur, 0.2 * rs_dur);
  }

  if( p != N/2-1) {
    for(let n = 0; n < N; n++) {
      let bwd = mod(n - 1, N);
      let which = mod(n + N/2 + 1 + p, N);
      if(n != 0) {
        shards[n][which]
            .toPosition(shard_posns[bwd][which], t, rs_dur)
            .toOpacity(0.0, t + rs_dur, 0);
        shards[bwd][which]
            .toOpacity( Math.pow(2, p+1) / Math.pow(2, N/2), t + rs_dur, 0);
      }
      else {
        left_boundary = sub(shard_posns[n][which], x_delta);
        right_boundary = add(shard_posns[bwd][which], x_delta);

        shards[n][which].toPosition(left_boundary, t, rs_dur);
        shards[n][which]
            .clone(true, t)
            .toPosition(right_boundary, t, 0.0)
            .toPosition(shard_posns[bwd][which], t, rs_dur)
            .toOpacity(0.0, t + rs_dur, 0);
        shards[bwd][which].toOpacity( Math.pow(2, p+1) / Math.pow(2, N/2), t + rs_dur, 0);
      }
    let plus = new Text(add(shard_posns[bwd][which], shard_center_offset), '+', 0.25, black, 0.0, scene)
                    .toOpacity(1.0, t + rs_dur*0.8, 0.2 * rs_dur)
                    .toOpacity(0.0, t + rs_dur, 0.2 * rs_dur);
    }
  }

  t+=rs_dur;
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
  "reduce_scatter.webm",    // save filename
  "video/webm"              // save format
  );
