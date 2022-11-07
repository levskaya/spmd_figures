import * as THREE from 'three';
import { FontLoader } from './FontLoader.js';
import { CSS2DRenderer, CSS2DObject } from './CSS2DRenderer.js';
import { gsap } from './gsap/all.js';
// import katex from 'katex';

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

export class Box {
	constructor(position, size, color, opacity=0.0, scene=null) {
	  this.geometry = new THREE.PlaneGeometry(size.x, size.y, 2, 2);
	  this.material = simple_mat(color, opacity);
	  this.mesh = new THREE.Mesh( this.geometry, this.material);
	  this.mesh.position.x = position.x;
	  this.mesh.position.y = position.y;
	  this.mesh.position.z = 0.0;
	  this.timeline = gsap.timeline();
	  this.scene = scene;
	  if(scene) {
		  scene.add(this.mesh);
	  }
	}
  addToScene(scene) {
	  scene.add(this.mesh);
  }
  // getter/setter
  get position() {
	  return this.mesh.position;
  }
  set position(posn) {
	  this.mesh.position = position;
  }
  get size() {
	  return new THREE.Vector2(this.mesh.geometry.parameters.width, this.mesh.geometry.parameters.height);
  }
  get color() {
	  return this.mesh.material.color;
  }
  set color(clr) {
	  this.mesh.material.color = clr;
  }
  get opacity() {
	  return this.mesh.material.opacity;
  }
  set opacity(opa) {
	  this.mesh.material.opacity = opa;
  }
  // cloning
  clone(hide=true){
	  const box = new Box(this.position, this.size, this.color, this.opacity, this.scene);
	  if(hide) box.opacity = 0.0;
	  return box
  }
  // tweening
  toPosition(posn, t) {
	  this.timeline.to(this.mesh.position, posn, t);
	  return this;
  }
  toColor(clr, t) {
	  this.timeline.to(this.mesh.material.color, clr, t);
	  return this;
  }
  toOpacity(opacity, t) {
	  this.timeline.to(this.mesh.material, {opacity: opacity}, t);
	  return this;
  }
  toHide(t){
	  this.toOpacity(0.0, t);
	  return this;
  }
  toVisible(t){
	  this.toOpacity(1.0, t);
	  return this;
  }
}

// grid helpers
function arr2dInit(nx, ny) {
	return new Array(nx).fill(null).map(() => new Array(ny).fill(null));
}

function makeGrid(origin, num, delta, size, clr=grey, opacity=1.0, scene=null) {
	let boxes = arr2dInit(num.x, num.y);
	for(let i = 0; i < num.x; i++) {
		for(let j = 0; j < num.y; j++) {
			let posn = {x: origin.x + i * delta.x,
				        y: origin.y + (num.y - j) * delta.y};
			boxes[i][j] = new Box(posn, size, clr, opacity, scene);
		}
	}
	return boxes
}


// Native Text / Font handling.

const loader = new FontLoader();
const font = await loader.loadAsync('./helvetiker_regular.typeface.json');

export class Text {
	constructor(position, text, size, color, opacity=0.0, scene=null) {
	  this.text = text;
	  this.size = size;
  	  const shapes = font.generateShapes(text, size);
	  this.geometry = new THREE.ShapeGeometry(shapes);
	  this.geometry.computeBoundingBox();
	  this.boundingBox = this.geometry.boundingBox;
	  const xMid = - 0.5 * (this.boundingBox.max.x - this.boundingBox.min.x);
	  const yMid = - 0.5 * (this.boundingBox.max.y - this.boundingBox.min.y);
	  this.geometry.translate(xMid, yMid, 0);
	  this.material = simple_mat(color, opacity);
	  this.mesh = new THREE.Mesh( this.geometry, this.material);
	  this.mesh.position.x = position.x;
	  this.mesh.position.y = position.y;
	  this.mesh.position.z = 0.0;
	  this.timeline = gsap.timeline();
	  this.scene = scene;
	  if(scene) {
		  scene.add(this.mesh);
	  }
	}
  addToScene(scene) {
	  scene.add(this.mesh);
  }
  get position() {
	  return this.mesh.position;
  }
  set position(posn) {
	  this.mesh.position = position;
  }
  get color() {
	  return this.mesh.material.color;
  }
  set color(clr) {
	  this.mesh.material.color = clr;
  }
  get opacity() {
	  return this.mesh.material.opacity;
  }
  set opacity(opa) {
	  this.mesh.material.opacity = opa;
  }
  // cloning
  clone(hide=true){
	  const label = new Label(this.position, this.text, this.size, this.color, this.opacity, this.scene);
	  if(hide) label.opacity = 0.0;
	  return label
  }
  // tweening
  toPosition(posn, t) {
	  this.timeline.to(this.mesh.position, posn, t);
	  return this;
  }
  toColor(clr, t) {
	  this.timeline.to(this.mesh.material.color, clr, t);
	  return this;
  }
  toOpacity(opacity, t) {
	  this.timeline.to(this.mesh.material, {opacity: opacity}, t);
	  return this;
  }
  toHide(t){
	  this.toOpacity(0.0, t);
	  return this;
  }
  toVisible(t){
	  this.toOpacity(1.0, t);
	  return this;
  }
}


export class Label {
	constructor(position, text, size, color, opacity=0.0, scene=null) {
	  this.text = text;
	  this.size = size;
	  this.textDiv = document.createElement( 'div' );
	  this.textDiv.className = 'label';
	  this.textDiv.style.fontSize = size;
	  this.textDiv.style.fontFamily = "Helvetica";
	  this.textDiv.style.color = "#" + color.getHexString();
	  this.textDiv.style.opacity = opacity;
	  this.textDiv.innerHTML = text;
	  this.textObject = new CSS2DObject( this.textDiv );
	  this.textObject.position.set( position.x, position.y, 0 );
	  this.timeline = gsap.timeline();
	  this.scene = scene;
	  if(scene) {
		  scene.add(this.textObject);
	  }
	}
  addToScene(scene) {
	  scene.add(this.mesh);
  }
  get position() {
	  return this.textObject.position;
  }
  set position(posn) {
	  this.textObject.position.set(position);
  }
  get color() {
	  return new THREE.Color(this.textDiv.style.color);
  }
  set color(clr) {
	this.textDiv.style.color = clr.getHexString();
  }
  get opacity() {
	  return this.mesh.material.opacity;
  }
  set opacity(opa) {
	  this.mesh.material.opacity = opa;
  }
  // cloning
//   clone(hide=true){
// 	  const label = new Label(this.position, this.text, this.size, this.color, this.opacity, this.scene);
// 	  if(hide) label.opacity = 0.0;
// 	  return label
//   }
  // tweening
  toPosition(posn, t) {
	  this.timeline.to(this.textObject.position, posn, t);
	  return this;
  }
//   toColor(clr, t) {
// 	  this.timeline.to(this.color, clr, t);
// 	  return this;
//   }
  toOpacity(opacity, t) {
	  this.timeline.to(this.textDiv.style, {opacity: opacity}, t);
	  return this;
  }
  toHide(t){
	  this.toOpacity(0.0, t);
	  return this;
  }
  toVisible(t){
	  this.toOpacity(1.0, t);
	  return this;
  }
  toText(text, t){
	this.timeline.call((tx) => this.textDiv.innerHTML = tx, [text], t);
	return this;
  }
  // // HTML+CSS Text handling w. KateX.
  // renderText(txt) {
  // 	katex.render(txt, this.textDiv, {throwOnError: false, displayMode: false});
  // }
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
let As = makeGrid(A_origin, {x:P, y:N}, {x:spacing, y:spacing}, {x:size, y:size}, teal, 1.0, scene);
let Bs = makeGrid(B_origin, {x:M, y:P}, {x:spacing, y:spacing}, {x:size, y:size}, teal, 1.0, scene);
let Cs = makeGrid(C_origin, {x:M, y:N}, {x:spacing, y:spacing}, {x:size, y:size}, grey, 1.0, scene);

// // Static axis labels
const A_N_label = new Label({x: As[0][0].position.x - spacing, y: As[0][0].position.y}, "N", "2em", black, 1.0, scene);
const A_P_label = new Label({x: As[0][0].position.x, y: As[0][0].position.y + spacing}, "P", "2em", black, 1.0, scene);
const B_P_label = new Label({x: Bs[0][0].position.x - spacing, y: Bs[0][0].position.y}, "P", "2em", black, 1.0, scene);
const B_M_label = new Label({x: Bs[0][0].position.x, y: Bs[0][0].position.y + spacing}, "M", "2em", black, 1.0, scene);
const C_N_label = new Label({x: Cs[0][0].position.x - spacing, y: Cs[0][0].position.y}, "N", "2em", black, 1.0, scene);
const C_M_label = new Label({x: Cs[0][0].position.x, y: Cs[0][0].position.y + spacing}, "M", "2em", black, 1.0, scene);

// Mult-accum math labels
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
		let col0 = Array(4);
		let col1 = Array(4);
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
		t += 3 * tick;

		// un-highlight C matrix receiving element
		Cs[m][n].toColor(teal, t);
	}
}


// WebGL Render
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animation);
document.body.appendChild(renderer.domElement);

// CSS Element Render
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize( window.innerWidth, window.innerHeight );
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild( labelRenderer.domElement );

// Animation Loop
function animation(time) {
	renderer.render( scene, camera );
	labelRenderer.render(scene, camera);
}
