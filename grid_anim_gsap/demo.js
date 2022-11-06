import * as THREE from 'three';
import * as TWEEN from 'tween';
import { FontLoader } from './FontLoader.js';
import {gsap} from './gsap/all.js';

window.THREE = THREE;

// Colors
const teal = new THREE.Color(0, 0.66, 0.99);
const red = 0x990000;
const white = 0xffffff;
const black = 0x000000;

let clock = new THREE.Clock();

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

// Materials
function simple_mat(color, opacity) {
	return new THREE.MeshBasicMaterial( {
		color: color,
		transparent: true,
		opacity: opacity,
		side: THREE.DoubleSide
	} );
}

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

// device grid
function arr2dInit(nx, ny) {
	return new Array(nx).fill(null).map(() => new Array(ny).fill(null));
}

function makeGrid(px, py, nx, ny, dx, dy, w, h) {
	let meshes = new Array(nx).fill(null).map(() => new Array(ny).fill(null));
	for(let i = 0; i < nx; i++) {
		for(let j = 0; j < ny; j++) {
			let geometry = new THREE.PlaneGeometry(w, h, 2, 2);
			let mesh = new THREE.Mesh( geometry, simple_mat(teal, 0.6) );
			mesh.position.x = px + i * dx;
			mesh.position.y = py + (ny - j) * dy;
			// scene.add(mesh);
			meshes[i][j] = mesh;
		}
	}
	return meshes;
}

window.makeGrid=makeGrid;

let A_meshes = makeGrid(-2, -1, 4, 4, 0.25, 0.25, 0.2, 0.2);
A_meshes.forEach( x => x.forEach(y=>scene.add(y)));
let A_tls = arr2dInit(4, 4);
A_meshes.forEach( (x, i) => x.forEach((y, j) => A_tls[i][j] =  gsap.timeline()) );

let B_meshes = makeGrid(0, -1, 4, 4, 0.25, 0.25, 0.2, 0.2);
B_meshes.forEach( x => x.forEach(y=>scene.add(y)));
let B_tls = arr2dInit(4, 4);
B_meshes.forEach( (x, i) => x.forEach((y, j) => B_tls[i][j] = gsap.timeline()) );

let C_meshes = makeGrid(2, -1, 4, 4, 0.25, 0.25, 0.2, 0.2);
C_meshes.forEach( x => x.forEach(y=>scene.add(y)));
let C_tls = arr2dInit(4, 4);
C_meshes.forEach( (x, i) => x.forEach((y, j) => C_tls[i][j] = gsap.timeline()) );

const keydur = 0.2;

// let t=0.0
// for(let n = 0; n < 4; n++) {
// 	for(let m = 0; m < 4; m++) {
// 		C_tls[m][n].to(C_meshes[m][n].material.color, {r: 0.99, g: 0, b:0}, t);
// 		for(let p = 0; p < 4; p++) {
// 			t += keydur;
// 			A_tls[p][n].to(A_meshes[p][n].material.color, {r: 0.99, g: 0, b:0}, t)
//              		   .to(A_meshes[p][n].material.color, {r: 0, g: 0.66, b:0.99}, t + keydur/2.0);
// 			B_tls[m][p].to(B_meshes[m][p].material.color, {r: 0.99, g: 0, b:0}, t)
// 			           .to(B_meshes[m][p].material.color, {r: 0, g: 0.66, b:0.99}, t + keydur/2.0);

// 		}
// 		C_tls[m][n].to(C_meshes[m][n].material.color, {r: 0, g: 0.66, b:0.99}, t);

// 		// C_tls[m][n].to(C_meshes[m][n].material.color, {r: 0.99, g: 0, b:0}, t)
// 		// 		   .to(C_meshes[m][n].material.color, {r: 0, g: 0.66, b:0.99}, t + keydur/2.0);
// 	}
// }
function mesh_clone(x) {
	let y = x.clone();
	y.material = y.material.clone();
	y.material.opacity = 0.0;
	scene.add(y);
	return y;
}

let t=0.0
for(let n = 0; n < 4; n++) {
	for(let m = 0; m < 4; m++) {
		C_tls[m][n].to(C_meshes[m][n].material.color, {r: 0.99, g: 0, b:0}, t);
		let col0 = Array(4);
		let col1 = Array(4);
		let tl0 = Array(4).fill(0).map(() => gsap.timeline());
		let tl1 = Array(4).fill(0).map(() => gsap.timeline());
		for(let p = 0; p < 4; p++) {
			t += keydur;
			col0[p] = mesh_clone(A_meshes[p][n]);
			col1[p] = mesh_clone(B_meshes[m][p]);
			tl0[p].to(col0[p].material, {opacity: 0.6}, t);
			tl0[p].to(col0[p].position, {x: 0, y: 1.25 - p*0.25}, t);
			tl1[p].to(col1[p].material, {opacity: 0.6}, t);
			tl1[p].to(col1[p].position, {x: 0.25, y: 1.25 - p*0.25}, t);
		}
		t += keydur;
		for(let p = 0; p < 4; p++) {
			t += keydur;
			A_tls[p][n].to(A_meshes[p][n].material.color, {r: 0.99, g: 0, b:0}, t)
             		   .to(A_meshes[p][n].material.color, {r: 0, g: 0.66, b:0.99}, t + keydur/2.0);
			B_tls[m][p].to(B_meshes[m][p].material.color, {r: 0.99, g: 0, b:0}, t)
			           .to(B_meshes[m][p].material.color, {r: 0, g: 0.66, b:0.99}, t + keydur/2.0);
    	    tl0[p].to(col0[p].material.color, {r: 0.99, g: 0, b:0}, t)
				  .to(col0[p].material.color, {r: 0, g: 0.66, b:0.99}, t + keydur/2.0)
				  .to(col0[p].position, {x: 0.5, y: 1.25 - p*0.25}, t + keydur/2.0)
   			tl1[p].to(col1[p].material.color, {r: 0.99, g: 0, b:0}, t)
				  .to(col1[p].material.color, {r: 0, g: 0.66, b:0.99}, t + keydur/2.0)
				  .to(col1[p].position, {x: 0.5, y: 1.25 - p*0.25}, t + keydur/2.0);
		}
		t += 3 * keydur;
		for(let p = 0; p < 4; p++) {
			tl0[p].to(col0[p].position, {x: 0.5, y: 1.25}, t);
			tl1[p].to(col1[p].position, {x: 0.5, y: 1.25}, t);
		}
		t += 3 * keydur;
		for(let p = 0; p < 4; p++) {
			tl0[p].to(col0[p].material, {opacity: 0.0}, t).to(col0[p].position, {x: C_meshes[m][n].position.x, y: C_meshes[m][n].position.y}, t);
			tl1[p].to(col1[p].material, {opacity: 0.0}, t).to(col1[p].position, {x: C_meshes[m][n].position.x, y: C_meshes[m][n].position.y}, t);
			// tl0[p].onComplete = () => console.log("done");
			// tl1[p].onComplete = () => (col1[p].visible = false);
		}
		t += 3 * keydur;
		C_tls[m][n].to(C_meshes[m][n].material.color, {r: 0, g: 0.66, b:0.99}, t);

		// C_tls[m][n].to(C_meshes[m][n].material.color, {r: 0.99, g: 0, b:0}, t)
		// 		   .to(C_meshes[m][n].material.color, {r: 0, g: 0.66, b:0.99}, t + keydur/2.0);
	}
}


// data block

// let igeometry = new THREE.PlaneGeometry(0.05, 0.05, 2, 2);
// let imesh = new THREE.Mesh( igeometry, simple_mat(red, 1.0) );
// let imesh2 = new THREE.Mesh( igeometry, simple_mat(0x999000, 1.0) );

// // Animation
// const keydur = 200/* ms */;

// let tl = gsap.timeline();
// let tl2 = gsap.timeline().delay(2*keydur/1000.);

// for(let y = 1; y >= 0; y--) {
// 	for(let x = 0; x < 4; x++) {
// 		for(let iy = 1; iy >= 0; iy--) {
// 			for(let ix = 0; ix < 2; ix++) {
// 				tl.to(imesh.position, {x: x / 2 + ix/8 - 1/16, y: y / 2 + iy/8 - 1/16, z: 0.0}, `>{keydur}`);
// 				tl2.to(imesh2.position, {x: x / 2 + ix/8 - 1/16, y: y / 2 + iy/8 - 1/16, z: 0.0}, `>{keydur}`);
// 			}
// 		}
// 	}
// }

// scene.add(imesh);
// scene.add(imesh2);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animation);
document.body.appendChild(renderer.domElement);

// animation
function animation(time) {
	renderer.render( scene, camera );
}
