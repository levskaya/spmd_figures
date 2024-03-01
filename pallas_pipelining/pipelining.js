import * as THREE from 'three';
import { CSS2DRenderer } from '/libs/three/CSS2DRenderer.js';
import { Box, Text, Label } from './boxpusher.js';
import * as nd from './nd.js';
import { mod, neg3, add3, sub3, scalar3 } from './nd.js';
import { gsap } from '/libs/gsap/all.js';

// debug
window.THREE = THREE;
window.gsap = gsap;

// Colors
const teal = new THREE.Color(0, 0.86, 0.99);
const lightgreen = new THREE.Color(0.7, 0.9, 0.7);
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
scene.background = null; //new THREE.Color(0x000000, 0.0);

// Corresponds to background SVG dims.
const WinH = 1000.0;
const WinW = 918.33;

// WebGL Render
const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
renderer.setSize(WinW, WinH);
//document.body.appendChild(renderer.domElement);
document.getElementById("downloadControls").prepend( renderer.domElement );

// CSS Element Render
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(WinW, WinH);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
// document.body.appendChild( labelRenderer.domElement );
document.getElementById("downloadControls").prepend( labelRenderer.domElement );


// Cameras
// Orthographic
const camera = new THREE.OrthographicCamera(
  /*left*/   0,
  /*right*/  WinW,
  /*top*/    0,
  /*bottom*/ WinH,
  /*near*/   0.0,
  /*far*/    1.0);
camera.position.z = 1.0;


// Number of "packets" is N * N
const N = 4;

// spacing
const spacing = 10.0;
const box_size = {x: 0.95*spacing, y: 0.95*spacing};

// unit vectors
const dx = {x:spacing, y:0, z:0};
const dy = {x:0, y:spacing, z:0};
const dz = {x:0, y:0, z: spacing};

// HBM coordinates
const x_hbm = {x: 70.0, y: 610.0, z: 0.0};
const y_hbm = {x: 200.0, y: 610.0, z: 0.0};
const z_hbm = {x: 330.0, y: 610.0, z: 0.0};

// VMEM coordinates
const x_vmem = {x: 275.0, y: 360.0, z: 0.0};
const y_vmem = {x: 390.0, y: 360.0, z: 0.0};
const z_vmem = {x: 505.0, y: 360.0, z: 0.0};

// VREG coordinates
const x_vreg = {x: 350.0, y: 240.0, z: 0.0};
const y_vreg = {x: 400.0, y: 240.0, z: 0.0};
const z_vreg = {x: 450.0, y: 240.0, z: 0.0};

// Vector Core coordinates
const vector_core = {x: 410.0, y: 110.0, z: 0.0};

// push 0 and 1 halves apart visually
const x0_hbm = nd.add3(nd.scalar3(-0.5, dx), x_hbm);
const y0_hbm = nd.add3(nd.scalar3(-0.5, dx), y_hbm);
const z0_hbm = nd.add3(nd.scalar3(-0.5, dx), z_hbm);
const x1_hbm = nd.add3(nd.scalar3(N + 0.5, dx), x_hbm);
const y1_hbm = nd.add3(nd.scalar3(N + 0.5, dx), y_hbm);
const z1_hbm = nd.add3(nd.scalar3(N + 0.5, dx), z_hbm);
const x0_vmem = nd.add3(nd.scalar3(-0.5, dx), x_vmem);
const y0_vmem = nd.add3(nd.scalar3(-0.5, dx), y_vmem);
const z0_vmem = nd.add3(nd.scalar3(-0.5, dx), z_vmem);
const x1_vmem = nd.add3(nd.scalar3(N + 0.5, dx), x_vmem);
const y1_vmem = nd.add3(nd.scalar3(N + 0.5, dx), y_vmem);
const z1_vmem = nd.add3(nd.scalar3(N + 0.5, dx), z_vmem);


// grid positions
function make_grid(origin) {
  return nd.empty([4, 4])
    .indexMap( ([i, j]) => ({x: i, y: j, z: 0}) )
    .scalar3(spacing)
    .add3(origin).arr;
}

// grid of "packet" boxes
function make_boxes(origin, color, opacity=1.0) {
  return nd.map(
    val => new Box(nd.fromArray(val).arr, box_size, color, opacity, scene),
  make_grid(origin));
}

// shove packets along a path
function push_packets(boxes, start, end, t0, tick, tick_skew=null) {
  tick_skew = tick_skew !== null ? tick_skew : tick;
  let t = t0;
  let grid0 = make_grid(start);
  let grid1 = make_grid(end);
  let shape = nd.shape(boxes);
  for(let i = 0; i < shape[0]; i++) {
    for(let j = 0; j < shape[1]; j++) {
      let delta = nd.fromArray(grid0[i][j]).sub3(grid1[i][j]);
      let x0 = nd.fromArray(grid0[i][j]);
      let x1 = x0.add3({x:0, y: delta.arr.y/2.0, z:0}).arr;
      let x2 = x0.add3({x:delta.arr.x, y: delta.arr.y/2.0, z:0}).arr;
      let x3 = nd.fromArray(grid1[i][j]).arr;
      boxes[i][j].toPosition(x1, t + tick, tick);
      boxes[i][j].toPosition(x2, t + tick * 2, tick);
      boxes[i][j].toPosition(x3, t + tick * 3, tick);
      t += tick_skew;
    }
  }
  return t;
  // add delay until last box movement has finished.
  //return boxes[shape[0]-1][shape[1]-1].timeline.endTime();
}


let X0s = make_boxes(x0_hbm, red);
let X1s = make_boxes(x1_hbm, red);
let Y0s = make_boxes(y0_hbm, green);
let Y1s = make_boxes(y1_hbm, green);

let Z0s = make_boxes(vector_core, blue, 0.0);
let Z1s = make_boxes(vector_core, blue, 0.0);


// Main Animation
let tick = 0.1;
let hbm_tick = 3 * tick;
let vmem_tick = 1 * tick;
let vpu_tick = 0.5 * tick;

let t0 = 0.0;
let t1 = push_packets(X0s, x0_hbm, x0_vmem, t0, hbm_tick);
let t2 = push_packets(Y0s, y0_hbm, y0_vmem, t1, hbm_tick);
let t3 = push_packets(X1s, x1_hbm, x1_vmem, t2, hbm_tick);
let t4 = push_packets(Y1s, y1_hbm, y1_vmem, t3, hbm_tick);

let t5 = push_packets(X0s, x0_vmem, x_vreg, t2, vmem_tick);
let t6 = push_packets(Y0s, y0_vmem, y_vreg, t5, vmem_tick);

let t7 = push_packets(X0s, x_vreg, vector_core, t6, vpu_tick);
         push_packets(Y0s, y_vreg, vector_core, t6, vpu_tick);

// hide green/red, reveal blue
nd.map((b) => b.toOpacity(0.0, t7, tick*0.1), X0s);
nd.map((b) => b.toOpacity(0.0, t7, tick*0.1), Y0s);
nd.map((b) => b.toOpacity(1.0, t7, tick*0.1), Z0s);

let t8 = push_packets(Z0s, vector_core, z_vreg, t7, vpu_tick);
let t9 = push_packets(Z0s, z_vreg, z0_vmem, t8, vpu_tick);
let t10 = push_packets(Z0s, z0_vmem, z0_hbm, Math.max(t9, t4), hbm_tick);

let t11 = push_packets(X1s, x1_vmem, x_vreg, Math.max(t4, t9), vmem_tick);
let t12 = push_packets(Y1s, y1_vmem, y_vreg, Math.max(t11, t4 + 4*hbm_tick), vmem_tick);
let t13 = push_packets(X1s, x_vreg, vector_core, t12, vpu_tick);
          push_packets(Y1s, y_vreg, vector_core, t12, vpu_tick);

// hide green/red, reveal blue
nd.map((b) => b.toOpacity(0.0, t13, tick*0.1), X1s);
nd.map((b) => b.toOpacity(0.0, t13, tick*0.1), Y1s);
nd.map((b) => b.toOpacity(1.0, t13, tick*0.1), Z1s);

let t14 = push_packets(Z1s, vector_core, z_vreg, t13, vpu_tick);
let t15 = push_packets(Z1s, z_vreg, z1_vmem, t14, vpu_tick);
let t16 = push_packets(Z1s, z1_vmem, z1_hbm, Math.max(t15, t10), hbm_tick);

// duration of root gsap timeline (total length of scheduled animations)
let finalTime = gsap.globalTimeline.endTime();
console.log(`Animation lasts ${finalTime} seconds.`);

// Animation Loop
function animation(time) {
    renderer.render( scene, camera );
    labelRenderer.render( scene, camera );
}
renderer.setAnimationLoop(animation);

// by default, globalTimeline removes finished children animations, which
// prevents us from seeking across the timeline correctly.
gsap.globalTimeline.autoRemoveChildren = false;

// halt at start
// gsap.globalTimeline.seek(0);
// gsap.globalTimeline.pause();


// record via screencapture

function wait(delayInMS) {
  return new Promise((resolve) => setTimeout(resolve, delayInMS));
}

function startRecording(stream, lengthInMS) {
  let recorder = new MediaRecorder(stream);
  let data = [];

  recorder.ondataavailable = (event) => data.push(event.data);
  recorder.start();
  console.log(`${recorder.state} for ${lengthInMS / 1000} seconds…`);

  let stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = (event) => reject(event.name);
  });
  let recorded = wait(lengthInMS).then(() => {
    if (recorder.state === "recording") {
      recorder.stop();
    }
  });

  gsap.globalTimeline.play();

  return Promise.all([stopped, recorded]).then(() => data);
}

const capture = () => {
  // reset animation state, pause until screen capture clickthrough.
  gsap.globalTimeline.seek(0);
  gsap.globalTimeline.pause();
  // capture options
  const getDisplayMediaOptions = {
    audio: false,             // no audio stream
    preferCurrentTab: true,   // pick this tab
    displaySurface: "window", // only do window capture
  };
  navigator.mediaDevices.getDisplayMedia(getDisplayMediaOptions).then((stream) => {
    // use duration of root gsap timeline (total length of scheduled animations)
    return startRecording(stream, finalTime * 1000 + 500);
  })
  .then((recordedChunks) => {
    let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
    // let recordedBlob = new Blob(recordedChunks, { type: "video/mp4;codecs=avc1.4d002a" });
    downloadButton.href = URL.createObjectURL(recordedBlob);
    downloadButton.download = "pallas_pipelining.webm";
    // downloadButton.download = "pallas_pipelining.mp4";
    console.log(
      `Successfully recorded ${recordedBlob.size} bytes of ${recordedBlob.type} media.`,
    );
  })
  .catch((error) => { console.log(error); });
}
document.getElementById("captureButton").addEventListener("click", capture, false);


// primitive timeline scroller

document.getElementById("timeSlider").addEventListener("input", (event) => {
//  gsap.globalTimeline.pause();
  // const finalTime = gsap.globalTimeline.endTime();
  const maxVal = event.target.max;
  const val = (event.target.value/maxVal) * finalTime;
  console.log(val, finalTime);
  gsap.globalTimeline.seek(val);
});

// play / pause

document.getElementById("pauseButton").addEventListener("click", (event) => {
  if(gsap.globalTimeline.paused()) {
    gsap.globalTimeline.play();
  } else {
    gsap.globalTimeline.pause();
  }
});
