import * as THREE from 'three';
import * as TWEEN from 'tween';
import { FontLoader } from './FontLoader.js';

// Colors
const teal = 0x006699;
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

for(let x = 0; x < 4; x++) {
	for(let y = 0; y < 2; y++) {
		let geometry = new THREE.PlaneGeometry(0.4, 0.4, 2, 2);
		let mesh = new THREE.Mesh( geometry, simple_mat(teal, 0.6) );
		mesh.position.x = x / 2;
		mesh.position.y = y / 2;
		scene.add(mesh);
	}
}

// data block

let igeometry = new THREE.PlaneGeometry(0.05, 0.05, 2, 2);
let imesh = new THREE.Mesh( igeometry, simple_mat(red, 1.0) );

// Animation

function enchain(tweenChain, ) {
	let start = tweenChain[0];
	let last = start;
	tweenChain.forEach(function (t) {
		last.chain(t);
		last = t;
	});
	return [start, last];
}

let chain = [];
const keydur = 200/* ms */;
for(let y = 1; y >= 0; y--) {
	for(let x = 0; x < 4; x++) {
		for(let iy = 1; iy >= 0; iy--) {
			for(let ix = 0; ix < 2; ix++) {
				// chain.push(new TWEEN.Tween(imesh.position)
				//                     .to({x: x / 2 + ix/8 - 1/16, y: y / 2 + iy/8 - 1/16, z: 0.0}, keydur)
				// 					.easing(TWEEN.Easing.Cubic.Out));
				// can mess with multiple properties at once:
				chain.push(new TWEEN.Tween(imesh)
						.to({position: {x: x / 2 + ix/8 - 1/16, y: y / 2 + iy/8 - 1/16, z: 0.0}, material: {opacity: (x%2)*1.0}}, keydur)
				        .easing(TWEEN.Easing.Cubic.Out));
			}
		}
	}
}
let [start, last] = enchain(chain);
last.chain(start);
start.start();


scene.add(imesh);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animation);
document.body.appendChild(renderer.domElement);

// animation
function animation(time) {
	TWEEN.update();
	renderer.render( scene, camera );
}
