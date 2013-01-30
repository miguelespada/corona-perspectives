// TO DO: crear clase separada para breadcrumbs y sliders

APP.BottomBar = function( model ) {

	var COLOR_HOVER   = '#333',
		COLOR_DEFAULT = '#282828',
		COLOR_ACTIVE  = '#4D4A43', //'#444', //'#22cc77', 
		COLOR_HOTSPOT = '#666';

	// add publisher functionality
	APP.utils.makePublisher( this );

	// data model
	var scope = this,

		model = model,

		divLookup = null,		// map: [ node.id ] -> $div

								// this divs are cached for optimization:
		$focusDiv,				// the $div that corresponds to model.selectedNode
		hotspotDivs = [],		// the $divs that correspond to model.hotspots		
		$domElement,			// bottom bar (wraps controls, timeline and menu)
		$controls,				// sliders
		$timeline,				// data filter
		$menu,					// navigation bar
		$breadcrubms,
		$controlsTimelineWrap,
		$mainNav,
		$matchNav,
		$matchNavSpans,

		// flags to prevent assingning listeners more than once
		isTimelineEnabled,
		isTimelineFoldingEnabled,
		isMenuBarFoldingEnabled,
		isMatchNavEnabled,

		isMouseDown = false;	

	var $tooltip;
	
	init();

	function init() {	

		$tooltip = $tooltip || $('<div id="tooltip"><span>12TH MATCH</span></div>');

		var html = [
			'<div id="bottomBar">',
						
				'<div id="controls-timeline-wrap">',
					'<div id="timeline"></div>',
					'<div id="controls">',
						// '<span id="timeline-toggle"></span>',
						'<ul id="breadcrubm">',
							'<li><span>.</span></li>',
							'<li><span>.</span></li>',
							'<li><span>.</span></li>',
							'<li><span>.</span></li>',
						'</ul>',
						'<ul id="sliders">',
							// sliders añadidos externamente
						'</ul>',
					'</div>',
				'</div>',

				'<div id="menu">',
					'<ul id="mainNav">',
						// '<li class="active"><span data-slug="matches">Home</span></li>',
						'<li><span data-slug="intro">Home</span></li>',
						'<li><span data-slug="makingof">Making Of</span></li>',
						'<li><span data-slug="about">About</span></li>',
					'</ul>',
					'<ul id="matchNav">',
						'<li><span data-id="nd">Nadal vs Djokovic (Rome 2011)</span></li>',
						'<li><span data-id="dm">Djokovic vs Murray (Rome 2011)</span></li>',
						'<li><span data-id="fn">Federer vs Nadal (London 2011)</span></li>',
					'</ul>',
				'</div>',	

			'</div>'
		].join('');

		$domElement = $( html );

		// cache divs
		$controlsTimelineWrap = $domElement.find( '#controls-timeline-wrap' );
		$controls    = $domElement.find( '#controls' );
		$timeline    = $domElement.find( '#timeline' );
		$menu        = $domElement.find( '#menu' );
		$breadcrubms = $domElement.find( '#breadcrubm li' );
		$mainNav     = $menu.find( '#mainNav' );
		$matchNavSpans = $menu.find( '#matchNav li span' );	
		$matchNav    = $menu.find( '#matchNav' );	

		// $('section#matches').append( $domElement );
		$('#sections').append( $domElement );

		// model event listeners
		model.on( 'dataTreeChange', onDataTreeChange );
		model.on( 'selectedNodeChange', onSelectedNodeChange );
		//model.on( 'hotspotsChange', onHotspotsChange );

		// hack to avoid unwanted camera dragging
		$domElement.on( 'mousedown', function( event ) {
			event.stopPropagation();
			return false;	// avoid text cursor
		});

		// 
		enableMatchNavigation();
		
	}

	function buildTimeline() {

		// look up object
		// TODO: move to separate class: APP.utils.map

		divLookup = {};
		divLookup.each = function( fn ) {
			for ( prop in this )	
				if ( typeof this[ prop ] === 'object' )
					fn( this[ prop ] );
		};

		// data-tree to dom-tree
		
		var dataRoot = model.getDataTree(),
			$matchDiv = $('<div>').addClass( 'match' );						

		$matchDiv.data( 'node', dataRoot );

		divLookup[ dataRoot.id ] = $matchDiv;
		
		parseTree( dataRoot, $matchDiv );
		
		// append to container

		$timeline.append( $matchDiv );

		// var $timelineToggle = $domElement.find( '#timeline-toggle' );
		// $timelineToggle.toggle(
		// 	function() { $controlsTimelineWrap.css( 'top', -150 ); }, 
		// 	function() { $controlsTimelineWrap.css( 'top', -40 ); }
		// );

		// helper

		function parseTree( node, dom ) {

			if ( node.data.kind === 'point' )
				return;

			var children = node.children,
				i, max = children.length;

			for ( i = 0; i < max; i ++ ) {

				var child = children[ i ],
					$div = $('<div>').addClass( child.data.kind );
				
				// div to data
				$div.data( 'node', child );

				// data to div
				divLookup[ child.id ] = $div;

				// append to parent
				$div.appendTo( dom );

				// recursion
				parseTree( child, $div );
			}
		};

	}

	function styleTimeline() {
		
		var $points = $timeline.find( '.point' ),
			$games  = $timeline.find( '.game' ),
			$sets   = $timeline.find( '.set' );

		// var color1 = new THREE.Color( 0x333333 ),
		// 	color2 = new THREE.Color( 0x999999 ),
		// 	c1 = '#' + color1.getHex().toString(16),
		// 	c2 = '#' + color2.getHex().toString(16);

		applyStyle( $points );
		applyStyle( $games );
		applyStyle( $sets );
		
		function applyStyle( $el ) {

			$el.each( function( index ) {

				var $this          = $(this),
					$parent		   = $this.parent(),
					points         = $this.hasClass( 'point' ) ? 1 : $this.find( '.point' ).size(),
					pointsInParent = $parent.find( '.point' ).size(),				
					width          = points / pointsInParent * 100;	// %

				$this.css( {
					'width':  width + '%'
					//'background-color': (index % 2) ? c1 : c2				
				});
			});
		};

	}

	function clearTimeline() {

		$timeline.empty();

	}

	function buildBreadcrumbs() {

		var rootNode = model.getDataTree(),
			matchName = rootNode.data.player1 + ' vs ' + rootNode.data.player2;

		// set store root data-node in match-breadcrumb
		$breadcrubms
		.eq( 0 )
		.find( 'span' )
		.html( matchName )
		.data( 'node', rootNode );

		// breadcrums event listeners
		$domElement.find( 'ul#breadcrubm' ).on( 'click', onBreadcrumbsClick );	// attach to <ul>

	}

	function clearBreadcrumbs() {

		$domElement.find( 'ul#breadcrubm' ).off( 'click', onBreadcrumbsClick );

	}

	// --------------------------
	// model events subscribers
	// --------------------------

	function onDataTreeChange() {

		$focusDiv = null,

		// refresh timeline
		clearTimeline();
		buildTimeline();
		styleTimeline();

		// refresh breadcrumbs
		clearBreadcrumbs();
		buildBreadcrumbs();

	}

	function onSelectedNodeChange( selectedNode ) {
		
		activateNode( selectedNode );
		
		// activateHotspots();
		
		updateBreadcrumbs( selectedNode );

	}

	function activateNode( node ) {

		// find div
		var $newFocus = divLookup[ node.id ];

		// deactivate current div
		if ( $focusDiv )
			$focusDiv
			.css( 'background-color', COLOR_DEFAULT )
			.css( 'background-image', 'url(./css/pixel.png)' )
			.removeClass( 'active' );

		// activate target div
		$newFocus
		// .css( 'background-color', COLOR_ACTIVE )
		.css( 'background-color', COLOR_DEFAULT )
		.css( 'background-image', 'url(./css/pixel-yellow.png)' )
		.addClass( 'active' );

		$focusDiv = $newFocus;

	}

	/*function activateHotspots() {

		var hotspots = model.getHotspots(),
			pointNode, $div,
			//color,
			i, max;

		// for every cached div:
		max = hotspotDivs.length;
		for ( i = 0; i < max; i ++ ) {

			$div = hotspotDivs[ i ];

			$div
			.css( 'background-color', COLOR_DEFAULT )
			.removeClass( 'active' );
		}

		// clear cached divs
		hotspotDivs = [];

		// for every hotspot in the model:
		max = hotspots.length;
		for ( i = 0; i < max; i ++ ) {

			// find corresponding div
			pointNode = hotspots[ i ].arcNode.parent;
			color 	  = hotspots[ i ].color.getHexString();
			$div      = divLookup[ pointNode.id ];

			$div
			.css( 'background-color', COLOR_HOTSPOT ) //'#'+color )
			.addClass( 'active' );

			hotspotDivs.push( $div );	// cache div
		}

	}*/

	// --------------------------
	// timeline mouse events
	// --------------------------

	function enableTimeline() {

		if ( isTimelineEnabled )
			return;

		isTimelineEnabled = true;

		// timeline click & drag control:

		var $match = $timeline.find( '.match' );	

		//$match.on( 'mouseup', onMouseup );	// no funciona si levantamos el raton fuera del timeline
		$('body').on( 'mouseup', onBodyMouseup );	// funciona en todo el documento
		$match.on( 'mousedown', onTimelineMousedown );		
		$match.on( 'mouseover', onTimelineMouseover );
		$match.on( 'mouseout', onTimelineMouseout );
		//$match.on( 'click', onClick );

	}
	function disableTimeline() {

		if ( ! isTimelineEnabled )
			return;

		isTimelineEnabled = false;

		var $match = $timeline.find( '.match' );	

		$('body').off( 'mouseup', onBodyMouseup );
		$match.off( 'mousedown', onTimelineMousedown );
		$match.off( 'mouseover', onTimelineMouseover );
		$match.off( 'mouseout', onTimelineMouseout );

	}

	function onTimelineMousedown( event ) {		

		scope.isMouseDown = true;

		var $target = $(event.target);	

		setFocus( $target );

		event.stopPropagation();
		return false;	// avoid text cursor

	}

	function onBodyMouseup( event ) {

		scope.isMouseDown = false;
		
	}

	function onTimelineMouseover( event ) {
		
		var $target = $(event.target);

		if ( scope.isMouseDown ) {
			setFocus( $target );				
			return;
		}	

		// ....tooltip
		if ( ! $target.hasClass( 'match' ) )
			updateTooltip( event ); 
		else
			$tooltip.remove();
		// ....

		if ( $target.hasClass( 'active' ) ) {			
			return;
		}	

		var isTooltip = $target.attr('id') === 'tooltip' || $target.is('span');
		if ( ! isTooltip )
			$target.css( 'background-color', COLOR_HOVER );		

		// testing ....
		// set model's over node
		var node = $target.data( 'node' );

		if ( node 													// si hay nodo
		&& node.data.kind === 'point' 								// si es un puto
		&& model.getSelectedNode().data.kind !== 'point' ) 			// si el nodo seleccionado no es un punto
		{	
			var isChildOfSelected = node.isDescendantOf( model.getSelectedNode() );
			if ( isChildOfSelected )
				model.selectOverNode( node );
			else 
				model.selectOverNode( null );
		}
		else {
			model.selectOverNode( null );
		}
		// .........
	
	}

	function onTimelineMouseout( event ) {
		
		var $target = $(event.target);

		if ( $target.hasClass( 'active' ) )
			return;
		
		var isTooltip = $target.attr('id') === 'tooltip' || $target.is('span');
		if ( isTooltip )
			return;
		
		$target.css( 'background-color', COLOR_DEFAULT );

	}

	// helper
	function updateTooltip( event ) {		

		var $target = $(event.target),
			node = $target.data( 'node' );

		if ( node ) {

			// $tooltip.appendTo( $target );

			// fixing glitch
			$tooltip.appendTo( $timeline );			
			
			$tooltip.css({
				top  : $target.offset().top - $timeline.offset().top - 38,
				left : $target.offset().left + $target.width() / 2,
			});
			
			$tooltip.children('span').html( APP.ordinals[ node.getIndex() ] + ' ' + node.data.kind );
			
		}

	}


	// ------------------------------
	// timeline-wrapper show/hide
	// ------------------------------

	function enableTimelineFolding() {

		if ( isTimelineFoldingEnabled )
			return;

		isTimelineFoldingEnabled = true;

		$controlsTimelineWrap.on( 'mouseenter', function( event ) { 

			$(this).css( 'top', -146 ); 
		} );

		$controlsTimelineWrap.on( 'mouseleave', function( event ) { 

			// remove tooltip				
			$tooltip.remove();

			// update model's over mouse
			model.selectOverNode( null );

			$(this).css( 'top', -40 );

		} );	

	}

	function disableTimelineFolding() {

		if ( ! isTimelineFoldingEnabled )
			return;

		isTimelineFoldingEnabled = false;

		$controlsTimelineWrap.off();

	}

	function hideTimelineWrap() {

		$controlsTimelineWrap.css( 'top', 0 );

		disableTimelineFolding();

	}

	function showTimelineWrap() {

		$controlsTimelineWrap.css( 'top', -40 );

		enableTimelineFolding();

	}

	// ------------------------------
	// match nav
	// ------------------------------

	function enableMatchNavigation() {

		if ( isMatchNavEnabled )
			return;		

		isMatchNavEnabled = false;

		$matchNav.on( 'mouseover', onMatchMousover );
		$matchNav.on( 'mouseout', onMatchMouseout );
		$matchNav.on( 'click', onMatchClick );

	}

	function disableMatchNavigation() {

		if ( ! isMatchNavEnabled )
			return;

		isMatchNavEnabled = false;

		$matchNav.off( 'mouseover', onMatchMousover );
		$matchNav.off( 'mouseout', onMatchMouseout );
		$matchNav.off( 'click', onMatchClick );

	}

	function onMatchMousover( event ) {

		var $target  = $(event.target);

		if ( ! $target.is( 'span' ) ) 
			return;
		
		if ( ! $target.parent().hasClass( 'active' ) )
			$target.css( 'opacity', 1 );

	}

	function onMatchMouseout( event ) {

		var $target = $(event.target);
			
		if ( ! $target.is( 'span' ) ) 
			return;
		
		if ( ! $target.parent().hasClass( 'active' ) )
			$target.css( 'opacity', 0.5 );

	}

	function onMatchClick( event ) {

		var $current = $(this).find( '.active' ),
			$target = $(event.target).parent();	

		if ( $current ) {
			$current.removeClass( 'active' );
			$current.children( 'span' ).css( 'opacity', 0.5 );
		}

		$target.addClass( 'active' );
		$target.children( 'span' ).css( 'opacity', 1 );
	}

	function hideMatchNavigation() {

		$matchNav.css( 'top', '50px' )

	}

	function showMatchNavigation() {

		$matchNav.css( 'top', '0px' )

	}

	// ------------------------------
	// helpers
	// ------------------------------

	function setFocus( $target ) {

		$tooltip.remove();
		
		// get associated node
		var node = $target.data( 'node' );	

		if ( node ) {

			scope.fire( 'focusChange', node );			
		}

	}

	// ugly implementation... 
	function updateBreadcrumbs( node ) {

		var	depth = node.getDepth(),			
			setNode   = model.getCurrentSet(),
			gameNode  = model.getCurrentGame(),
			pointNode = model.getCurrentPoint(),
			$span,
			ordinal;	

		// NOTE: dom-node index match data-node depth
		$breadcrubms.each( function( index ) {

			if ( index === 0 ) return;				

			if ( index < depth + 1 ) {

				$span = $(this).find( 'span' );

				// update text and data
				switch( index ) {
				case 1:	
					ordinal = ( setNode ) ? APP.ordinals[ setNode.getIndex() ] : "";		
					$span.html( ordinal + ' set' );
					$span.data( 'node', setNode );		// link this span to the data-node (used onClick)
					break;
				case 2:
					ordinal = ( gameNode ) ? APP.ordinals[ gameNode.getIndex() ] : "";
					$span.html( ordinal + ' game' );
					$span.data( 'node', gameNode );
					break;
				case 3:		
					ordinal = ( pointNode ) ? APP.ordinals[ pointNode.getIndex() ] : "";				
					$span.html( ordinal + ' point' );
					$span.data( 'node', pointNode );
					break;
				}

				// update opacity
				$(this).css( 'opacity', 1 );
			}

			else {

				$(this).css( 'opacity', 0 );
			}
		} );

	}

	function onBreadcrumbsClick( event ) {

		var $target = $(event.target);

		if ( $target.is( 'span' ) ) {

			model.selectNode( $target.data( 'node' ) );		// change model directly... 
		}

	}	

	// movido fuera porque necesitamos desactivar las vistas (están fuera del scope de Timeline)
	// function onMainNavClick( event )

	// ------------------------------------
	// public
	// ------------------------------------

	/*
	 * Add slider to the bar
	 */
	this.addSlider = function( params ) {

		var slider   = new APP.Slider( params.label ),
			$sliders = $domElement.find( '#sliders' );		

		slider.onChange( params.onChange );
		// slider.setPercent( params.value * 100 );
		slider.defaultPercent = params.value * 100;
		slider.$domElement.appendTo( $sliders );

		if ( params.isColor ) 
			slider.$domElement.addClass( 'color' );

		return slider;

	};

	// var isMenuLocked,		// whether menu bar is locked
	var	isTimelineHidden = true,	// whether timeline + sliders are hidden (and disabled)
		isMatchesHidden;	// whether match navigation is hidden (and disabled)

	this.hideMatches = function() {

		if ( isMatchesHidden )
			return;

		isMatchesHidden = true;

		disableMatchNavigation();
		hideMatchNavigation();

	}

	this.showMatches = function() {

		if ( ! isMatchesHidden )
			return;

		isMatchesHidden = false;

		enableMatchNavigation();
		showMatchNavigation();

	}

	this.hideTimeline = function() {

		// console.log( 'trying to hide timeline');

		if ( isTimelineHidden )
			return;

		// console.log( 'hiding timeline');

		isTimelineHidden = true;

		hideTimelineWrap();			
		disableTimeline();
		disableTimelineFolding();

	}

	this.showTimeline = function() {

		// console.log( 'trying to show timeline');

		if ( ! isTimelineHidden )
			return;

		// console.log( 'showing timeline');

		isTimelineHidden = false;

		showTimelineWrap();			
		enableTimeline();
		enableTimelineFolding();	

	}

	this.enableMainNav = function() {

	}

	this.disableMainNav = function() {

	}

	this.highlightMatch = function( id ) {		

		var $current = $(this).find( '.active' ),
			$target;

		$matchNavSpans.each( function() {
			if ( $( this ).attr( 'data-id' ) === id )
				$target = $( this );
		} );

		if ( $current ) {
			$current.removeClass( 'active' );
			$current.children( 'span' ).css( 'opacity', 0.5 );
		}

		$target.parent().addClass( 'active' );
		$target.css( 'opacity', 1 );

	}

};
