
APP.CameraMouseControl = function( controls ) {

	var ANGLE_SPEED    = 0.002,
		ZOOM_SPEED     = 0.02,
		MAX_TILT_ANGLE = Math.PI / 5,
		MIN_TILT_ANGLE = -Math.PI / 2,
		MAX_DISTANCE   = 30,
		MIN_DISTANCE   = 2,

		scope = this,

		prevMouse = { x : 0, y : 0 },					// mouse coords at previous frame
		prevPolar = { pan : 0, tilt : 0, dist : 0 },	// camera polar coords at previous frame		

		controls = controls;


	init();

	this.enable = function() {

		$(document).on( 'mousedown', onMousedown );
		$(document).on( 'mouseup', onMouseup );

	};

	this.disable = function() {

		$(document).off( 'mousedown', onMousedown );
		$(document).off( 'mouseup', onMouseup );

	};	

	function init() {
		
		enable();

	}	

	function onMousemove( event ) {

		var newPan  = prevPolar.pan + (prevMouse.x - event.clientX) * ANGLE_SPEED;
		var newTilt = prevPolar.tilt + (prevMouse.y - event.clientY) * ANGLE_SPEED;
		
		// clamp tilt value
		newTilt = 
		( newTilt < MIN_TILT_ANGLE ) ? MIN_TILT_ANGLE : 
		( newTilt > MAX_TILT_ANGLE ) ? MAX_TILT_ANGLE : newTilt;

		controls.panAngle  = newPan;
		controls.tiltAngle = newTilt;

	}

	function onMousedown( event ) {
				
		$(document).on( 'mousemove', onMousemove );

		prevMouse.x = event.clientX;
		prevMouse.y = event.clientY;

		prevPolar.pan  = controls.panAngle;
		prevPolar.tilt = controls.tiltAngle;
		prevPolar.dist = controls.distance;		

		event.preventDefault();
		return false;

	}

	function onMouseup( event ) {

		$(document).off( 'mousemove', onMousemove );

	}

	function enable() {

		$(document).on( 'mousedown', onMousedown );
		$(document).on( 'mouseup', onMouseup );

	}

	function disable() {

		$(document).off( 'mousedown', onMousedown );
		$(document).off( 'mouseup', onMouseup );

	}

	// public

	this.enable = function() {

		enable();

	};

	this.disable = function() {

		disable();

	};

};
