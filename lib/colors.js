import * as THREE from 'three';

export const red = new THREE.Color("red");
export const blue = new THREE.Color("blue");
export const green = new THREE.Color("green");
export const orange = new THREE.Color("orange");
export const purple = new THREE.Color("purple");
export const pink = new THREE.Color("pink");
export const white = new THREE.Color("white");
export const black = new THREE.Color("black");

export const teal = new THREE.Color(0, 0.86, 0.99);
export const lightgreen = new THREE.Color(0.7, 0.9, 0.7);
export const greyred = new THREE.Color(0.9, 0.6, 0.6);
export const grey = new THREE.Color(0.9, 0.9, 0.9);

export const color = (clr) => new THREE.Color(clr);
export const hsl = (h, s=0.9, l=0.8) => new THREE.Color().setHSL(h, s, l);
export const rgb = (r, g, b) => new THREE.Color().setRGB(r, g, b);
