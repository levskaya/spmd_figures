import * as THREE from 'three';
import { gsap } from '/external/gsap/all.js';
import { CSS2DRenderer } from '/external/three/CSS2DRenderer.js';
import { Box, Text, Label } from '/lib/boxpusher.js';
import { capture_and_control_ui } from '/lib/control_ui.js';
import { v3, add } from '/lib/vectors.js';
import { empty} from '/lib/nd.js';

// debug
window.THREE = THREE;
window.gsap = gsap;

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
document.getElementById("canvas").appendChild( renderer.domElement );

// CSS Element Render
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize( window.innerWidth, window.innerHeight );
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.getElementById("canvas").appendChild( labelRenderer.domElement );


// grid helper
export function makeGrid(origin, num, delta, size, clr=grey, opacity=1.0, scene=null) {
    return empty([num.x, num.y]).indexMap( 
        ([i, j]) => {
            let posn = add(origin, 
                        v3(i * delta.x, (num.y - j) * delta.y, 0),
                        v3(-size.x/2, size.y/2, 0));  // fudge factor
            return new Box(posn, size, clr, opacity, scene);
        }).toArray();
}

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
// origins (bottom left corner stupidly)
const A_origin = v3(-1.25, (P-N)*spacing, 0);
const B_origin = v3(A_origin.x + 1, 0, 0);
const C_origin = v3(A_origin.x + 2, (P-N)*spacing, 0);
// mult+add column placement
const col_origin = v3(A_origin.x + 0.5, 1.25, 0);
const asterix_origin = add(col_origin, v3(1.3 * spacing, -0.1, 0));
const plus_origin = add(col_origin, v3(3.3 * spacing, 0, 0));
// caption placement
const caption_origin = v3(A_origin.x + 1.5, 1, 0);

// Matrix grids
const spacing_v = v3(spacing, spacing, 0);
const size_v = v3(size, size, 0);

let As = makeGrid(A_origin, v3(P, N, 0), spacing_v, size_v, teal, 1.0, scene);
let Bs = makeGrid(B_origin, v3(M, P, 0), spacing_v, size_v, teal, 1.0, scene);
let Cs = makeGrid(C_origin, v3(M, N, 0), spacing_v, size_v, grey, 1.0, scene);

// Static axis labels
const A_ul = add(A_origin, v3(0, N*spacing, 0));
const B_ul = add(B_origin, v3(0, P*spacing, 0));
const C_ul = add(C_origin, v3(0, N*spacing, 0));
const dx = v3(-spacing, 0, 0);
const dy = v3(0, size, 0);
new Label(add(A_ul, dx), "N", "2em", black, 1.0, scene);
new Label(add(A_ul, dy), "P", "2em", black, 1.0, scene);
new Label(add(B_ul, dx), "P", "2em", black, 1.0, scene);
new Label(add(B_ul, dy), "M", "2em", black, 1.0, scene);
new Label(add(C_ul, dx), "N", "2em", black, 1.0, scene);
new Label(add(C_ul, dy), "M", "2em", black, 1.0, scene);

// Arrays for Multiply-Accumulate boxes
let col0 = Array(4);
let col1 = Array(4);

// Multiply-Accumulate "*", "+" labels
let asterisks = Array(4).fill(null);
let plusses = Array(4).fill(null);
for(let p = 0; p < P; p++) {
    asterisks[p] = new Text(
        add(asterix_origin, v3(0, -p*spacing, 0)), "*", 0.05, black, 0.0, scene);
    plusses[p] = new Text(
        add(plus_origin, v3(0, -(p+1)*spacing, 0)), "+", 0.05, black, 0.0, scene);
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
            col0[p] = As[p][n].clone(/*hide=*/false)
                              .toOpacity(0.6, t)
                              .toPosition(add(col_origin, v3(0, -p * spacing, 0)), t);
            col1[p] = Bs[m][p].clone(/*hide=*/false)
                              .toOpacity(0.6, t)
                              .toPosition(add(col_origin, v3(2 * spacing, - p * spacing, 0)), t);
            As[p][n].toColor(red, t).toColor(teal, t+ tick);
            Bs[m][p].toColor(red, t).toColor(teal, t+ tick);

            asterisks[p].toOpacity(1.0, t);
        }
        t += 3 * tick;

        // annotate first additions
        if(n==0 && m==0) caption.toText(
            "<b>P</b> multiplications <br> + <b>P</b> additions", 
            t+2*tick);

        // multiply terms
        for(let p = 0; p < P; p++) {
            col0[p].toColor(red, t)
                   .toColor(teal, t + tick/2)
                   .toPosition(add(col_origin, v3(2 * spacing, -p * spacing, 0)),
                               t + tick/2);
            col1[p].toColor(red, t)
                   .toColor(teal, t + tick/2)
                   .toPosition(add(col_origin, v3(2 * spacing, -p * spacing, 0)),
                               t + tick/2);
            asterisks[p].toOpacity(0.0, t);
            if(p != P-1) plusses[p].toOpacity(1.0, t);
        }
        t += 3 * tick;

        // add terms
        for(let p = 0; p < P; p++) {
            col0[p].toPosition(
                add(col_origin, v3(3 * spacing, - P * (P-2)/4 * spacing, 0)), 
                t);
            col1[p].toPosition(
                add(col_origin, v3(3 * spacing, - P * (P-2)/4 * spacing, 0)), 
                t);
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

// Capture and Control UI

capture_and_control_ui(
    "controls",          // control div id
    t + 4*tick,                   // animation time in seconds
    "matmul.webm",       // save filename
    "video/webm"         // save format
    );
  
// gsap.globalTimeline.seek(3.444);
// gsap.globalTimeline.pause();

