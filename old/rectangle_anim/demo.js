import * as THREE from 'three';

// color defs
const color = 0x006699;

// ortho camera
// TODO(levskaya): fix screen size to match window aspect
const frustumSize = 3;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 0.01, 10);
// const camera = new THREE.OrthographicCamera(-3, 3, -1, 1, 0.01, 10);
camera.position.z = 1;

// perspective camera
// const camera = new THREE.PerspectiveCamera(70, aspect, 0.01, 10);
// camera.position.z = 1;


const scene = new THREE.Scene();

// geometry
const geometry = new THREE.PlaneGeometry(0.2, 0.2, 2, 2);

// materials
const material = new THREE.MeshNormalMaterial();
const matDark = new THREE.LineBasicMaterial( {
	color: color,
	side: THREE.DoubleSide
} );
const matLite = new THREE.MeshBasicMaterial( {
	color: color,
	transparent: true,
	opacity: 0.4,
	side: THREE.DoubleSide
} );

const mesh = new THREE.Mesh( geometry, matDark );

window.mesh = mesh; // HACK

scene.add(mesh);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animation);
document.body.appendChild(renderer.domElement);

// animation
function animation(time) {
	mesh.position.x = Math.sin(time / 2000);
	// mesh.rotation.y = time / 1000;
	renderer.render( scene, camera );
}
