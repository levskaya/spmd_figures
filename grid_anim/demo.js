import * as THREE from 'three';

// color defs
const teal = 0x006699;
const red = 0x990000;

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

// materials
const material = new THREE.MeshNormalMaterial();
const matDark = new THREE.LineBasicMaterial( {
	color: teal,
	side: THREE.DoubleSide
} );
const matLite = new THREE.MeshBasicMaterial( {
	color: teal,
	transparent: true,
	opacity: 0.4,
	side: THREE.DoubleSide
} );

function simple_mat(color, opacity) {
	return new THREE.MeshBasicMaterial( {
		color: color,
		transparent: true,
		opacity: opacity,
		side: THREE.DoubleSide
	} );
}

const scene = new THREE.Scene();

// geometry

// const geometry = new THREE.PlaneGeometry(0.2, 0.2, 2, 2);
// const mesh = new THREE.Mesh( geometry, matDark );

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
