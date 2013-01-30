
/*
 * WebGL 3D visual representation of the data. 
 */

// -------------------------------------------------------------------------------
// Maneja las vistas 3D añdiendo/eliminando de la escena para ahorrar recuros.
// Actualiza los elementos de forma recursiva (color, thickness, blendingmode).
// -------------------------------------------------------------------------------

APP.ViewGL = function( model ) {

	var sprite = THREE.ImageUtils.loadTexture( "./css/triangle.png" ); 

	var totalArcs = 0,
		maxOpacity_particle = 1.0,
		minOpacity_particle = 0.0,
		maxOpacity_line = 1.0,
		minOpacity_line = 0.0,

		scope = this,

		model = model,

		scene,
		renderer,

		viewLookup,		// map between nodes and views [ node.id ] -> { lines: LineView3D, particles: ParticleView3D }

		hotspotView,	// hotspot markers

		courtView,		// tennis court lines

		heatMapView,	// bounces on the floor

		$domElement;	// dom container

	init();

	function init() {

		// scene and renderer

		scene = new THREE.Scene();
		
		renderer = new THREE.WebGLRenderer( { 
			antialias : true,
			preserveDrawingBuffer : true	// needed for canvas2image
		} );
		renderer.setSize( $(window).width(), $(window).height() - 25 );
		renderer.autoClear = false;

		// non-destructible objects (these are created just once)		

		courtView = new APP.CourtView3D();		// tennis court
		heatMapView = new APP.HeatMapView();	// heat map

		scene.add( courtView.object3D );
		scene.add( heatMapView.object3D );

		// dom

		$domElement = $( '<div id="layer-gl"></div>' );
		$domElement.append( $( renderer.domElement ) );
		$domElement.appendTo( $( 'section#matches' ) );

		// events

		$(window).on( 'resize', onWindowResize );
		model.on( 'dataTreeChange', onDataTreeChange );
		model.on( 'selectedNodeChange', onSelectedNodeChange );	
		// model.on( 'selectedHotspotChange', onSelectedHotspotChange );	
		model.on( 'playerColorChange', onPlayerColorChange );

	}

	function build() {

		// look up object
		// TODO: move to separate class: APP.utils.map

		viewLookup = {};
		viewLookup.each = function( fn ) {
			for ( prop in this )	
				if ( typeof this[ prop ] === 'object' )
					fn( this[ prop ] );
		};

		// // court view

		// courtView = new APP.CourtView3D();

		// scene.add( courtView.object3D );

		// // heat map

		// heatMapView = new APP.HeatMapView();

		// scene.add( heatMapView.object3D );

		// particle and line views

		var setNodes = model.getDataTree().children,
			i, max = setNodes.length

		for ( i = 0; i < max; i ++ ) {

			var setNode = setNodes[ i ],
				lineView = new APP.LineView3D( setNode ),
				particleView = new APP.ParticleView3D( setNode );

			var view3D = {
				lines     : lineView,
				particles : particleView
			};

			viewLookup[ setNode.id ] = view3D;

			scene.add( lineView.object3D );
			scene.add( particleView.object3D );
		}	

	}

	// clear the scene
	function clear() {

		if ( ! viewLookup )
			return;

		// scene.remove( courtView.object3D );
		// scene.remove( heatMapView.object3D );
		
		viewLookup.each( function( view ) {

			var lines = view.lines,
				particles = view.particles;

			scene.remove( lines.object3D );
			scene.remove( particles.object3D );

			lines.destroy();
			particles.destroy();

		} );

		viewLookup = null;
	}

	// --------------------------
	// model events subscribers
	// --------------------------

	function onDataTreeChange() {

		clear();

		build();

		// set the color and opacity
		// onPlayerColorChange( 0 );
		// onPlayerColorChange( 1 );
		// scope.setCourtOpacity( 0.2 );

	}	

	function onSelectedNodeChange( selectedNode ) {
		
		var depth = selectedNode.getDepth();		

		// global opacity
		//scope.setLineOpacity( 1.0 );
		//scope.setParticleOpacity( 1.0 );

		// per-vertex opacity
		maxOpacity_line = 1.0;
		minOpacity_line = 0.0;

		switch ( depth ) {
			case 0:
				maxOpacity_line = 0.06; //0.04;
				maxOpacity_particle = 0.3;
				scope.setParticleSize( 2.0 );
				scope.setHeatScale = 13;
				break;
			case 1:
				maxOpacity_line = 0.08;
				maxOpacity_particle = 0.5;
				scope.setParticleSize( 2.5 );
				scope.setHeatScale = 10;
				break;
			case 2: 
				maxOpacity_line = 0.2;
				maxOpacity_particle = 0.5;
				scope.setParticleSize( 3.6 );
				scope.setHeatScale = 10;
				break;
			case 3:	
				maxOpacity_line = 0.35; //0.5;
				maxOpacity_particle = 0.8;
				scope.setParticleSize( 4.2 );
				scope.setHeatScale = 10;
				break;
		}				

		var setNodes, activeSetNode, setNode, view, lines, particles, i, max;

		// si el nodo seleccionado esta por encima del nivel de corte
		if ( depth < 1 ) {

			// setNodes = model.findChildrenNodes( selectedNode, 'set' ); not needed
			setNodes = selectedNode.children;
			max = setNodes.length;

			for ( i = 0; i < max; i ++ ) {

				setNode   = setNodes[ i ];
				view      = viewLookup[ setNode.id ];
				lines     = view.lines;
				particles = view.particles;

				// show all lines and particles
				lines.setAlpha( setNode, maxOpacity_line );						
				lines.attributes.customColor.needsUpdate = true;	
				lines.object3D.visible = true;			
				
				particles.setAlpha( setNode, maxOpacity_particle );			
				particles.attributes.customColor.needsUpdate = true;
				particles.object3D.visible = true;				
			}	
		}

		// si esta en el mismo nivel o inferior
		else {

			activeSetNode = model.findParentNode( selectedNode, 'set' );
			// setNodes = model.findChildrenNodes( model.getDataTree(), 'set' ); not needed
			setNodes = model.getDataTree().children;				
			max = setNodes.length;

			for ( i = 0; i < max; i ++ ) {

				setNode   = setNodes[ i ];
				view      = viewLookup[ setNode.id ];
				lines     = view.lines;
				particles = view.particles;

				if ( setNode === activeSetNode ) {					

					lines.setAlpha( setNode, minOpacity_line );
					lines.setAlpha( selectedNode, maxOpacity_line );						
					lines.attributes.customColor.needsUpdate = true;
					lines.object3D.visible = true;	
					
					particles.setAlpha( setNode, minOpacity_particle );			
					particles.setAlpha( selectedNode, maxOpacity_particle );			
					particles.attributes.customColor.needsUpdate = true;						
					particles.object3D.visible = true;	

				} else {

					lines.object3D.visible = false;
					particles.object3D.visible = false;
				}					
			};			
		}	

		// create new hotspot view
		if ( hotspotView )
			scene.remove( hotspotView.object3D );

		// hotspotView = new APP.HotspotView( model.getHotspots(), sprite );
		hotspotView = new APP.HotspotView( selectedNode.data.hotspots, sprite );

		scene.add( hotspotView.object3D );

		// test...
		heatMapView.generateHeatmap( selectedNode );

	}

	/*function onSelectedHotspotChange( selectedHotspot ) { 

		// atenuar trayectorias (todo: tween)
		var depth = model.getSelectedNode().getDepth(),
			opacityParticle = 0.4, 
			opacityLine = 0.6;

		// set max opacity
		switch ( depth ) {
			case 0:
				break;
			case 1:
				break;
			case 2: 
				opacityLine = 0.5;
				break;
			case 3:			
				break;
		}

		scope.setLineOpacity( opacityLine );
		scope.setParticleOpacity( opacityParticle );

		// TODO: make selected hotspot bigger and atenuate the rest ?

	}*/

	function onPlayerColorChange( player ) {

		var color = model.getPlayerColor( player );

		// update color in all views
		viewLookup.each( function( view ) {

			view.lines.setPlayerColor( player, color );
			view.particles.setPlayerColor( player, color );	

			view.lines.attributes.customColor.needsUpdate = true;					
			view.particles.attributes.customColor.needsUpdate = true;
		});

	}

	// ----------------------------
	// browser events subscribers
	// ----------------------------

	function onWindowResize( event ) { 

		renderer.setSize( $(window).width(), $(window).height() - 25 ); 

	}	

	// -------
	// public
	// -------
	
	this.getDomElement = function() { 

		return $domElement; 

	}

	this.render = function( camera ) { 

		renderer.clear( true );		// clear color buffer

		// renderizar textura heat map
		heatMapView.render( renderer );

		// renderizar toda la escena
		renderer.render( scene, camera ); 

	}

	// these are cheap to update as they are uniforms or ogl state related, 
	// they are sent once every frame and affect all vertices

	this.setLineBlending = function( value ) { 		

		viewLookup.each( function( view ) {
			view.lines.material.blending = value; 
		});

	}

	this.setLineThickness = function( value ) { 

		viewLookup.each( function( view ) {
			view.lines.material.linewidth = value; 
		});

	}

	this.setLineOpacity = function( value ) { 

		viewLookup.each( function( view ) {
			view.lines.uniforms.opacity.value = value; 
		});

	}
	
	this.setParticleBlending = function( value ) { 

		viewLookup.each( function( view ) {
			view.particles.material.blending = value; 
		});

	}	

	this.setParticleSize = function( value ) { 

		viewLookup.each( function( view ) {
			view.particles.uniforms.size.value = value; 
		});

	};

	this.setParticleOpacity = function( value ) { 

		viewLookup.each( function( view ) {
			view.particles.uniforms.opacity.value = value; 
		});

	};

	this.setCourtOpacity = function( value ) { 

		courtView.material.opacity = value; 

	};

	this.setHotspotsSize = function( value ) {

		viewLookup.each( function( view ) {
			hotspotView.particles.uniforms.size.value = value; 
		});
	};

	this.setHeatMapOpacity = function( value ) {

		//heatMapView.s
	};

	this.setHeatMapThreshold = function( value ) {

		heatMapView.setThreshlod( value );
	};

	this.setHeatMapScale = function( value ) {

		heatMapView.setHeatScale( value );
	};

	// testing.....
	this.hideHotspots = function() {

		if ( ! hotspotView ) return;
		
		// hotspotView.material.opacity = 0;

		$( hotspotView.material ).animate( { 	// call animate on the object
		    opacity: 0 						
		}, {
		    duration: 1000,
		    easing: 'linear',
		    step: function( now ) { // called for each animation step (now refers to the value changed)
				render();
		    }
		} );

	};
	this.showHotspots = function() {

		if ( ! hotspotView ) return;
		
		// hotspotView.material.opacity = 1;

		$( hotspotView.material ).animate( { 	// call animate on the object
		    opacity: 1						
		}, {
		    duration: 1000,
		    easing: 'linear',
		    step: function( now ) {
				render();
		    }
		} );

	};

};


// ------------------------------------------------------------------------------------------------------------------------
// Representacion visual de los arcos usando lineas 3d.
// ------------------------------------------------------------------------------------------------------------------------

APP.LineView3D = function( node ) {

	// model
	this.dataNode = node;

	// map between nodes and arcs: arcLookup[ node.id ] = arc
	this.arcLookup = {};

	// material
	this.uniforms   = null;
	this.attributes = null;
	this.material   = null;

	// object3d
	this.object3D = null;

	// init
	this.createArcs();
	this.createObject3D();

};

APP.LineView3D.prototype = {

	createArcs: function() {

		var	arcLookup = this.arcLookup;

		APP.Iterator.preorder( this.dataNode, function( node ) {
			
			if ( node.data.kind !== 'arc' )
				return;

			// arcs store info about vertices (smoothed)
			var arc = {
				positions : [],
				colors    : []
			};

			var player    = node.data.player,
				positions = getSmoothed( node.data.vertices, 6 ),
				max       = positions.length,
				i;

			// create linestrip

			// start vertex
			arc.positions.push( positions[ 0 ] );
			arc.colors.push( new THREE.Vector4( 0, 0, 0, 0 ) );

			// middle vertices
			for ( i = 0; i < max; i ++ ) {
				
				arc.positions.push( positions[ i ] );
				arc.colors.push( new THREE.Vector4( 1, 1, 1, 1 ) );	
			}

			// end vertex
			arc.positions.push( positions[ max - 1 ] );
			arc.colors.push( new THREE.Vector4( 0, 0, 0, 0 ) );

			// store arc in lookup object
			arcLookup[ node.id ] = arc;
		});

		function getSmoothed( points, subdivisions ) {

			var smoothed  = [],					
				spline    = new THREE.Spline( points ),
				numPoints = points.length * subdivisions,
				position,
				i;

			//importante incluir punto final (<=)
			for ( i = 0; i <= numPoints; i ++ ) {

				position = spline.getPoint( i / numPoints );

				smoothed.push( new THREE.Vector3( position.x, position.y, position.z ) );
			}

			return smoothed;
		}

	},

	createObject3D: function() {

		// create shader material (with default values)
		this.uniforms = {
			opacity : { type : 'f', value : 1.0 }
		};
		this.attributes = { 
			customColor : { type : 'v4', value : [] } 
		};
		this.material = new THREE.ShaderMaterial( {
			uniforms	   : this.uniforms,
			attributes	   : this.attributes,
			vertexShader   : APP.LineView3D.vertexShader,
			fragmentShader : APP.LineView3D.fragmentShader,
			blending	   : THREE.AdditiveBlending,
			depthTest	   : false,
			transparent	   : true
		});
		this.material.linewidth = 1;

		// create geometry
		var geometry        = new THREE.Geometry(),
			values_position = geometry.vertices,
			values_color    = this.attributes.customColor.value,
			arcLookup       = this.arcLookup,
			prop, arc, i, max;

		/* ATENCION! 
		 * los arrays contienen punteros a objetos almacenados en arcLookup (Vector3 y Vector4)
		 * modificar los objetos en arcLookup implica modificamos la geometría y los attributes!
		 */
		for ( prop in arcLookup ) {
			if ( arcLookup.hasOwnProperty( prop ) ) {

				arc = arcLookup[ prop ];
				max = arc.positions.length;

				for ( i = 0; i < max; i ++ ) {

     	 			values_position.push( arc.positions[ i ] );
     	 			values_color.push( arc.colors[ i ] )
     	 		}
   			}
		}

		// create 3d object
		this.object3D = new THREE.Line( geometry, this.material, THREE.LineStrip );
		this.object3D.matrixAutoUpdate = false;	

	},

	// sets alpha value of all descendant arcs of node
	setAlpha: function( node, value ) {

		var arcLookup = this.arcLookup,
			arc, colors, i, max;

		APP.Iterator.preorder( node, function( node ) {
		
			if ( node.data.kind === 'arc' ) {
					
				arc    = arcLookup[ node.id ];
				colors = arc.colors;
				max    = colors.length - 1;

				// discard arc ends
				for ( i = 1; i < max; i ++ ) {

					colors[ i ].w = value;
				}
			}
		});

		//this.attributes.customColor.needsUpdate = true;

	},

	setPlayerColor: function( player, color ) {

		var arcLookup = this.arcLookup,
			arc, colors,
			i, max;

		APP.Iterator.preorder( this.dataNode, function( node ) {
			
			if ( node.data.kind === 'arc' 
				&& node.data.player === player ) {
				
				arc    = arcLookup[ node.id ];
				colors = arc.colors;
				max    = colors.length - 1;
				
				// discard arc ends
				for ( i = 1; i < max; i ++ ) {

					colors[ i ].x = color.r;
					colors[ i ].y = color.g;
					colors[ i ].z = color.b;
				}			
			}
		});

		//this.attributes.customColor.needsUpdate = true;

	},

	destroy: function() {

		this.dataNode = null;

		this.arcLookup = null;

		this.uniforms = null;
		this.attributes = null;
		this.material = null;

		this.object3D = null;

	}

};

// Static. Inlined vertex shader for lines.
APP.LineView3D.vertexShader = [

	"attribute vec4 customColor;",		

	"varying vec4 vColor;",

	"void main() {",

	"	vColor = customColor;",

	"	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

	"}"

].join('\n');

// Static. Inlined fragment shader for lines.
APP.LineView3D.fragmentShader = [

	"uniform float opacity;",

	"varying vec4 vColor;",

	"void main() {",

	"	gl_FragColor = vec4( vColor.rgb, vColor.a * opacity );",

	"}"

].join('\n');


// -----------------------------------------------------------------------------------------------------------------------------
// Representación visual de los arcos usando particulas (una particula por cada rebote)
// -----------------------------------------------------------------------------------------------------------------------------

APP.ParticleView3D = function( node ) {

	// model
	this.dataNode = node;

	// map between nodes and arcs: arcLookup[ node.id ] = arc
	this.arcLookup = {};

	// material
	this.uniforms = null;
	this.attributes = null;
	this.material = null;

	// object3d
	this.object3D = null;

	// init
	this.createArcs();
	this.createObject3D();

};

APP.ParticleView3D.prototype = {

	createArcs: function() {

		var color1 = new THREE.Vector3( 0.0, 1.0, 0.7 ), // model.getPlayerColor( 0 ),
			color2 = new THREE.Vector3( 1.0, 0.0, 0.3 ), // model.getPlayerColor( 1 ),
			arcLookup = this.arcLookup;

		APP.Iterator.preorder( this.dataNode, function( node ) {
			
			if ( node.data.kind !== 'arc' )
				return;

			var player = node.data.player,
				positions = node.data.vertices,
				i, max = positions.length;

			// arcs store info about vertices
			var arc = {
				positions : [],
				colors    : [],
				sizes     : []
			};

			for ( i = 0; i < max; i ++ ) {												

				if ( i === 1 ) continue;	// solo los extremos de cada arco
				
				var position = positions[ i ];
				var color = ( player === 0 ) 
				? new THREE.Vector4( color1.x, color1.y, color1.z, 1.0 )
				: new THREE.Vector4( color2.x, color2.y, color2.z, 1.0 );				

				arc.positions.push( position );
				arc.colors.push( color );
				arc.sizes.push( 1.0 );
			}

			// store arc in lookup object
			arcLookup[ node.id ] = arc;
		});
	},

	createObject3D: function() {

		// create shader material (with defaut values)
		this.uniforms = { 
			size    : { type: 'f', value: 4.0 }, 
			opacity : { type: 'f', value: 1.0 }
		};
		this.attributes = { 
			customColor : { type: 'v4', value: [] }
		};		
		this.material = new THREE.ShaderMaterial( {
			uniforms	   : this.uniforms,
			attributes	   : this.attributes,
			vertexShader   : APP.ParticleView3D.vertexShader,
			fragmentShader : APP.ParticleView3D.fragmentShader,
			blending 	   : THREE.AdditiveBlending,
			depthTest	   : false,
			transparent	   : true
		});	

		// create geometry
		var geometry = new THREE.Geometry(),
			values_position = geometry.vertices,
			values_color = this.attributes.customColor.value,
			arcLookup = this.arcLookup,
			prop, arc, i, max;

		/* ATENCION! 
		 * los arrays contienen punteros a objetos almacenados en arcLookup (Vector3 y Vector4)
		 * modificar los objetos en arcLookup implica modificamos la geometría y los attributes!
		 */
		for ( prop in arcLookup ) {

			if ( arcLookup.hasOwnProperty( prop ) ) {

				arc = arcLookup[ prop ];
				max = arc.positions.length;
				
				for ( i = 0; i < max; i ++ ) {

     	 			values_position.push( arc.positions[ i ] );
     	 			values_color.push( arc.colors[ i ] );
     	 		}
   			}
		}

		// create 3d object
		this.object3D = new THREE.ParticleSystem( geometry, this.material );
		this.object3D.matrixAutoUpdate = false;	

	},

	// sets alpha value of all descendant arcs of node
	setAlpha: function( node, value ) {

		var arcLookup = this.arcLookup,
			arc, colors,
			i, max;

		APP.Iterator.preorder( node, function( node ) {
		
			if ( node.data.kind === 'arc' ) {
					
				arc    = arcLookup[ node.id ];
				colors = arc.colors;
				max    = colors.length;

				for ( i = 0; i < max; i ++ ) {

					colors[ i ].w = value;
				}
			}
		});

		//this.attributes.customColor.needsUpdate = true;

	},

	setPlayerColor: function( player, color ) {

		var arcLookup = this.arcLookup,
			arc, colors,
			i, max;

		APP.Iterator.preorder( this.dataNode, function( node ) {
			
			if ( node.data.kind === 'arc' 
				&& node.data.player === player ) {
				
				arc    = arcLookup[ node.id ];
				colors = arc.colors;
				max    = colors.length;
				
				for ( i = 0; i < max; i ++ ) {

					colors[ i ].x = color.r;
					colors[ i ].y = color.g;
					colors[ i ].z = color.b;
				}			
			}
		});

		//this.attributes.customColor.needsUpdate = true;

	},

	destroy: function() {

		this.dataNode = null;

		this.arcLookup = null;

		this.uniforms = null;
		this.attributes = null;
		this.material = null;

		this.object3D = null;

	}

};

APP.ParticleView3D.vertexShader = [

	"uniform float size;",
	
	"attribute vec4 customColor;",

	"varying vec4 vColor;",

	"void main() {",

	"	vColor = customColor;",

	"	gl_PointSize = size;",

	"	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

	"}"

].join('\n');

APP.ParticleView3D.fragmentShader = [

	"uniform float opacity;",

	"varying vec4 vColor;",

	"void main() {",

	"	gl_FragColor = vec4( vColor.rgb, vColor.a * opacity );",

	"}"

].join('\n');

// ---------------------------------------------------------------------------------------------------------------------
// Representación de zonas calientes
// ---------------------------------------------------------------------------------------------------------------------

APP.HotspotView = function( hotspots, sprite ) {

	// material	
	this.material = null;

	// object3d
	this.object3D = null;

	this.init( hotspots, sprite );

};

APP.HotspotView.prototype = {

	// create material
	init: function( hotspots, sprite ) {

		// create shader material (with defaut values)
		this.uniforms = { 
			size    : { type: 'f', value: 4.0 }, 
			opacity : { type: 'f', value: 1.0 }
		};
		this.attributes = { 
			customColor : { type: 'v4', value: [] }
		};
		this.material = new THREE.ParticleBasicMaterial( { 
			size        : 0.7, 
			color       : 0xffffff,
			map         : sprite, 
			blending    : THREE.AdditiveBlending, 
			depthTest   : false, 
			transparent : true,
			sizeAttenuation: true
		} );
		//materials[i].color.setHSV( color[0], color[1], color[2] );

		// create geometry
		var geometry = new THREE.Geometry();

		var values_position = geometry.vertices;
			values_color = this.attributes.customColor.value,
			i, max = hotspots.length;

		for ( i = 0; i < max; i ++ ) {

			values_position.push( hotspots[ i ].position );
			values_color.push( hotspots[ i ].color );
		}

		// create object 3d
		this.object3D = new THREE.ParticleSystem( geometry, this.material );
		this.object3D.matrixAutoUpdate = false;	
	}

};

// APP.HotspotView.vertexShader = [

// 	"uniform float size;",
	
// 	"attribute vec4 customColor;",

// 	"varying vec4 vColor;",

// 	"void main() {",

// 	"	vColor = customColor;",

// 	"	gl_PointSize = size;",

// 	"	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

// 	"}"

// ].join('\n');

// APP.HotspotView.fragmentShader = [

// 	"uniform float size;",
	
// 	"attribute vec4 customColor;",

// 	"varying vec4 vColor;",

// 	"void main() {",

// 	"	vColor = customColor;",

// 	"	gl_PointSize = size;",

// 	"	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

// 	"}"

// ].join('\n');

// ---------------------------------------------------------------------------------------------------------------------
// Representación de las lines del campo
// ---------------------------------------------------------------------------------------------------------------------

APP.CourtView3D = function() {

	// material	
	this.material = null;

	// object3d
	this.object3D = null;

	this.init();	

};

APP.CourtView3D.prototype = {
	
	init: function() {
			
		this.material = new THREE.LineBasicMaterial( { 
			linewidth 	: 2,
			color 		: 0x999999,						
			blending 	: THREE.NormalBlending, 
			transparent : true, 
			depthTest 	: false
		} );

		var geometry = new THREE.Geometry();
		geometry.vertices = [
			// rect exterior
			new THREE.Vector3( -5.48, 0,  11.89 ), // bl 
			new THREE.Vector3(  5.48, 0,  11.89 ), // br
			new THREE.Vector3(  5.48, 0,  11.89 ), 
			new THREE.Vector3(  5.48, 0, -11.89 ), // tr
			new THREE.Vector3(  5.48, 0, -11.89 ),
			new THREE.Vector3( -5.48, 0, -11.89 ), // tl
			new THREE.Vector3( -5.48, 0, -11.89 ),
			new THREE.Vector3( -5.48, 0,  11.89 ), // bl 
			// horizontal:
			new THREE.Vector3( -4.11, 0,  6.4 ),
			new THREE.Vector3(  4.11, 0,  6.4 ),			
			new THREE.Vector3( -5.48, 0,  0 ),	   // red
			new THREE.Vector3(  5.48, 0,  0 ),
			new THREE.Vector3( -4.11, 0, -6.4 ),
			new THREE.Vector3(  4.11, 0, -6.4 ),
			// vertical
			new THREE.Vector3( -4.11,  0,  11.89 ),
			new THREE.Vector3( -4.11,  0, -11.89 ),
			new THREE.Vector3(  0,     0, -6.4 ),
			new THREE.Vector3(  0,     0,  6.4 ),
			new THREE.Vector3(  4.11,  0,  11.89 ),
			new THREE.Vector3(  4.11,  0, -11.89 ),
			new THREE.Vector3(  0,     0,  11.89 ),
			new THREE.Vector3(  0,     0,  11.50 ),
			new THREE.Vector3(  0,     0, -11.89 ),
			new THREE.Vector3(  0,     0, -11.50 )
		];  

		this.object3D = new THREE.Line( geometry, this.material, THREE.LinePieces );
		this.object3D.matrixAutoUpdate = false;	

		this.material.opacity = 0.2;

	}

};

// ---------------------------------------------------------------------------------------------------------------------
// Heat map
// ---------------------------------------------------------------------------------------------------------------------


APP.HeatMapView = function() {

	// rtt stuff

	this.particlesMaterial = null;
	this.particles = null;

	this.sceneRTT = null;
	this.cameraRTT = null;
	this.renderTarget = null;

	this.particleTexture = null;
	this.particleTexture = null;

	// plane material

	this.uniforms = null;
	this.material = null;

	// object3d (plane)

	this.object3D = null;

	// init

	this.init();

};

APP.HeatMapView.prototype = {

	init: function() {

		// rtt 

		var resolution  = 20,
			planeWidth  = 12.8,
			planeHeight = 32;

		this.cameraRTT = new THREE.OrthographicCamera( -planeWidth/2, planeWidth/2, planeHeight/2, -planeHeight/2, -1000, 1000 );
		this.cameraRTT.rotation.x = -Math.PI / 2;
		this.cameraRTT.position.set( 0, 10, 0 );
		this.cameraRTT.matrixAutoUpdate = false;
		this.cameraRTT.updateMatrix();

		this.sceneRTT = new THREE.Scene();

		this.renderTarget = new THREE.WebGLRenderTarget( planeWidth * resolution, planeHeight * resolution, { 
			minFilter : THREE.LinearFilter, 
			magFilter : THREE.LinearFilter,
			format    : THREE.RGBFormat
		});	

		this.particleTexture = THREE.ImageUtils.loadTexture( "./css/particle.png" );
		this.gradientTexture = THREE.ImageUtils.loadTexture( "./css/gradient.png" );

		// particle material
		this.particlesMaterial =  new THREE.ParticleBasicMaterial( { 
			map        : this.particleTexture,
			size       : 1.0,
			opacity    : 1.0,
			blending   : THREE.AdditiveBlending,					
			depthWrite : false,
			// transparent : true
		});

		// plane material
		this.uniforms = {
			uTexArray : { type: "tv", value: 2, texture: [ this.renderTarget, this.gradientTexture ] }
		};
		this.material = new THREE.ShaderMaterial( {
			uniforms	   : this.uniforms,
			vertexShader   : APP.HeatMapView.vertexShader,
			fragmentShader : APP.HeatMapView.fragmentShader,
			blending	   : THREE.AdditiveBlending,
			depthTest	   : false,
			side           : THREE.DoubleSide
			// transparent	   : true
		});

		// plane object

		var geometry = new THREE.PlaneGeometry( planeWidth, planeHeight );

		this.object3D = new THREE.Mesh( geometry, this.material );
		this.object3D.rotation.x = - Math.PI/2;	
		this.object3D.updateMatrix();
		this.object3D.matrixAutoUpdate = false;

	},

	generateHeatmap: function( node ) {

		var geometry = new THREE.Geometry();
		var vertices, vertex, prevVertex;

		// get bounces on the floor (fill geometry)		

		APP.Iterator.preorder( node, function( node ) {

			if ( node.data.kind !== 'arc' ) 
				return;

			vertices = node.data.vertices;

			for ( i = 0, l = vertices.length; i < l; i ++ ) {

				vertex = vertices[ i ];

				if ( vertex.y === 0  &&  ! vertex.equals( prevVertex ) ) {

					geometry.vertices.push( vertex.clone() );
				}

				prevVertex = vertex;
			}
		});

		// create particle system (to be rendered into renderTarget)

		if ( this.particles )
			this.sceneRTT.remove( this.particles );

		this.particles = new THREE.ParticleSystem( geometry, this.particlesMaterial );
		this.sceneRTT.add( this.particles );
		
	},

	render: function( renderer ) {

		// Render particle scene into texture
		renderer.render( this.sceneRTT, this.cameraRTT, this.renderTarget, true );

	},

	setThreshlod : function( value ) {

		this.particles.material.opacity = value;

	},

	setHeatScale : function( value ) {

		this.cameraRTT.position.y = 1 + value;
		this.cameraRTT.updateMatrix();

	}
};

APP.HeatMapView.vertexShader = [

	"varying vec2 vUv;",

	"void main() {",

	"	vUv = uv;",

	"	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

	"}"

].join('\n');

APP.HeatMapView.fragmentShader = [
	
	"varying vec2 vUv;",

	"uniform sampler2D uTexArray[ 2 ];",	// textures only appear to work when contained in array?

	"void main() {",

	// "	gl_FragColor = texture2D( uTexArray[ 0 ], vUv );",
		
	"	float brighness = texture2D( uTexArray[ 0 ], vUv ).r;",			
		
	"	gl_FragColor = texture2D( uTexArray[ 1 ], vec2( brighness, 0.0 ) );",

	"}"

].join('\n');

/*APP.HeatMapView.vertexShader = [

	"#define RATIO 12.8 / 32.0",	// planeWidth / planeHeight

	"varying vec2 vUv;",

	"void main() {",

	"	vUv = vec2( uv.x * RATIO, uv.y );",

	"	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

	"}"

].join('\n');

APP.HeatMapView.fragmentShader = [
	
	"#define RADIUS 0.004",			// metaball radius
	"#define RATIO 12.8 / 32.0",	// planeWidth / planeHeight
	"#define MAX 3",				// max number of metaballs

	"uniform vec2 particles[ MAX ];",

	"varying vec2 vUv;",

	"float brighness;",

	"void main() {",
	
	"	brighness = 0.0;",
		
	"	for ( int i = 0; i < MAX; i++ ) {",

	"		brighness += RADIUS / length( vUv - vec2( particles[ i ].x * RATIO, particles[ i ].y ) );",		// metaball	
	
	"	}",

	 "	brighness = smoothstep( 1.0, 1.2, brighness );",
	
	"	gl_FragColor = vec4( brighness, brighness, brighness, 1.0 );",

	"}"

].join('\n');*/
