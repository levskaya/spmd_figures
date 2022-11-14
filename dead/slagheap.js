const geometry = new THREE.BufferGeometry();
const vertices = new Float32Array( [
	-1.0, -1.0,  -1.0,
	 1.0, -1.0,  -1.0,
	 1.0,  1.0,  -1.0,

	 1.0,  1.0,  -1.0,
	-1.0,  1.0,  -1.0,
	-1.0, -1.0,  -1.0
] );
geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
geometry.computeVertexNormals();
const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
const mesh = new THREE.Mesh( geometry, material );

const matDark = new THREE.LineBasicMaterial( {
    color: grey,
    side: THREE.DoubleSide
} );

const tl = gsap.timeline();


const vertices2 = new Float32Array(3*6);
for(let i=0; i<6; i++){
    vertices2[3*i]   = vertices[3*i];
    vertices2[3*i+1] = vertices[3*i+1];
    vertices2[3*i+2] = vertices[3*i+2];
}
tl.to(mesh.geometry.attributes.position.array,
        {endArray: vertices2,
         duration: 1,
         onUpdate: () => mesh.geometry.attributes.position.needsUpdate = true})

scene.add(mesh);
console.log(mesh.scale);

geometry.rotateX(0.3);
console.log(geometry.attributes.position);
tl.to(mesh.scale, {x: 2, y:1, z:1}, t);





// broken
function get_katex_dims(txt, sz) {
	// Awful hack of drawing to invisible div just to get rendered text bounding boxes for alignment.
	const measureDiv = document.createElement( 'div' );
	measureDiv.style.visibility = "hidden";
	measureDiv.style.position = 'absolute';
	measureDiv.style.fontSize = sz;
	measureDiv.style.top = '0px';
	document.body.appendChild( measureDiv );  // necessary to actually render
	renderText(txt, measureDiv);
	let rect = measureDiv.querySelector('.katex').getBoundingClientRect();
	measureDiv.remove();
	// NDC to world coords (assuming orthographic camera)
	let v0 = new THREE.Vector3((rect.left / window.innerWidth) * 2 - 1,
								- (rect.top / window.innerHeight) * 2 + 1,
								0).unproject(camera);
	let v1 = new THREE.Vector3((rect.right / window.innerWidth) * 2 - 1,
								- (rect.bottom / window.innerHeight) * 2 + 1,
								0).unproject(camera);
	return {w: v1.x - v0.x, h: v0.y - v1.y};
}

function make_label(txt, sz, x, y, alignment = "LB") {
	const testDiv = document.createElement( 'div' );
	testDiv.className = 'label';
	testDiv.style.fontSize = sz;
	renderText(txt, testDiv);
	const textDims = get_katex_dims(txt, sz);
	const testLabel = new CSS2DObject( testDiv );
	let px, py;
    switch(alignment[0]){
		case "L":
			px = x;
		break;
		case "C":
			px = x - textDims.w / 2.0;
		break;
		case "R":
			px = x - textDims.w;
		break;
	}
	switch(alignment[1]){
		case "B":
			py = y;
		break;
		case "M":
			py = y - textDims.h / 2.0;
		break;
		case "T":
			py = y - textDims.h;
		break;
	}
	testLabel.position.set( px, py, 0 );
	scene.add( testLabel );
	return testLabel
}

function mesh2dForEach(mesh2d, fn) {
	mesh2d.forEach( (x, i) => x.forEach((y, j) => fn(x, y, i, j) ));
}


// <!-- MathJax is still a special snowflake and requires top-level html script import/config.-->
// <!-- <script>
// 	MathJax = {
// 	  tex: {
// 		inlineMath: [['$', '$'], ['\\(', '\\)']]
// 	  },
// 	  svg: {
// 		fontCache: 'global'
// 	  }
// 	};
// </script>
// <script type="text/javascript" id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script> -->
