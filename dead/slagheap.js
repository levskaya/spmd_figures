
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
