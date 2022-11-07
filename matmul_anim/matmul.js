import * as THREE from 'three';
import { FontLoader } from './FontLoader.js';
import { CSS2DRenderer, CSS2DObject } from './CSS2DRenderer.js';
import {gsap} from './gsap/all.js';
import katex from 'katex';
window.katex = katex;
window.THREE = THREE;


// Colors
const teal = new THREE.Color(0, 0.66, 0.99);
const red = new THREE.Color(0.99, 0., 0.);
const grey = new THREE.Color(0.9, 0.9, 0.9);
const greyred = new THREE.Color(0.9, 0.6, 0.6);
const white = new THREE.Color(0xffffff);
const black = new THREE.Color(0x000000);

// Materials
function simple_mat(color, opacity) {
	return new THREE.MeshBasicMaterial( {
		color: color,
		transparent: true,
		opacity: opacity,
		side: THREE.DoubleSide
	} );
}

// Clock
let clock = new THREE.Clock();

// Scenegraph
const scene = new THREE.Scene();
scene.background = new THREE.Color(white);

// Cameras
const frustumSize = 3;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
	/*left*/   frustumSize * aspect / - 2,
	/*right*/  frustumSize * aspect / 2,
	/*top*/    frustumSize / 2,
	/*bottom*/ frustumSize / - 2,
	/*near*/   0.01,
	/*far*/    10);
camera.position.z = 1;


// Geometry

// grid helpers
function arr2dInit(nx, ny) {
	return new Array(nx).fill(null).map(() => new Array(ny).fill(null));
}

function mesh2dBounds(mesh2d) {
	let first = mesh2d[0][0];
	let last  = mesh2d[mesh2d.length-1][mesh2d[0].length-1];
	let x0 = first.position.x;
	let y0 = first.position.y;
	let x1 = last.position.x + last.geometry.parameters.width;
	let y1 = last.position.y - last.geometry.parameters.height;
	return {x0: x0, xc: (x1 + x0) / 2.0, x1: x1, y0: y0, yc: (y1 + y0) / 2.0, y1: y1};
}

function makeGrid(px, py, nx, ny, dx, dy, w, h, clr=teal, opacity=1.0) {
	let meshes = arr2dInit(nx, ny);
	let timelines = arr2dInit(nx, ny);
	for(let i = 0; i < nx; i++) {
		for(let j = 0; j < ny; j++) {
			let geometry = new THREE.PlaneGeometry(w, h, 2, 2);
			let mesh = new THREE.Mesh( geometry, simple_mat(clr, opacity) );
			mesh.position.x = px + i * dx;
			mesh.position.y = py + (ny - j) * dy;
			scene.add(mesh);
			meshes[i][j] = mesh;
			timelines[i][j] = gsap.timeline();
		}
	}
	return [meshes, timelines];
}

function meshClone(x) {
	let y = x.clone();
	y.material = y.material.clone();
	y.material.opacity = 0.0;
	scene.add(y);
	return y;
}

// Native Text / Font handling.

const loader = new FontLoader();
const font = await loader.loadAsync('./helvetiker_regular.typeface.json');

function drawText(txt, sz, x, y) {
	const shapes = font.generateShapes(txt, sz);
	const geometry = new THREE.ShapeGeometry(shapes);
	geometry.computeBoundingBox();
	const xMid = - 0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
	const yMid = - 0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);
	geometry.translate(xMid, yMid, 0);
	const text = new THREE.Mesh(geometry, simple_mat(black, 1.0));
	text.position.x = x;
	text.position.y = y;
	text.position.z = 0.0;
	scene.add(text);
	return text;
}

// HTML+CSS Text handling w. KateX.
function renderText(txt, div) {
	katex.render(txt, div, {throwOnError: false, displayMode: false});
}

function makeLabel(txt, sz, x, y) {
	const testDiv = document.createElement( 'div' );
	testDiv.className = 'label';
	testDiv.style.fontSize = sz;
	testDiv.style.fontFamily = "Helvetica";
	renderText(txt, testDiv);
	const testLabel = new CSS2DObject( testDiv );
	testLabel.position.set( x, y, 0 );
	scene.add( testLabel );
	return testLabel
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
// origins
const A_origin = {x: -1, y: (M-N-1)*spacing};
const B_origin = {x: 0, y: 0};
const C_origin = {x: 1, y: (M-N-1)*spacing};
const col_origin = {x: -0.5, y: 1.25};
const caption_origin = {x: 0.5, y: 1};


// Matrix grids
let [A_meshes, A_tls] = makeGrid(A_origin.x, A_origin.y, P, N, spacing, spacing, size, size, teal, 1.0);
let [B_meshes, B_tls] = makeGrid(B_origin.x, B_origin.y, M, P, spacing, spacing, size, size, teal, 1.0);
let [C_meshes, C_tls] = makeGrid(C_origin.x, C_origin.y, M, N, spacing, spacing, size, size, grey, 1.0);

// Static axis labels
let A_bounds = mesh2dBounds(A_meshes);
let B_bounds = mesh2dBounds(B_meshes);
let C_bounds = mesh2dBounds(C_meshes);
let A_N_label = makeLabel("N", "30px", A_bounds.x0 - spacing, A_bounds.yc + 0.03);
let B_M_label = makeLabel("M", "30px", B_bounds.xc - 0.05, B_bounds.y1 - 0.05);
let A_P_label = makeLabel("P", "30px", B_bounds.x0 - spacing, B_bounds.yc + 0.05);
let B_P_label = makeLabel("P", "30px", A_bounds.xc - 0.05, A_bounds.y1 - 0.05);
let C_N_label = makeLabel("N", "30px", C_bounds.x0 - spacing, C_bounds.yc + 0.03);
let C_M_label = makeLabel("M", "30px", C_bounds.xc - 0.05, C_bounds.y1 - 0.05);

// Mult-accum math labels
let col_add_labels = Array(4).fill(null);
let col_mult_labels = Array(4).fill(null);
for(let p = 0; p < P; p++) {
	col_mult_labels[p] = drawText("*", 0.05, col_origin.x + spacing, col_origin.y - p * spacing);
	col_mult_labels[p].material.opacity = 0.0;
	col_add_labels[p] = drawText("+", 0.05, col_origin.x + 3*spacing, col_origin.y - p * spacing - spacing/2.0);
	col_add_labels[p].material.opacity = 0.0;
}

// Caption element, timeline, and state variables.
let caption = makeLabel("", "30px", caption_origin.x, caption_origin.y);
let label_tl = gsap.timeline();
let Mstr = "";
let Nstr = "";
let FLOPstr = "";

// Main Loop

let t = 0.0
for(let n = 0; n < N; n++) {
	for(let m = 0; m < M; m++) {
		// progressive speedup
		if (n==0 && m==1)  { tick /= 2; }
		if (n==1 && m==0)  { tick /= 2; }

		// highlight C matrix receiving element
		C_tls[m][n].to(C_meshes[m][n].material.color, greyred, t);

		// annotate first multiplications
		if(n==0 && m==0) {
			label_tl.call(() => caption.element.innerHTML = "<b>P</b> multiplications", [], t+2*tick);
		}

		// row/col movement to mult-acc position.
		// grab P-length column from A rows and B cols
		let col0 = Array(4);
		let col1 = Array(4);
		let tl0 = Array(4).fill(0).map(() => gsap.timeline());
		let tl1 = Array(4).fill(0).map(() => gsap.timeline());
		for(let p = 0; p < P; p++) {
			t += tick;
			col0[p] = meshClone(A_meshes[p][n]);
			col1[p] = meshClone(B_meshes[m][p]);
			tl0[p].to(col0[p].material, {opacity: 0.6}, t);
			tl0[p].to(col0[p].position, {x: col_origin.x, y: col_origin.y - p * spacing}, t);
			tl1[p].to(col1[p].material, {opacity: 0.6}, t);
			tl1[p].to(col1[p].position, {x: col_origin.x + 2 * spacing, y: col_origin.y - p * spacing}, t);

			A_tls[p][n].to(A_meshes[p][n].material.color, red, t)
             		   .to(A_meshes[p][n].material.color, teal, t + tick);
			B_tls[m][p].to(B_meshes[m][p].material.color, red, t)
			           .to(B_meshes[m][p].material.color, teal, t + tick);

			label_tl.to(col_mult_labels[p].material, {opacity: 1.0}, t);
		}
		t += 3 * tick;

		// annotate first additions
		if(n==0 && m==0) label_tl.call(() => caption.element.innerHTML = "<b>~P</b> additions", [], t+2*tick);

		// multiply terms
		for(let p = 0; p < P; p++) {
			t += tick;
    	    tl0[p].to(col0[p].material.color, red, t)
				  .to(col0[p].material.color, teal, t + tick/2.0)
				  .to(col0[p].position, {x: col_origin.x + 2 * spacing, y: col_origin.y - p * spacing}, t + tick/2.0)
   			tl1[p].to(col1[p].material.color, red, t)
				  .to(col1[p].material.color, teal, t + tick/2.0)
				  .to(col1[p].position, {x: col_origin.x + 2 * spacing, y: col_origin.y - p * spacing}, t + tick/2.0);
			label_tl.to(col_mult_labels[p].material, {opacity: 0.0}, t);
			if(p != P-1) label_tl.to(col_add_labels[p].material, {opacity: 1.0}, t);
		}
		t += 3 * tick;

		// add terms
		for(let p = 0; p < P; p++) {
			tl0[p].to(col0[p].position, {x: col_origin.x + 3 * spacing, y: col_origin.y - P * (P-2)/4 * spacing}, t);
			tl1[p].to(col1[p].position, {x: col_origin.x + 3 * spacing, y: col_origin.y - P * (P-2)/4 * spacing}, t);
			label_tl.to(col_add_labels[p].material, {opacity: 0.0}, t);
		}

		// annotate number of FLOPs
		if(n==0 && m==0)          {Mstr = ""}
		else if(n==0 && (m<M-1))  {Mstr = `*${m+1}`}
		else                      {Mstr = "*M"}
		if(n==0 && m==M-1)        {Nstr = ""}
		else if(n<N-1 && m==M-1)  {Nstr = `*${n+1}`}
		else if(n==N-1 && m==M-1) {Nstr = "*N"}
		FLOPstr = `<b>2*P${Mstr}${Nstr}</b> FLOPs`;
		label_tl.call((str) => caption.element.innerHTML = str, [FLOPstr], t+3*tick);

		// move mult-acc result into C matrix receiving element.
		t += 3 * tick;
		for(let p = 0; p < P; p++) {
			tl0[p].to(col0[p].material, {opacity: 0.0}, t)
			      .to(col0[p].position, {x: C_meshes[m][n].position.x, y: C_meshes[m][n].position.y}, t);
			tl1[p].to(col1[p].material, {opacity: 0.0}, t)
			      .to(col1[p].position, {x: C_meshes[m][n].position.x, y: C_meshes[m][n].position.y}, t);
		}
		t += 3 * tick;

		// un-highlight C matrix receiving element
		C_tls[m][n].to(C_meshes[m][n].material.color, teal, t);
	}
}


// WebGL Render
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animation);
document.body.appendChild(renderer.domElement);

// CSS Element Render
let labelRenderer = new CSS2DRenderer();
labelRenderer.setSize( window.innerWidth, window.innerHeight );
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild( labelRenderer.domElement );

// Animation Loop
function animation(time) {
	renderer.render( scene, camera );
	labelRenderer.render(scene, camera);
}
