import * as THREE from 'three';
import { FontLoader } from '/external/three/FontLoader.js';
import { CSS2DObject } from '/external/three/CSS2DRenderer.js';
import { gsap } from '/external/gsap/all.js';
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
    constructor(position, size, color, opacity=0.0, scene=null, cloned_animations=null) {
      // Manually construct *non-centered* geometry.
      // same as THREE.PlaneGeometry(size.x, size.y, 1, 1)
      this.geometry = new THREE.BufferGeometry();
      this.geometry.parameters = {width: size.x, height: size.y};
      const vertices = [];
      const normals = [];
      const uvs = [];
      for( let iy = 0; iy < 2; iy ++ ) {
        const y = iy * size.y;
        for( let ix = 0; ix < 2; ix ++ ) {
          const x = ix * size.x;
          vertices.push( x, - y, 0 );
          normals.push( 0, 0, 1 );
          uvs.push(ix);
  				uvs.push(1 - iy);
         }
      }
      this.geometry.setIndex([0, 2, 1, 2, 3, 1]);
      this.geometry.setAttribute('position', new THREE.Float32BufferAttribute( vertices, 3 ) );
  	  this.geometry.setAttribute('normal', new THREE.Float32BufferAttribute( normals, 3 ) );
	  this.geometry.setAttribute('uv', new THREE.Float32BufferAttribute( uvs, 2 ) );
      this.material = simple_mat(color, opacity);
      this.mesh = new THREE.Mesh( this.geometry, this.material);
      this.mesh.position.x = position.x;
      this.mesh.position.y = position.y;
      this.mesh.position.z = position.z;
      this.timeline = gsap.timeline();
      this.cloned_animations = cloned_animations;
      this.animations = [];
      this.scene = scene;
      if(scene !== null) {
          scene.add(this.mesh);
      }
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
  clone(hide=true, reveal_time=null){
      let scene = hide ? null : this.scene;
      const box = new Box(this.position, this.size, this.color, this.opacity, scene, this.animations);
      box.scene = this.scene;
      if (hide && reveal_time != null) {
        box.replay();
        box.toScene(this.scene, reveal_time);
      }
      return box
  }
  replay(){
    for(let i = 0; i < this.cloned_animations.length; i++){
      this.cloned_animations[i](this);
    }
    return this;
  }
  toScene(scene, t) {
    this.timeline.call(scene => scene.add(this.mesh), [scene], t);
    return this;
  }
  // tweening
  toPosition(posn, t, d=null) {
    this.timeline.to(this.mesh.position, d!==null ? {...posn, duration: d} : posn, t);
    this.animations.push( (x) => x.toPosition(posn, t, d) );
    return this;
  }
  toColor(clr, t, d=null) {
      this.timeline.to(this.mesh.material.color, d!==null ? {...clr, duration: d} : clr, t);
      this.animations.push( (x) => x.toColor(clr, t, d) );
      return this;
  }
  toOpacity(opacity, t, d=null) {
      this.timeline.to(this.mesh.material, d!==null ? {opacity: opacity, duration:d} : {opacity: opacity}, t);
      this.animations.push( (x) => x.toOpacity(opacity, t, d) );
      return this;
  }
  toHide(t, d=0.0){
      this.toOpacity(0.0, t, d);
      return this;
  }
  toVisible(t, d=0.0){
      this.toOpacity(1.0, t, d);
      return this;
  }
  toSize(size, t) {
      // assume single segment
      const w = size.x;
      const h = size.y;
      const vertices = [];
      for ( let iy = 0; iy < 2; iy ++ ) {
        const y = iy * h;// - h/2.0;
        for ( let ix = 0; ix < 2; ix ++ ) {
          const x = ix * w;// - w/2.0;
          vertices.push( x, - y, 0 );
         }
      }
      this.timeline.to(this.mesh.geometry.attributes.position.array,
        {endArray: vertices,
         onUpdate: () => this.mesh.geometry.attributes.position.needsUpdate = true},
         t)
      this.timeline.to(this.geometry.parameters, {w: size.x, h: size.y}, t);
      return this;
    }
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
      console.log(this.geometry);
      this.boundingBox = this.geometry.boundingBox;
      const xMid = - 0.5 * (this.boundingBox.max.x - this.boundingBox.min.x);
      const yMid = 0.0; //- 0.5 * (this.boundingBox.max.y - this.boundingBox.min.y);
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
  toPosition(posn, t, d=null) {
      this.timeline.to(this.mesh.position, d!==null ? {...posn, duration: d} : posn, t);
      return this;
  }
  toColor(clr, t, d=null) {
      this.timeline.to(this.mesh.material.color, d!==null ? {...clr, duration: d} : clr, t);
    //   this.timeline.to(this.mesh.material.color, clr, t);
      return this;
  }
  toOpacity(opacity, t, d=null) {
      this.timeline.to(this.mesh.material, d!==null ? {opacity: opacity, duration:d} : {opacity: opacity}, t);
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
  toText(text, t) {
    const shapes = font.generateShapes(text, this.size);
    let geometry = new THREE.ShapeGeometry(shapes);
    geometry.computeBoundingBox();
    console.log(geometry);
    let boundingBox = geometry.boundingBox;
    const xMid = - 0.5 * (boundingBox.max.x - boundingBox.min.x);
    const yMid = 0.0; //- 0.5 * (boundingBox.max.y - boundingBox.min.y);
    geometry.translate(xMid, yMid, 0);
    this.geometry = geometry;
    this.boundingBox = boundingBox;
    this.timeline.call( function(obj, geometry) {
            obj.mesh.geometry.setIndex(geometry.index);
            obj.mesh.geometry.setAttribute('position', geometry.attributes.position );
            obj.mesh.geometry.attributes.position.needsUpdate = true;
            obj.mesh.geometry.setAttribute('normal', geometry.attributes.normal );
            obj.mesh.geometry.attributes.normal.needsUpdate = true;
            obj.mesh.geometry.setAttribute('uv', geometry.attributes.uv );
            obj.mesh.geometry.attributes.uv.needsUpdate = true;
        }, [this, geometry], t);
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
  toOpacity(opacity, t, d=null) {
      this.timeline.to(this.textDiv.style, d!==null ? {opacity: opacity, duration:d} : {opacity: opacity}, t);
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