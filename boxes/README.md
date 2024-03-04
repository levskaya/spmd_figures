### Troubles

Turns out that by default transparent materials don't really work correctly in three.js?!
One sees flickering, unstable transparency, esp w. camera angle changes.

It's a known issue.  I thought this was what z-buffers were for, lol.
https://github.com/mrdoob/three.js/pull/24271

Damn it, am I really going to have to write a pile of shaders w. webGPU to get simple 
flat transparent material handled right?


https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.opacity
https://threejs.org/docs/scenes/material-browser.html#MeshStandardMaterial

hack hack hack
```
export function simple_mat(color, opacity) {
    let material = new THREE.MeshBasicMaterial( {
        color: color,
        transparent: true,
        opacity: opacity,
        // side: THREE.FrontSide,
        // blendAlpha: 1.0,
        // side: THREE.DoubleSide,
        // flatShading: true,
    } );
    // material.blending = THREE.CustomBlending; 
    // material.blendEquation = THREE.AddEquation; //default 
    // material.blendSrc = THREE.SrcAlphaFactor;  //default 
    // material.blendDst = THREE.OneMinusSrcAlphaFactor; //default
    return material;
}
```

Probably should just use wireframes and solid objects for this...
https://threejs.org/docs/#manual/en/introduction/Drawing-lines
