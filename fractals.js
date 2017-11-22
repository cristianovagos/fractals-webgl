//----------------------------------------------------------------------------
//
// Global Variables
//

var gl = null; // WebGL context

var shaderProgram = null; 

var numLevels = 3;

var triangleVertexPositionBuffer = null;
	
var triangleVertexColorBuffer = null;

// The global transformation parameters

// The translation vector

var tx = 0.0;

var ty = 0.0;

var tz = 0.0;

// The rotation angles in degrees

var angleXX = 0.0;

var angleYY = 0.0;

var angleZZ = 0.0;

// The scaling factors

var sx = 0.75;

var sy = 0.75;

var sz = 0.75;

// NEW - Animation controls

var rotationXX_ON = 0;

var rotationXX_DIR = 1;

var rotationXX_SPEED = 1;
 
var rotationYY_ON = 0;

var rotationYY_DIR = 1;

var rotationYY_SPEED = 1;

var rotationZZ_ON = 0;

var rotationZZ_DIR = 1;

var rotationZZ_SPEED = 1;

// To allow choosing the way of drawing the model triangles

var primitiveType = null;
 
// To allow choosing the projection type

var projectionType = 0;
 
// For storing the vertices defining the triangles

var vertices = [
	
	-1.0, 0.0, -0.707, 
	0.0, 1.0, 0.707,  
	1.0, 0.0, -0.707, 

	1.0, 0.0, -0.707,  
	0.0, 1.0, 0.707,   
	0.0, -1.0, 0.707,   

	-1.0, 0.0, -0.707,
	0.0, -1.0, 0.707,  
	0.0, 1.0, 0.707,   

	-1.0, 0.0, -0.707, 
	1.0, 0.0, -0.707,  
	0.0, -1.0, 0.707   
];

// And their colour

var colors = [
				
	1.0, 0.0, 0.0,
	1.0, 0.0, 0.0,
	1.0, 0.0, 0.0,

	0.0, 1.0, 0.0,
	0.0, 1.0, 0.0, 
	0.0, 1.0, 0.0, 

	0.0, 0.0, 1.0,
	0.0, 0.0, 1.0,
	0.0, 0.0, 1.0,

	1.0, 1.0, 0.0,
	1.0, 1.0, 0.0,
	1.0, 1.0, 0.0		 			 
];

//----------------------------------------------------------------------------
//
// The WebGL code
//

//----------------------------------------------------------------------------
//
//  Rendering
//

// Handling the Vertex and the Color Buffers

function initBuffers() {	
	
	// Coordinates
		
	triangleVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);

	console.log(vertices);

	computeKochSnowflake();

	console.log(vertices);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	triangleVertexPositionBuffer.itemSize = 3;
	triangleVertexPositionBuffer.numItems = vertices.length / 3;			

	// Associating to the vertex shader
	
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
			triangleVertexPositionBuffer.itemSize, 
			gl.FLOAT, false, 0, 0);
	
	// Colors
		
	triangleVertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	triangleVertexColorBuffer.itemSize = 3;
	triangleVertexColorBuffer.numItems = colors.length / 3;			

	// Associating to the vertex shader
	
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
			triangleVertexColorBuffer.itemSize, 
			gl.FLOAT, false, 0, 0);
}

//----------------------------------------------------------------------------

//  Drawing the 3D scene

function drawScene() {
	
	var pMatrix;
	
	// Clearing with the background color
	
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	// NEW --- Computing the Projection Matrix
	
	if( projectionType == 0 ) {
		
		// For now, the default orthogonal view volume
		
		pMatrix = ortho( -1.0, 1.0, -1.0, 1.0, -1.0, 1.0 );
		
		// No need to move the model into the view volume !!
		
		tz = 0;
		
		// TO BE DONE !
		
		// Allow the user to control the size of the view volume
	}
	else {	

		// A standard view volume.
		
		// Viewer is at (0,0,0)
		
		// Ensure that the model is "inside" the view volume
		
		pMatrix = perspective( 45, 1, 0.05, 10 );
		
		tz = -1.5;

	}
	
	// Passing the Projection Matrix to apply the current projection
	
	var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	
	gl.uniformMatrix4fv(pUniform, false, new Float32Array(flatten(pMatrix)));
	
	// Computing the Model-View Matrix
	
	// Pay attention to the matrix multiplication order!!
	
	// First transformation ?
	
	// Last transformation ?
	
	var mvMatrix = mult( rotationZZMatrix( angleZZ ), 
	
						 scalingMatrix( sx, sy, sz ) );
						 
	mvMatrix = mult( rotationYYMatrix( angleYY ), mvMatrix );
						 
	mvMatrix = mult( rotationXXMatrix( angleXX ), mvMatrix );
						 
	mvMatrix = mult( translationMatrix( tx, ty, tz ), mvMatrix );
						 
	// Passing the Model View Matrix to apply the current transformation
	
	var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	
	gl.uniformMatrix4fv(mvUniform, false, new Float32Array(flatten(mvMatrix)));
	
	// Drawing the contents of the vertex buffer
	
	// primitiveType allows drawing as filled triangles / wireframe / vertices
	
	if( primitiveType == gl.LINE_LOOP ) {
		
		// To simulate wireframe drawing!
		
		// No faces are defined! There are no hidden lines!
		
		// Taking the vertices 3 by 3 and drawing a LINE_LOOP
		
		var i;
		
		for( i = 0; i < triangleVertexPositionBuffer.numItems / 3; i++ ) {
		
			gl.drawArrays( primitiveType, 3 * i, 3 ); 
		}
	}	
	else {
				
		gl.drawArrays(primitiveType, 0, triangleVertexPositionBuffer.numItems); 
		
	}       
}

//----------------------------------------------------------------------------
//
//  NEW --- Animation
//

// Animation --- Updating transformation parameters

var lastTime = 0;

function animate() {
	
	var timeNow = new Date().getTime();
	
	if( lastTime != 0 ) {
		
		var elapsed = timeNow - lastTime;
		
		if( rotationYY_ON ) {

			angleYY += rotationYY_DIR * rotationYY_SPEED * (90 * elapsed) / 1000.0;
		}
		
		// added
		if ( rotationXX_ON ) {
			angleXX += rotationXX_DIR * rotationXX_SPEED * (90 * elapsed) / 1000.0;
		}

		if ( rotationZZ_ON ) {
			angleZZ += rotationZZ_DIR * rotationZZ_SPEED * (90 * elapsed) / 1000.0;
		}
	}
	
	lastTime = timeNow;
}


//----------------------------------------------------------------------------

// Timer

function tick() {
	
	requestAnimFrame(tick);
	
	drawScene();
	
	animate();
}


//----------------------------------------------------------------------------
//
//  User Interaction
//

function outputInfos(){
		
}

//----------------------------------------------------------------------------

function setEventListeners(){
	
	// Dropdown list
	
	var projection = document.getElementById("projection-selection");
	
	projection.addEventListener("click", function(){
				
		// Getting the selection
		
		var p = projection.selectedIndex;
				
		switch(p){
			
			case 0 : projectionType = 0;
				break;
			
			case 1 : projectionType = 1;
				break;
		}  	
	});      

	// Dropdown list
	
	var list = document.getElementById("rendering-mode-selection");
	
	list.addEventListener("click", function(){
				
		// Getting the selection
		
		var mode = list.selectedIndex;
				
		switch(mode){
			
			case 0 : primitiveType = gl.TRIANGLES;
				break;
			
			case 1 : primitiveType = gl.LINE_LOOP;
				break;
			
			case 2 : primitiveType = gl.POINTS;
				break;
		}
	});      

	// Button events
	
	document.getElementById("YY-on-off-button").onclick = function(){
		
		// Switching on / off
		
		if( rotationYY_ON ) {
			
			rotationYY_ON = 0;
		}
		else {
			
			rotationYY_ON = 1;
		}  
	};

	document.getElementById("XX-on-off-button").onclick = function(){
		
		// Switching on / off
		
		if( rotationXX_ON ) {
			
			rotationXX_ON = 0;
		}
		else {
			
			rotationXX_ON = 1;
		}  
	};


	document.getElementById("ZZ-on-off-button").onclick = function(){
		
		// Switching on / off
		
		if( rotationZZ_ON ) {
			
			rotationZZ_ON = 0;
		}
		else {
			
			rotationZZ_ON = 1;
		}  
	};

	document.getElementById("YY-direction-button").onclick = function(){
		
		// Switching the direction
		
		if( rotationYY_DIR == 1 ) {
			
			rotationYY_DIR = -1;
		}
		else {
			
			rotationYY_DIR = 1;
		}  
	};
	
	document.getElementById("XX-direction-button").onclick = function(){
		
		// Switching the direction
		
		if( rotationXX_DIR == 1 ) {
			
			rotationXX_DIR = -1;
		}
		else {
			
			rotationXX_DIR = 1;
		}  
	}; 

	document.getElementById("ZZ-direction-button").onclick = function(){
		
		// Switching the direction
		
		if( rotationZZ_DIR == 1 ) {
			
			rotationZZ_DIR = -1;
		}
		else {
			
			rotationZZ_DIR = 1;
		}  
	}; 

	document.getElementById("YY-slower-button").onclick = function(){
		
		rotationYY_SPEED *= 0.75;  
	};    
	
	document.getElementById("XX-slower-button").onclick = function(){
		
		rotationXX_SPEED *= 0.75;  
	};  

	document.getElementById("ZZ-slower-button").onclick = function(){
		
		rotationZZ_SPEED *= 0.75;  
	};  

	document.getElementById("YY-faster-button").onclick = function(){
		
		rotationYY_SPEED *= 1.25;  
	};   
	
	document.getElementById("XX-faster-button").onclick = function(){
		
		rotationXX_SPEED *= 1.25;  
	};

	document.getElementById("ZZ-faster-button").onclick = function(){
		
		rotationZZ_SPEED *= 1.25;  
	};

	document.getElementById("reset-button").onclick = function(){
		
		// The initial values

		tx = 0.0;

		ty = 0.0;

		tz = 0.0;

		angleXX = 0.0;

		angleYY = 0.0;

		angleZZ = 0.0;

		sx = 1.0;

		sy = 1.0;

		sz = 1.0;
		
		rotationYY_ON = 0;
		
		rotationYY_DIR = 1;
		
		rotationYY_SPEED = 1;
	};      

	document.getElementById("face-culling-button").onclick = function(){
		
		if( gl.isEnabled( gl.CULL_FACE ) )
		{
			gl.disable( gl.CULL_FACE );
		}
		else
		{
			gl.enable( gl.CULL_FACE );
		}
	};      
}

//----------------------------------------------------------------------------
//
// WebGL Initialization
//

function initWebGL( canvas ) {
	try {
		
		// Create the WebGL context
		
		// Some browsers still need "experimental-webgl"
		
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
		
		// DEFAULT: The viewport occupies the whole canvas 
		
		// DEFAULT: The viewport background color is WHITE
		
		// NEW - Drawing the triangles defining the model
		
		primitiveType = gl.TRIANGLES;
		
		// DEFAULT: Face culling is DISABLED
		
		// Enable FACE CULLING
		
		gl.enable( gl.CULL_FACE );
		
		// DEFAULT: The BACK FACE is culled!!
		
		// The next instruction is not needed...
		
		gl.cullFace( gl.BACK );
		
	} catch (e) {
	}
	if (!gl) {
		alert("Could not initialise WebGL, sorry! :-(");
	}        
}

//----------------------------------------------------------------------------

function runWebGL() {
	
	var canvas = document.getElementById("my-canvas");
	
	initWebGL( canvas );

	shaderProgram = initShaders( gl );
	
	setEventListeners();

	initBuffers();
	
	tick();		// NEW --- A timer controls the rendering / animation    

	outputInfos();
}

//----------------------------------------------------------------------------
// The fractal code
//----------------------------------------------------------------------------

function computeSierpinskiGasket() {
    var v1 = [ -1.0,  0.0, -0.707 ];
    var v2 = [  0.0,  1.0,  0.707 ];
    var v3 = [  1.0,  0.0, -0.707 ];
    var v4 = [  0.0, -1.0,  0.707 ];

	vertices = [];
	vertexNormals = [];
	divideTetrahedron(v1, v2, v3, v4, numLevels);
	//computeVertexNormals(vertices, vertexNormals);
    //vertices = flatten( vertices );
}

function divideTetrahedron(v1, v2, v3, v4, recursionLevel) {
	if (recursionLevel < 2) {
		var coordinatesToAdd = [].concat(v1, v2, v3,
            v3, v2, v4,
            v4, v2, v1,
            v1, v3, v4);
        for (var i = 0; i < 36; i += 1) {
            vertices.push(coordinatesToAdd[i]);
        }
	}
	else {
		var vertex12 = computeMidPoint(v1, v2);
		var vertex13 = computeMidPoint(v1, v3);
		var vertex14 = computeMidPoint(v1, v4);
		var vertex23 = computeMidPoint(v2, v3);
		var vertex24 = computeMidPoint(v2, v4);
		var vertex34 = computeMidPoint(v3, v4);

		recursionLevel--;

		divideTetrahedron(v1, vertex12, vertex13, vertex14, recursionLevel);
		divideTetrahedron(vertex12, v2, vertex23, vertex24, recursionLevel);
		divideTetrahedron(vertex13, vertex23, v3, vertex34, recursionLevel);
		divideTetrahedron(vertex14, vertex24, vertex34, v4, recursionLevel);
	}
}

//--------------------------------------------------------------------//
// Tetrahedron Koch Snowflake

function computeKochSnowflake() {
		
		// Initial vertices of the Tetrahedron
		
		var v1 = [ -1.0,  0.0, -0.707 ];
		var v2 = [  0.0,  1.0,  0.707 ];
		var v3 = [  1.0,  0.0, -0.707 ];
		var v4 = [  0.0, -1.0,  0.707 ];
		
		// Clearing the vertices array;
		
		vertices = [];
		//var face1 = [ v1, v2, v3 ];
		//var face2 = [v3, v2, v4]
        //var face3 = [v4, v2, v1]
        //var face4 = [v1, v3, v4]
		divideFace( v1, v2, v3,  numLevels );
		
		divideFace( v3, v2, v4, numLevels );

		divideFace( v4, v2, v1, numLevels );
		
		divideFace( v1, v3, v4, numLevels );
		
		addVertexes ( v1, v2, v3, v4);
		
	}
	
function computeHeightofTriangle(side)
{
	var result = side / 2;
	result = result * Math.sqrt(3);
	return result;
}
	
function divideFace( v1, v2, v3, n )
	{
		if ( n == 0 ) {
			return;
		}
		
		else {
    
			// Compute new v
			
			var va = computeMidPoint( v1, v2);
				
			var vb = computeMidPoint( v2, v3);
			
			var vc = computeMidPoint( v1, v3);
			
			// Calculate the centroid
        
			var midpoint = computeCentroid( va, vb, vc );
			var normal;
			//Descobrir o vetor unitario perpenciular
			var normalVector = computeNormalVector( v1, v2, v3 );
			
			// Using the height of an equilateral triangle
			var height = computeHeightofTriangle(computeDistance(va, vb ));
			
			normalVector[0] = normalVector[0] * height;			
			normalVector[1] = normalVector[1] * height;	
			normalVector[2] = normalVector[2] * height;
			
			var vH = addVector(midpoint, normalVector);
			console.log(normalVector);
			// TESTING
			
			//var v2 = midpoint;
			
			--n;

			// 4 new line segments
			divideFace( va, vb, vH, n );
			divideFace( va, vH, vc, n );			
			divideFace( vb, vc, vH, n );
			divideFace( vb, vc, vH, n );
			//divideFace( v1, va, vc, n );
			//divideFace( v2, vb, va, n );
			//divideFace( v3, vc, vb, n );

			addVertexes(va, vb, vc, vH);			
		}
	}
	
	function addVertexes ( v1, v2, v3, v4)
	{
		var coordinatesToAdd = [].concat(v1, v2, v3,
            v3, v2, v4,
            v4, v2, v1,
            v1, v3, v4);
        for (var i = 0; i < 36; i += 1) {
            vertices.push(coordinatesToAdd[i]);
        }
	}
	//-------------------------------------------------------------------//
	function addVector( u, v )
	{
		// No input checking!!
		
		var result = [];
		for ( var i = 0; i < u.length; ++i ) {
			result.push( u[i] + v[i] );
		}

		return result;
	}