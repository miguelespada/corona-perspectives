
/*
 * Dom Particle Renderer.
 */

APP.ViewInteractive = function( model ) {

	APP.utils.makePublisher( this );

	var scope = this,
		model = model,
		divs  = [],
		// $cursor,
		$domElement,

		isEnabled;

	init();

	function init() {

		$domElement = $('<div id="layer-interactive"></div>');

		// $cursor = getCursorDiv();	

		// $('body').append( $domElement );
		$('section#matches').append( $domElement );

		// bind to model events
		// model.on( 'hotspotsChange', onModelHotspotsChange );
		model.on( 'selectedNodeChange', onModelSelectedNodeChange );

		// bind mouse events
		enable();

	}

	function build() {	
		
		// create one div per hotspot.
		// array elements inside $divs (views)
		// and hotspots (data) share the same index.
		// var hotspots = model.getHotspots()
		var hotspots = model.getSelectedNode().data.hotspots,
			$div,
			i, max = hotspots.length;
		
		for ( i = 0; i < max; i ++ ) {

			$div = $('<div class="particle"><div class="particle-rect"></div></div>');
			$div.data( 'index', i );

			// testing...
			//$div.append( getCursorDiv( hotspots[ i ].color ) );
			
			divs.push( $div );

			$domElement.append( $div );
		}		

	}

	function clear() {
		
		$domElement.empty();

		divs = [];

	}

	function enable() {

		if ( isEnabled )
			return;

		isEnabled = true;

		$domElement.on( 'click', onClick );	
		$domElement.on( 'mouseover', onMouseover );	
		$domElement.on( 'mouseout', onMouseout );	

		// hack
		$domElement.off( 'mouseover', bypass );	
		$domElement.off( 'mousedown', bypass );	

	}

	function disable() {

		isEnabled = false;

		$domElement.off( 'click', onClick );
		$domElement.off( 'mouseover', onMouseover );
		$domElement.off( 'mouseout', onMouseout );	

		// hack
		$domElement.on( 'mouseover', bypass );	
		$domElement.on( 'mousedown', bypass );	

	}	

	// -------------
	// subscribers
	// -------------

	// function onModelHotspotsChange() {
	function onModelSelectedNodeChange() {

		clear();
		build();

	}

	function onClick( event ) {

		if ( event.target === event.currentTarget )
			return;

		var $div  = $(event.target).closest( '.particle' ),
			index = $div.data( 'index' ),
			spot  = model.getSelectedNode().data.hotspots[ index ];

		scope.fire( 'spotClick', spot );

	}

	function onMouseover( event ) {

		if ( event.target === event.currentTarget )
			return;

		var $div  = $(event.target).closest( '.particle' ),
			index = $div.data( 'index' ),
			spot  = model.getSelectedNode().data.hotspots[ index ];
			

		// set model's over node (will be used to notify dashed lines)
		var point  = spot.arcNode.parent;
		model.selectOverNode( point );

	}

	function onMouseout( event ) {

		model.selectOverNode( null );

	}

	// avoid text selection
	function bypass( event ) {

		if ( $(event.target).is('.particle-rect') ) {
			event.preventDefault();
			return false;
		}
	}

	// --------
	// public
	// --------	

	this.getDomElement = function() { 

		return $domElement; 

	};

	this.render = function( camera ) {

		var halfWidth  = $domElement.width() / 2,
			halfHeight = ($domElement.height() - 25) / 2,			
			projScreenMat = new THREE.Matrix4(),
			// hotspots = model.getHotspots(),
			hotspots = (model.getSelectedNode()) ? model.getSelectedNode().data.hotspots : [],
			i, max = hotspots.length;

		projScreenMat.multiply( camera.projectionMatrix, camera.matrixWorldInverse );

		for ( i = 0; i < max; i ++ ) {

			var hotspot = hotspots[ i ],
				$div    = divs[ i ];

			// project particle position
			var vector = hotspot.position.clone();
			
			projScreenMat.multiplyVector3( vector );	// NDC (-1.0..1.0)
			
			var screenCoord = { 
				x : ( vector.x + 1 ) * halfWidth,
		        y : ( - vector.y + 1 ) * halfHeight
		    };

		    // clipping
		    if ( vector.z < -1  ||  vector.z > 1
		    	||  vector.x < -1  ||  vector.x > 1 
		    	||  vector.y < -1  ||  vector.y > 1 ) {
		    	
		    	$div.css( {
		    		visibility : 'hidden'
		    	});
		    
		    } else {

				$div.css( {
					visibility : 'visible',
					translateX : Math.ceil( screenCoord.x ),
					translateY : Math.ceil( screenCoord.y ),
					'z-index'  : Math.round( (1 - vector.z) * 10 )
				});
		    }
		}

		// https://github.com/mrdoob/three.js/issues/78
		/*function toScreenXY( position, camera, $div ) {

		    var pos = position.clone();
		    var projScreenMat = new THREE.Matrix4();
		    projScreenMat.multiply( camera.projectionMatrix, camera.matrixWorldInverse );
		    projScreenMat.multiplyVector3( pos );

		    return { x: (pos.x + 1) * $div.width() / 2 + $div.offset().left,
		         	 y: (- pos.y + 1) * $div.height() / 2 + $div.offset().top };

		}*/
	};

	this.setOpacity = function( value ) {

		// var i, max = divs.length;
		// for ( i = 0; i < max; i ++ )
		// 	divs[ i ].css( 'opacity', value );

		$domElement.css( 'opacity', value );

	};


	// testing..	
	function getCursorDiv( color ) {
		var $div = $( [
			'<div class="cursor">',
				'<div class="circle"></div>',
				'<div class="tri"></div>',
				'<div class="circ2"></div>',
				//'<div class="label">15|30</div>',
			'</div>'						
		].join('\n') );

		var colorStr = "#" + color.getHexString();
		$div.find('.circ2').css( 'background-color', colorStr );
		$div.find('.tri').css( 'border-top-color', colorStr );

		return $div;
		
	}

	this.disable = function() {

		disable();

		// $domElement.css( 'visibility', 'hidden' );
	}

	this.enable = function() {

		enable();

		// $domElement.css( 'visibility', 'visible' );
	}

};

