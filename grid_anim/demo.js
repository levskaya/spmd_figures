import * as THREE from 'three';
import { FontLoader } from './FontLoader.js';

// Colors
const teal = 0x006699;
const red = 0x990000;
const white = 0xffffff;
const black = 0x000000;

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
// const camera = new THREE.PerspectiveCamera(
// 	/*fov*/    70,
// 	/*aspect*/ aspect,
// 	/*near*/   0.01,
// 	/*far*/    10);
// camera.position.z = 1;

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

// grid

for(let x = 0; x < 4; x++) {
	for(let y = 0; y < 2; y++) {
		let geometry = new THREE.PlaneGeometry(0.2, 0.2, 2, 2);
		let mesh = new THREE.Mesh( geometry, simple_mat(teal, 0.6) );
		mesh.position.x = x / 4;
		mesh.position.y = y / 4;
		scene.add(mesh);

		for(let ix = 0; ix < 2; ix++) {
			for(let iy = 0; iy < 2; iy++) {
				let igeometry = new THREE.PlaneGeometry(0.05, 0.05, 2, 2);
				let imesh = new THREE.Mesh( igeometry, simple_mat(red, 1.0) );
				imesh.position.x = x / 4 + ix/16 - 1/32;
				imesh.position.y = y / 4 + iy/16 - 1/32;
				scene.add(imesh);
			}
		}
	}
}

// window.mesh = mesh; // HACK
// scene.add(mesh);
// let geometry = new THREE.PlaneGeometry(3.0, 3.0, 2, 2);
// let mesh = new THREE.Mesh( geometry, simple_mat(teal, 0.6) );
// mesh.position.x = 0;
// mesh.position.y = 0;
// scene.add(mesh);


scene.add(drawText("A_0", 0.05, 0.4, 0));

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animation);
document.body.appendChild(renderer.domElement);

// animation
function animation(time) {
	// mesh.position.x = Math.sin(time / 2000);
	// mesh.rotation.y = time / 1000;
	renderer.render( scene, camera );
}
