import * as THREE from 'three';
import { CSS2DRenderer } from '/external/three/CSS2DRenderer.js';
import { makeGrid, Text, Label } from './boxpusher.js';

window.THREE = THREE;


// Colors
const teal = new THREE.Color(0, 0.66, 0.99);
const red = new THREE.Color(0.99, 0., 0.);
const grey = new THREE.Color(0.9, 0.9, 0.9);
const greyred = new THREE.Color(0.9, 0.6, 0.6);
const white = new THREE.Color(0xffffff);
const black = new THREE.Color(0x000000);

// Clock
let clock = new THREE.Clock();

// Scenegraph
const scene = new THREE.Scene();
scene.background = new THREE.Color(white);

// Cameras
const frustumSize = 3.5;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
    /*left*/   frustumSize * aspect / - 2,
    /*right*/  frustumSize * aspect / 2,
    /*top*/    frustumSize / 2,
    /*bottom*/ frustumSize / - 2,
    /*near*/   0.01,
    /*far*/    10);
camera.position.z = 1;

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

// Animation Constants

// speed
let tick = 0.3;

// matrix sizes
const N = 3;
const M = 5;
const P = 4;
// grid spacing
const size = 0.1;
const delta = 0.025;
const spacing = size + delta;
// origins
const A_origin = {x: -1.25, y: (P-N)*spacing};
const B_origin = {x: A_origin.x + 1, y: 0};
const C_origin = {x: A_origin.x + 2, y: (P-N)*spacing};
const col_origin = {x: A_origin.x + 0.5, y: 1.25};
const caption_origin = {x: A_origin.x + 1.5, y: 1};

// Matrix grids
let As = makeGrid(A_origin, {x:P, y:N}, {x:spacing, y:spacing}, {x:size, y:size}, teal, 1.0, scene);
let Bs = makeGrid(B_origin, {x:M, y:P}, {x:spacing, y:spacing}, {x:size, y:size}, teal, 1.0, scene);
let Cs = makeGrid(C_origin, {x:M, y:N}, {x:spacing, y:spacing}, {x:size, y:size}, grey, 1.0, scene);

// Static axis labels
const A00p = As[0][0].position;
const B00p = Bs[0][0].position;
const C00p = Cs[0][0].position;
const A_N_label = new Label({x: A00p.x - spacing, y: A00p.y},        "N", "2em", black, 1.0, scene);
const A_P_label = new Label({x: A00p.x,           y: A00p.y + size}, "P", "2em", black, 1.0, scene);
const B_P_label = new Label({x: B00p.x - spacing, y: B00p.y},        "P", "2em", black, 1.0, scene);
const B_M_label = new Label({x: B00p.x,           y: B00p.y + size}, "M", "2em", black, 1.0, scene);
const C_N_label = new Label({x: C00p.x - spacing, y: C00p.y},        "N", "2em", black, 1.0, scene);
const C_M_label = new Label({x: C00p.x,           y: C00p.y + size}, "M", "2em", black, 1.0, scene);

// Arrays for Multiply-Accumulate boxes
let col0 = Array(4);
let col1 = Array(4);

// Multiply-Accumulate "*", "+" labels
let asterisks = Array(4).fill(null);
let plusses = Array(4).fill(null);
for(let p = 0; p < P; p++) {
    asterisks[p] = new Text({x: col_origin.x + spacing, y: col_origin.y - p * spacing}, "*", 0.05, black, 0.0, scene);
    plusses[p] = new Text({x: col_origin.x + 3*spacing, y: col_origin.y - p * spacing - spacing/2.0}, "+", 0.05, black, 0.0, scene);
}

// Caption element, timeline, and state variables.
let Mstr = "";
let Nstr = "";
const caption = new Label(caption_origin, "",  "2em", black, 1.0, scene);


// Main Loop

let t = 0.0
t+=4*tick;
for(let n = 0; n < N; n++) {
    for(let m = 0; m < M; m++) {
        // progressive speedup
        if (n==0 && m==1)  { tick /= 2; }
        if (n==1 && m==0)  { tick /= 2; }

        // highlight C matrix receiving element
        Cs[m][n].toColor(greyred, t);

        // annotate first multiplications
        if(n==0 && m==0) {
            caption.toText("<b>P</b> multiplications", t+2*tick);
        }

        // row/col movement to mult-acc position.
        for(let p = 0; p < P; p++) {
            t += tick;
            col0[p] = As[p][n].clone()
                              .toOpacity(0.6, t)
                              .toPosition({x: col_origin.x, y: col_origin.y - p * spacing}, t);
            col1[p] = Bs[m][p].clone()
                              .toOpacity(0.6, t)
                              .toPosition({x: col_origin.x + 2 * spacing, y: col_origin.y - p * spacing}, t);
            As[p][n].toColor(red, t).toColor(teal, t+ tick);
            Bs[m][p].toColor(red, t).toColor(teal, t+ tick);

            asterisks[p].toOpacity(1.0, t);
        }
        t += 3 * tick;

        // annotate first additions
        if(n==0 && m==0) caption.toText("<b>P</b> multiplications <br> + <b>P</b> additions", t+2*tick);

        // multiply terms
        for(let p = 0; p < P; p++) {
            col0[p].toColor(red, t)
                   .toColor(teal, t + tick/2)
                   .toPosition({x: col_origin.x + 2 * spacing,
                                y: col_origin.y - p * spacing},
                               t + tick/2)
            col1[p].toColor(red, t)
                   .toColor(teal, t + tick/2)
                   .toPosition({x: col_origin.x + 2 * spacing,
                                y: col_origin.y - p * spacing},
                               t + tick/2)
            asterisks[p].toOpacity(0.0, t);
            if(p != P-1) plusses[p].toOpacity(1.0, t);
        }
        t += 3 * tick;

        // add terms
        for(let p = 0; p < P; p++) {
            col0[p].toPosition({x: col_origin.x + 3 * spacing,
                                y: col_origin.y - P * (P-2)/4 * spacing}, t)
            col1[p].toPosition({x: col_origin.x + 3 * spacing,
                                y: col_origin.y - P * (P-2)/4 * spacing}, t)
            plusses[p].toOpacity(0.0, t);
        }

        // annotate number of FLOPs
        if(n==0 && m==0)          {Mstr = ""}
        else if(n==0 && (m<M-1))  {Mstr = `*${m+1}`}
        else                      {Mstr = "*M"}
        if(n==0 && m==M-1)        {Nstr = ""}
        else if(n<N-1 && m==M-1)  {Nstr = `*${n+1}`}
        else if(n==N-1 && m==M-1) {Nstr = "*N"}
        caption.toText(`<b>2*P${Mstr}${Nstr}</b> FLOPs`, t+3*tick);

        // move mult-acc result into C matrix receiving element.
        t += 3 * tick;
        for(let p = 0; p < P; p++) {
            col0[p].toOpacity(0.0, t).toPosition(Cs[m][n].position, t);
            col1[p].toOpacity(0.0, t).toPosition(Cs[m][n].position, t);
        }

        t += tick;
        // un-highlight C matrix receiving element
        Cs[m][n].toColor(teal, t);
    }
}


// Animation Loop
function animation(time) {
    renderer.render( scene, camera );
    labelRenderer.render( scene, camera );
}
renderer.setAnimationLoop(animation);
