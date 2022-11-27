import * as THREE from 'three';
import { FontLoader } from '/libs/FontLoader.js';
import { CSS2DObject } from '/libs/CSS2DRenderer.js';
import { gsap } from '/libs/gsap/all.js';
import renderMathInElement from 'katexautorender';


export function simple_mat(color, opacity) {
    return new THREE.MeshBasicMaterial( {
        color: color,
        transparent: true,
        opacity: opacity,
        side: THREE.DoubleSide
    } );
}


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
export function arr2dInit(nx, ny) {
    return new Array(nx).fill(null).map(() => new Array(ny).fill(null));
}

export function makeGrid(origin, num, delta, size, clr=grey, opacity=1.0, scene=null) {
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
export const font = await loader.loadAsync('/fonts/helvetiker_regular.typeface.json');

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
  get text() {
      return this.textDiv.innerHTML;
  }
  set text(text) {
      this.textDiv.innerHTML = text;
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
  clone(hide=true){
	  const label = new Label(this.position, this.text, this.size, this.color, this.opacity, this.scene);
	  if(hide) label.opacity = 0.0;
	  return label
  }
  // tweening
  toPosition(posn, t) {
      this.timeline.to(this.textObject.position, posn, t);
      return this;
  }
  toColor(clr, t) {
      const hexclr = "#" + clr.getHexString();
	  this.timeline.to(this.textDiv.style.color, hexclr, t);
	  return this;
  }
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
    this.timeline.call((tx) => this.text = tx, [text], t);
    return this;
  }
  renderLatex(txt) {
    // NB: use String.raw template literal syntax to avoid backslash escaping.
    // e.g. String.raw`This is a test $\int_x f(x) dx $`
    this.text = txt;
    renderMathInElement(this.textDiv, {
        delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\(', right: '\\)', display: false},
            {left: '\\[', right: '\\]', display: true}
        ],
        throwOnError: false
    });
  }
  toLatex(text, t){
    this.timeline.call(text => this.renderLatex(text), [text], t);
    return this;
  }
}