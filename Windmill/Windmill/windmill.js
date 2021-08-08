"use strict";

var canvas;
var gl;

var bufferName, bufferSurname, bufferFlat, bufferRod,
	nameVertices, surnameVertices, flatVertices, rodVertices;
var vPosition;
var modelMatrix = mat4();
var modelMatrixLoc;

var viewMatrix = mat4();
var viewMatrixLoc;

var projectionMatrix = mat4();
var projectionMatrixLoc;

var pos3, scale3, rotation3; 
var color, colorLoc, speed;

var near = 1.0; 
var far = 20.0; 

var cameraTarget3;
var cameraPosition3;

var eye;
var at;
var up = vec3(0.0, 1.0, 0.0);

var  fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect;       

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
	
	aspect =  1;
	
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
	
	gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    pos3 = [0,-0.75,0];
    scale3 = [1, 1, 1];
	rotation3 = [0, 0, 0];
    color = [0,0,0,1];
    speed = 0.8;	
	
	cameraTarget3 = [0.0, 0.0, 0.0]; 
	cameraPosition3 = [0.0, 0.0, 4.0];

	
    // Make the letters
    nameVertices = [
        vec3(  -0.15,  -0.2, 0.06 ),  //a
        vec3(  0.15,  -0.2, 0.06 ),  //b
        vec3(  0.0, 0.3, 0.0 ),  //c
		
		vec3(  0.15,  -0.2, -0.06 ),  //d
		vec3(  -0.15,  -0.2, -0.06 ),  //g
		vec3(  0.15,  -0.2, 0.06 ),  //b
		vec3(  -0.15,  -0.2, 0.06 ),  //a
		vec3(  0.0, 0.3, 0.0 ),  //c
		vec3(  -0.15,  -0.2, -0.06 ),  //g	
    ];

    surnameVertices = [
        vec3(  0.0,  -0.05, 0.01 ), //a  //0.01 pervanenin kanadının kalınlığı
        vec3(  0.3,  -0.05, 0.01 ), //b
        vec3(  0.0,  0.05, 0.0 ), //c
        vec3(  0.3,  0.05, 0.0 ), //d
		
		vec3(  0.0,  0.05, -0.01 ), //g
		vec3(  0.3,  0.05, -0.01 ), //h
		vec3(  0.0,  -0.05, 0.0 ), //e
        vec3(  0.3,  -0.05, 0.0 ), //f

		vec3(  0.0,  -0.05, 0.01 ), //a
		vec3(  0.3,  -0.05, 0.01 ) //b      
    ];
	
	flatVertices = [
		vec3( 1.0, -1.0, 1.0 ), //c
		vec3( -1.0, -1.0, 1.0 ), //d		
		vec3( 1.0, -1.0, -1.0 ), //b
		vec3( -1.0, -1.0, -1.0 ) //a	
	];
	
	rodVertices = [
		
		vec3(  0.01,  0.0, -0.05 ), //a
		vec3(  -0.01,  0.0, -0.05 ), //b
		vec3(  -0.01,  0.02, -0.05 ),  //d
		vec3(  0.01,  0.02, -0.05 ),  //g
		
		vec3(  0.0,  0.01, 0.09 ), //c
		vec3(  0.01,  0.0, -0.05 ), //a
		vec3(  -0.01,  0.0, -0.05 ), //b
		vec3(  -0.01,  0.02, -0.05 ),  //d
		vec3(  0.0,  0.01, 0.09 ) //c
	];
	
	// Load the data into the GPU
    bufferFlat = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferFlat );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(flatVertices), gl.STATIC_DRAW );
	
    // Load the data into the GPU
    bufferName = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferName );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(nameVertices), gl.STATIC_DRAW );

    // Load the data into the GPU
    bufferSurname = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferSurname );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(surnameVertices), gl.STATIC_DRAW );
		
	// Load the data into the GPU
    bufferRod = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferRod );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(rodVertices), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 ); 
    gl.enableVertexAttribArray( vPosition );

	modelMatrixLoc = gl.getUniformLocation( program, "modelMatrix" );
	viewMatrixLoc = gl.getUniformLocation( program, "viewMatrix" );		
	colorLoc = gl.getUniformLocation( program, "color" );
	projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

	
	document.getElementById("fovySlider").oninput = function(event) {
        fovy = event.target.value;
    };
    document.getElementById("inp_camX").oninput = function(event) {
        cameraPosition3[0] = event.target.value;
    };
	document.getElementById("inp_camY").oninput = function(event) {
        cameraPosition3[1] = event.target.value;
    };
	document.getElementById("inp_camZ").oninput = function(event) {
        cameraPosition3[2] = event.target.value;
    };
	document.getElementById("inp_tarX").oninput = function(event) {
        cameraTarget3[0] = event.target.value;
    };
	document.getElementById("inp_tarY").oninput = function(event) {
        cameraTarget3[1] = event.target.value;
    };
	document.getElementById("inp_tarZ").oninput = function(event) {
        cameraTarget3[2] = event.target.value;
    }; 
    document.getElementById("inp_objX").oninput = function(event) {
        pos3[0] = event.target.value;
    };
    document.getElementById("inp_objY").oninput = function(event) {
        pos3[1] = event.target.value;
    };
	document.getElementById("inp_objZ").oninput = function(event) {
        pos3[2] = event.target.value;
    };
    document.getElementById("inp_obj_scale").oninput = function(event) {
        scale3[0] = event.target.value;
        scale3[1] = event.target.value;
		scale3[2] = event.target.value;
    };
    document.getElementById("inp_obj_rotationX").oninput = function(event) {
		rotation3[0] = event.target.value;
    };
	document.getElementById("inp_obj_rotationY").oninput = function(event) {
		rotation3[1] = event.target.value;
    };
	document.getElementById("inp_obj_rotationZ").oninput = function(event) {
		rotation3[2] = event.target.value;
    };
	document.getElementById("inp_wing_speed").oninput = function(event) {
        speed = parseFloat(event.target.value);
    };
    document.getElementById("redSlider").oninput = function(event) {
        color[0] = event.target.value;
    };
    document.getElementById("greenSlider").oninput = function(event) {
        color[1] = event.target.value;
    };
    document.getElementById("blueSlider").oninput = function(event) {
        color[2] = event.target.value;
    };


    render();

};


var theta = 0.0;
function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	eye = vec3(cameraPosition3[0], cameraPosition3[1], cameraPosition3[2]);
	at = vec3(cameraTarget3[0], cameraTarget3[1], cameraTarget3[2]);
	
    modelMatrix = mat4();
	viewMatrix = mat4();
	projectionMatrix = mat4();
    
	viewMatrix = lookAt(eye, at, up);	
	projectionMatrix = perspective(fovy, aspect, near, far);
	
	gl.uniformMatrix4fv( viewMatrixLoc, false, flatten(viewMatrix) );
	gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    
	
	//flat
    gl.uniform4fv( colorLoc, [0.8, 0.6, 0.2, 1.0] ); 
    gl.uniformMatrix4fv( modelMatrixLoc, false, flatten(modelMatrix) );
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferFlat );
	gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
	gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
	
    modelMatrix = mult(modelMatrix, translate(pos3[0],pos3[1],pos3[2]));
//  modelMatrix = mult(modelMatrix, rotateX(rotation3[0]));
	modelMatrix = mult(modelMatrix, rotateY(rotation3[1]));
//	modelMatrix = mult(modelMatrix, rotateZ(rotation3[2]));
	modelMatrix = mult(modelMatrix, rotate(rotation3[0], rotation3[1], rotation3[2], 1 ));
    
    modelMatrix = mult(modelMatrix, scalem(scale3[0],scale3[1],scale3[2]));
    gl.uniformMatrix4fv( modelMatrixLoc, false, flatten(modelMatrix) );
	gl.uniform4fv( colorLoc, flatten(color) );
	
	//gövde
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferName );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 ); 
	gl.drawArrays( gl.TRIANGLE_STRIP, 0, 21	);  
	
	//rod		
	gl.uniform4fv( colorLoc, [0.3,0.3,0.3,1.0] );
	modelMatrix = mult(modelMatrix, translate(0,0.225,0.05));
    gl.uniformMatrix4fv( modelMatrixLoc, false, flatten(modelMatrix));
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferRod );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 ); 
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 21	);  
	
	
    theta += speed;
    gl.uniform4fv( colorLoc, [0.0,1.0,0.0,1.0] );
    modelMatrix = mult(modelMatrix, rotateZ(theta));
	gl.uniformMatrix4fv( modelMatrixLoc, false, flatten(modelMatrix));
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferSurname );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );  
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 36 );

    gl.uniform4fv( colorLoc, [1.0,0.0,0.0,1.0] );
    modelMatrix = mult(modelMatrix, rotateZ(120));
	gl.uniformMatrix4fv( modelMatrixLoc, false, flatten(modelMatrix));
	gl.drawArrays( gl.TRIANGLE_STRIP, 0, 36 );
	
    gl.uniform4fv( colorLoc, [0.0,0.0,1.0,1.0] );
    modelMatrix = mult(modelMatrix, rotateZ(120));
	gl.uniformMatrix4fv( modelMatrixLoc, false, flatten(modelMatrix));
	gl.drawArrays( gl.TRIANGLE_STRIP, 0, 36 );
	
	
    window.requestAnimFrame(render);
}
