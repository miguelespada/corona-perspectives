/*
 * WebGL 3D visual representation of the data. 
 */
APP.ViewLineDashed = function( model ) {

	// constants
	var DEFAULT_SPEED    = 0.05,
		DEFAULT_SCALE    = 3.5,
		DEFAULT_OPACITY  = 0.8,
		DEFAULT_LOW_EDGE = 0.0;

	// private
	var scope = this,

		model = model,

		scene,
		renderer,

		lines,			// THREE.Line
		material,		// material for lines
		uniforms,		// material uniforms
		attributes,		// material attributes		

		linewidth = 1,

		arcLookup,		// [ node.id ] -> arc

		offsetSpeed = DEFAULT_SPEED,

		$domElement;	

	init();

	function init() {

		// init scene and renderer
		scene = new THREE.Scene();
		
		renderer = new THREE.WebGLRenderer( { 
			antialias : true
			// preserveDrawingBuffer : true	// needed for canvas2image
		} );
		renderer.setSize( $(window).width(), $(window).height() - 25 );

		// init material
		uniforms = {
			offset        : { type: 'f', value: 0.0 },
			totalDistance : { type: 'f', value: 0.0 },
			useNormalised : { type: 'f', value: 0.0 },
			opacity       : { type: 'f', value: DEFAULT_OPACITY },			
			scale         : { type: 'f', value: DEFAULT_SCALE },
			lowEdge       : { type: 'f', value: DEFAULT_LOW_EDGE }
		};

		// add to dom
		$domElement = $('<div id="layer-dashed"></div>');

		$domElement.append( $(renderer.domElement) );		

		// $('body').append( $domElement );
		$('section#matches').append( $domElement );

		// events
		model.on( 'selectedHotspotChange', onSelectedHotspotChange );
		model.on( 'selectedNodeChange', onSelectedNodeChange );
		model.on( 'overNodeChange', onOverNodeChange );
		model.on( 'playerColorChange', onPlayerColorChange );

		$(window).on( 'resize', onWindowResize );

	}

	// create arcs for the hotspot
	function createArcs( point ) {

		arcLookup = {};
		arcLookup.each = function( fn ) {
			for ( prop in this )	
				if ( typeof this[ prop ] === 'object' )
					fn( this[ prop ] );
		};

		var white = new THREE.Color( 0xffffff ),			
			color1 = model.getPlayerColor( 0 ).clone(),			
			color2 = model.getPlayerColor( 1 ).clone();			

		color1.lerpSelf( white, 0.3 );
		color2.lerpSelf( white, 0.3 );

		APP.Iterator.preorder( point, function( node ) {
			
			if ( node.data.kind !== 'arc' )
				return;

			var player    = node.data.player,
				positions = getSmoothed( node.data.vertices, 6 ),
				max       = positions.length,
				i;

			// arcs store info about vertices
			var arc = {
				positions : [],
				colors    : [],
				player    : player
			};

			// create linestrip

			// start vertex
			arc.positions.push( positions[ 0 ] );
			arc.colors.push( new THREE.Vector4( 0, 0, 0, 0 ) );

			for ( i = 0; i < max; i ++ ) {	

				var color = ( player === 0 )
				? new THREE.Vector4( color1.r, color1.g, color1.b, 1 )
				: new THREE.Vector4( color2.r, color2.g, color2.b, 1 );

				arc.positions.push( positions[ i ] );			
				arc.colors.push( color );
			}

			// end vertex
			arc.positions.push( positions[ max - 1 ] );
			arc.colors.push( new THREE.Vector4( 0, 0, 0, 0 ) );

			// store arc in lookup object
			arcLookup[ node.id ] = arc;

			// helper
			function getSmoothed( points, subdivisions ) {

				var smoothed  = [],					
					spline    = new THREE.Spline( points ),
					numPoints = points.length * subdivisions,
					position,
					i;

				//importante incluir punto final (<=) ?
				for ( i = 0; i <= numPoints; i ++ ) {

					position = spline.getPoint( i / numPoints );

					smoothed.push( new THREE.Vector3( position.x, position.y, position.z ) );
				}

				return smoothed;
			}
		});

	}

	function createObject3D() {

		attributes = { 
			customColor : { type : 'v4', value : [] },
			distance    : { type : 'f', value : [] },
			visible     : { type : 'f', value : [] }
		};
		material = new THREE.ShaderMaterial( {
			uniforms	   : uniforms,
			attributes	   : attributes,
			vertexShader   : APP.ViewLineDashed.vertexShader,
			fragmentShader : APP.ViewLineDashed.fragmentShader,
			blending	   : THREE.AdditiveBlending,
			depthTest	   : false,
			transparent	   : true
		});
		material.linewidth = linewidth;			

		var geometry = new THREE.Geometry();

		// fill attributes

		var distance = 0,
			delta = new THREE.Vector3(),
			color,
			vertex, prevVertex,
			i, max;

		arcLookup.each( function( arc ) {

			max = arc.positions.length;

			for ( i = 0; i < max; i ++ ) {

				vertex = arc.positions[ i ];		
				color = arc.colors[ i ];

				// calculate distance from vertex 0
				if ( prevVertex ) {
					delta.sub( prevVertex, vertex );					
					distance += delta.length();
				}

				geometry.vertices.push( vertex );
				attributes.distance.value.push( distance );
				attributes.customColor.value.push( color );
				
				prevVertex = vertex;
			}
		});

		// 
		uniforms.totalDistance.value = distance;

		lines = new THREE.Line( geometry, material, THREE.LineStrip );
		lines.matrixAutoUpdate = false;	

		scene.add( lines );

	}

	function clear() {

		uniforms.offset.value = 0;	// reset offset

		scene.remove( lines );
		lines = null;

	}

	function onSelectedHotspotChange( selectedHotspot ) {

		clear();

		// check not null
		if ( selectedHotspot ) {
			// calculateTotalLength();	// testing.... esto está fatal! hay que hacerlo cuando cambie el arbol en el modelo (dataTreeChange)

			// find the point
			var point = selectedHotspot.arcNode.parent;

			// re-create
			createArcs( point );
			createObject3D();

		}

	}

	function onSelectedNodeChange( node ) {

		clear();

		// show normalized version
		if ( node.data.kind === 'point' ) {			

			// --- SPEED 
			var ratio = 260 / node.data.len
				speed = 0.001 * ratio;
			// console.log( node.data.len, '--', speed );

			scope.setNormalised( true );
			scope.setScale( 0.99 );
			scope.setSpeed( speed );
			scope.setLowEdge( 0.9 );
			scope.setLineWidth( 2 );
			// scope.setOpacity( 0.5 );

			// re-create			
			createArcs( node );
			createObject3D();
		}

		// show dashed version
		else {

			scope.setNormalised( false );
			scope.setScale( DEFAULT_SCALE );
			scope.setSpeed( DEFAULT_SPEED );
			scope.setLowEdge( DEFAULT_LOW_EDGE );
			scope.setLineWidth( 1 );
			// scope.setOpacity( DEFAULT_OPACITY );
		}

	}

	function onOverNodeChange( event ) {

		var selected    = model.getSelectedNode(),
			currentOver = event.current,
			prevOver    = event.prev;

		// si el mouse entra en el nodo seleccionado
		if ( currentOver === selected )
			return;

		// si se produce un mouseout 
		if ( currentOver === null ) {		
			
			// si el mouse sale del nodo seleccionado
			if ( prevOver === selected )
				return;
			
			clear();			
			return;
		}		

		// re-create		
		clear();
		createArcs( currentOver );
		createObject3D();

	}

	function onPlayerColorChange( player ) {

		var color = model.getPlayerColor( player ).clone(),
			white = new THREE.Color( 0xffffff ),
			i, max;

		// aclarar el color
		color.lerpSelf( white, 0.3 );

		if ( ! arcLookup )
			return;

		arcLookup.each( function( arc ) {

			if ( arc.player === player ) {

				colors = arc.colors;
				max = colors.length;
				
				for ( i = 0; i < max; i ++ ) {

					colors[ i ].x = color.r;
					colors[ i ].y = color.g;
					colors[ i ].z = color.b;
				}
			}
		});

		attributes.customColor.needsUpdate = true;

	}

	function onWindowResize( event ) { 

		renderer.setSize( $(window).width(), $(window).height() - 25 ); 

	}	

	this.getDomElement = function() { 

		return $domElement; 

	}

	this.render = function( camera ) { 

		uniforms.offset.value -= offsetSpeed;

		renderer.render( scene, camera ); 

	}

	this.setOpacity = function( value ) { 

		uniforms.opacity.value = value; 

	}

	this.setNormalised = function( value ) {

		uniforms.useNormalised.value = (value) ? 1.0 : 0.0;

	}

	this.setSpeed = function( value ) {

		//uniforms.offset.value = 0;
		offsetSpeed = value;

	}

	this.setScale = function( value ) {

		uniforms.scale.value = value;

	}

	this.setLowEdge = function( value ) {

		uniforms.lowEdge.value = value;

	}

	this.setLineWidth = function( value ) {

		linewidth = value;

	}

};

APP.ViewLineDashed.vertexShader = [
	
	"uniform float useNormalised;",
	"uniform float totalDistance;",	// total distance of the line (arcs drawed during the point)
	"uniform float scale;",	

	"attribute vec4  customColor;",
	"attribute float distance;",	// distance from the begining of the line

	"varying vec4  vColor;",
	"varying float vDistance;",

	"void main() {",

	"	vColor = customColor;",

	"	vDistance = ( useNormalised == 1.0 ) ? ( distance / totalDistance ) : distance;",	
	"	vDistance *= scale;",	

	"	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

	"}"

].join('\n');

APP.ViewLineDashed.fragmentShader = [

	"uniform float offset;",
	"uniform float lowEdge;",
	"uniform float opacity;",	

	"varying float vDistance;",
	"varying vec4 vColor;",

	"float foo;",
	"float onOrOff;",

	"void main() {",

	"	onOrOff = mod( vDistance + offset, 1.0 );",			// trail [0.0..1.0]
	// "	onOrOff = step( onOrOff, 0.7 );",				// no trail
	"	onOrOff = smoothstep( lowEdge, 1.0, onOrOff );",	// small trail [lowEdge..1.0]

	"	gl_FragColor = vec4( vColor.rgb, vColor.a * onOrOff * opacity );",

	"}"

].join('\n');