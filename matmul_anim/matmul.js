import * as THREE from 'three';
import { FontLoader } from './FontLoader.js';
import { CSS2DRenderer, CSS2DObject } from './CSS2DRenderer.js';
import {gsap} from './gsap/all.js';
// MathJax is still a special snowflake and requires top-level html script import/config.
//MathJax = window.MathJax;
import katex from 'katex';
window.katex = katex;
window.THREE = THREE;


// Colors
const rgb_to_color = (rgb) => new THREE.Color(rgb.r, rgb.g, rgb.b);
const teal_rgb = {r: 0, g: 0.66, b:0.99};
const teal = rgb_to_color(teal_rgb);
const red_rgb = {r: 0.99, g: 0, b:0};
const red = rgb_to_color(red_rgb);
const white = 0xffffff;
const black = 0x000000;

// Materials
function simple_mat(color, opacity) {
	return new THREE.MeshBasicMaterial( {
		color: color,
		transparent: true,
		opacity: opacity,
		side: THREE.DoubleSide
	} );
}

// Font
const loader = new FontLoader();
const font = await loader.loadAsync('./helvetiker_regular.typeface.json');

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

// Clock
let clock = new THREE.Clock();

// Scenegraph
const scene = new THREE.Scene();
scene.background = new THREE.Color(white);

// geometry

function drawText(str, sz, x, y) {
	const shapes = font.generateShapes('A_0', sz);
	const geometry = new THREE.ShapeGeometry(shapes);
	geometry.computeBoundingBox();
	const xMid = - 0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
	geometry.translate(xMid, x, y);
	const text = new THREE.Mesh(geometry, simple_mat(black, 1.0));
	text.position.z = 0.0;
	return text;
}

// grid helpers
function arr2dInit(nx, ny) {
	return new Array(nx).fill(null).map(() => new Array(ny).fill(null));
}

function mesh2dForEach(mesh2d, fn) {
	mesh2d.forEach( (x, i) => x.forEach((y, j) => fn(x, y, i, j) ));
}

function makeGrid(px, py, nx, ny, dx, dy, w, h) {
	let meshes = arr2dInit(nx, ny);
	let timelines = arr2dInit(nx, ny);
	for(let i = 0; i < nx; i++) {
		for(let j = 0; j < ny; j++) {
			let geometry = new THREE.PlaneGeometry(w, h, 2, 2);
			let mesh = new THREE.Mesh( geometry, simple_mat(teal, 0.6) );
			mesh.position.x = px + i * dx;
			mesh.position.y = py + (ny - j) * dy;
			scene.add(mesh);
			meshes[i][j] = mesh;
			timelines[i][j] = gsap.timeline();
		}
	}
	return [meshes, timelines];
}

function mesh_clone(x) {
	let y = x.clone();
	y.material = y.material.clone();
	y.material.opacity = 0.0;
	scene.add(y);
	return y;
}

// Animation
const tick = 0.2;
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
const C_origin = {x: 1, y: 0};
const col_origin = {x: -1, y: 1.25};

let [A_meshes, A_tls] = makeGrid(A_origin.x, A_origin.y, P, N, spacing, spacing, size, size);
let [B_meshes, B_tls] = makeGrid(B_origin.x, B_origin.y, M, P, spacing, spacing, size, size);
let [C_meshes, C_tls] = makeGrid(C_origin.x, C_origin.y, M, N, spacing, spacing, size, size);

const testDiv = document.createElement( 'div' );
testDiv.className = 'label';
// testDiv.textContent = 'TESTING';
testDiv.style.fontSize = "40px";
// katex.render("n * p \\,\\, \\Biggl \\{", testDiv, {throwOnError: false, displayMode: true});
function renderText(txt, div) {
	katex.render(txt, div, {throwOnError: false, displayMode: true});
}
renderText("N", testDiv);
const testLabel = new CSS2DObject( testDiv );
testLabel.position.set( A_origin.x - 2 * spacing, A_origin.y + N * spacing /2, 0 );
scene.add( testLabel );


let t = 0.0
for(let n = 0; n < N; n++) {
	for(let m = 0; m < M; m++) {
		C_tls[m][n].to(C_meshes[m][n].material.color, red_rgb, t);
		let col0 = Array(4);
		let col1 = Array(4);
		let tl0 = Array(4).fill(0).map(() => gsap.timeline());
		let tl1 = Array(4).fill(0).map(() => gsap.timeline());
		// row/col movement to mult-acc position.
		for(let p = 0; p < P; p++) {
			t += tick;
			col0[p] = mesh_clone(A_meshes[p][n]);
			col1[p] = mesh_clone(B_meshes[m][p]);
			tl0[p].to(col0[p].material, {opacity: 0.6}, t);
			tl0[p].to(col0[p].position, {x: col_origin.x, y: col_origin.y - p * spacing}, t);
			tl1[p].to(col1[p].material, {opacity: 0.6}, t);
			tl1[p].to(col1[p].position, {x: col_origin.x + spacing, y: col_origin.y - p * spacing}, t);
		}
		t += tick;
		for(let p = 0; p < P; p++) {
			t += tick;
			A_tls[p][n].to(A_meshes[p][n].material.color, red_rgb, t)
             		   .to(A_meshes[p][n].material.color, teal_rgb, t + tick/2.0);
			B_tls[m][p].to(B_meshes[m][p].material.color, red_rgb, t)
			           .to(B_meshes[m][p].material.color, teal_rgb, t + tick/2.0);
			// multiply terms
    	    tl0[p].to(col0[p].material.color, red_rgb, t)
				  .to(col0[p].material.color, teal_rgb, t + tick/2.0)
				  .to(col0[p].position, {x: col_origin.x + 2 * spacing, y: col_origin.y - p * spacing}, t + tick/2.0)
   			tl1[p].to(col1[p].material.color, red_rgb, t)
				  .to(col1[p].material.color, teal_rgb, t + tick/2.0)
				  .to(col1[p].position, {x: col_origin.x + 2 * spacing, y: col_origin.y - p * spacing}, t + tick/2.0);
		}
		t += 3 * tick;
		// add terms
		for(let p = 0; p < P; p++) {
			tl0[p].to(col0[p].position, {x: col_origin.x + 3 * spacing, y: col_origin.y - P * (P-2)/4 * spacing}, t);
			tl1[p].to(col1[p].position, {x: col_origin.x + 3 * spacing, y: col_origin.y - P * (P-2)/4 * spacing}, t);
		}
		t += 3 * tick;
		for(let p = 0; p < P; p++) {
			tl0[p].to(col0[p].material, {opacity: 0.0}, t).to(col0[p].position, {x: C_meshes[m][n].position.x, y: C_meshes[m][n].position.y}, t);
			tl1[p].to(col1[p].material, {opacity: 0.0}, t).to(col1[p].position, {x: C_meshes[m][n].position.x, y: C_meshes[m][n].position.y}, t);
		}
		t += 3 * tick;
		C_tls[m][n].to(C_meshes[m][n].material.color, teal_rgb, t);
	}
}


const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animation);
document.body.appendChild(renderer.domElement);

let labelRenderer = new CSS2DRenderer();
labelRenderer.setSize( window.innerWidth, window.innerHeight );
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild( labelRenderer.domElement );


// animation
function animation(time) {
	renderer.render( scene, camera );
	labelRenderer.render(scene, camera);
}
