
/*
 * Camera hover controller.
 */

APP.HoverControls = function( camera ) {

	// APP.utils.makePublisher( this );

	// private

	var scope = this;

	var currentPanAngle  = 0,		// current pan angle in radians
		currentTiltAngle = 0,		// current tilt angle in radians
		currentDistance  = 0;		// current distance		

	// shortcuts
	var tiltAngle, 
		panAngle, 
		distance, 
		target, 
		steps,
		sin = Math.sin,
		cos = Math.cos,
		abs = Math.abs;

	// API

	this.camera    = camera;
	this.camera.matrixAutoUpdate = false;

	this.target    = new THREE.Vector3( 0, 0, 0 );	// lookAt point

	this.distance  = 20;		// target distance to origin
	this.tiltAngle = 0;			// target elevation angle (radians)
	this.panAngle  = 0;			// target rotation arround y-axis (radians)
	this.steps     = 8;
	this.yfactor   = 1;
	this.autoRotateScale = 0;	// scales rotation speed
	// this.autoRotate = false;
	
	
	this.update = function( jumpTo ) {

		// auto-rotation 
		scope.panAngle += 0.003 * this.autoRotateScale;

		tiltAngle = scope.tiltAngle;	// target tilt
		panAngle  = scope.panAngle;		// target pan	
		distance  = scope.distance;
		target    = scope.target;
		steps     = scope.steps;

		// ease distance
		if ( distance !== currentDistance ) {
			
			currentDistance += ( distance - currentDistance ) / ( steps + 1 );		

			// snap
			if ( abs( distance - currentDistance ) < 0.001 ) {
		        currentDistance = distance;
		    }
		}	

		// ease angles
		if ( tiltAngle !== currentTiltAngle || panAngle !== currentPanAngle ) {

            if ( jumpTo ) {
            	currentTiltAngle = tiltAngle;
            	currentPanAngle = panAngle;
            } else {
	        	currentTiltAngle += ( tiltAngle - currentTiltAngle ) / ( steps + 1 );
	       		currentPanAngle +=  ( panAngle - currentPanAngle ) / ( steps + 1 );
            }
            
			// snap coords if angle differences are close
            if ( ( abs( tiltAngle - currentTiltAngle ) < 0.001 ) && ( abs( panAngle - currentPanAngle ) < 0.001 ) ) {            	
                currentTiltAngle = tiltAngle;
                currentPanAngle = panAngle;
            }
        }		

		// spherical to cartesian
		var x = target.x + currentDistance * sin( currentPanAngle ) * cos( currentTiltAngle ),
        	z = target.y + currentDistance * cos( currentPanAngle ) * cos( currentTiltAngle ),
        	y = target.z - currentDistance * sin( currentTiltAngle ) * scope.yfactor;

        var cameraPosition = scope.camera.position;

        if ( ( cameraPosition.x === x ) && ( cameraPosition.y === y ) && ( cameraPosition.z === z ) ) 
            return false;
		
        // update camera position	
        cameraPosition.x = x;
        cameraPosition.y = y;
        cameraPosition.z = z;

        // update camera orientation
        scope.camera.lookAt( target );

        scope.camera.updateMatrix();
		
        return true;

	}	

}