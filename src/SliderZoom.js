APP.SliderZoom = function() {

	/*
	 * Dom element of the slider wrapped in a jquery obj.
	 */
	this.$domElement = null;

	// -------------------
	// private:
	// -------------------

	// var COLOR_HOVER   = '#555',
	// 	COLOR_DEFAULT = '#333',
	// 	COLOR_ACTIVE  = '#22cc77',
	var SLIDER_HEIGHT = 120;

	var scope = this,
		percent,
		$box,
		$slider,
		$bar,

		isDisabled,
		
		onChangeCallback = function( value ) {};

	init();

	function init() {

		// html
		var html = [				
			'<div id="slider-zoom">',
				'<div class="dragable">',
					'<div class="slider">',
						'<div class="bar"></div>',
						'<div class="box"></div>',
					'</div>',
				'</div>',
			'</div>',
		].join('');

		var $html = $(html);

		// public
		scope.$domElement = $html;

		// shortcuts
		$box    = $html.find('.box');
		$slider = $html.find('.slider');
		$bar    = $html.find('.bar');

		// events
		enable();

	}

	function enable() {

		if ( isDisabled )
			isDisabled = false;

		scope.$domElement.on( 'mousedown', onMousedown );
		$(document).on( 'mouseup', onMouseup );
		$(document).on( 'mouseout', onMouseout );

	}

	function disable() {

		isDisabled = true;

		scope.$domElement.off( 'mousedown', onMousedown );
		$(document).off( 'mouseup', onMouseup );
		$(document).off( 'mouseout', onMouseout );
		$(document).off( 'mousemove', onMousemove );
	}

	// subscribers

	function onMousedown( event ) {		

		$(document).on( 'mousemove', onMousemove );	

		event.stopPropagation();
		return false;

	}

	function onMouseup( event ) {

		$(document).off( 'mousemove', onMousemove );

	}

	function onMousemove( event ) {

		var sliderHeight = $slider.height(),
			mouseY = event.pageY - $slider.offset().top;				// local mouse y

		mouseY = sliderHeight - mouseY;		// value relative to bottom of slider
		
		percent = mouseY / sliderHeight * 100;
		percent = (percent > 100) ? 100 : (percent < 0) ? 0 : percent;	// clamp [0..100]

		updatePercent();
		
	}

	function onMouseout( event ) {

		// console.log( event.relatedTarget );

		// detect mouse out of browser
		if ( event.relatedTarget === null )
			$(document).off( 'mousemove', onMousemove );

	}
	
	function updatePercent() {
		
		$bar.css( 'height', percent + '%' );
		$box.css( 'bottom', percent + '%' );

		// a normalized value is passed to the handler
		onChangeCallback( percent * 0.01 );	

	}

	// -------------------
	// public:
	// -------------------

	/*
	 * Sets wath to do when the slider changes.
	 * IMPORTANT: allways asign a function to the callback!
	 * we don't check if it's a function (more performance)
	 * A normalized value is passed as parameter to the callback
	 */
	this.onChange = function( callback ) { 

		onChangeCallback = callback; 

	};	

	/*
	 * Get/set slider percentage
	 */
	this.getPercent = function() { return percent; }
	this.setPercent = function( value ) { 
		
		percent = value;

		updatePercent();

	}	

	/*
	 * Enable event listeners.
	 */
	this.enable = function() {

		enable();
		// scope.$domElement.css( 'opacity', 0.6 );
		scope.$domElement.removeClass( 'inactive' );
		
	}

	/*
	 * Enable event listeners.
	 */
	this.disable = function() {

		disable();
		// scope.$domElement.css( 'opacity', 0 );
		scope.$domElement.addClass( 'inactive' );

	}

	/*
	 * Default percent value for this slider
	 */
	this.defaultPercent = 0;

	/*
	 * Sets slider to default value
	 */
	this.reset = function() {

		this.setPercent( this.defaultPercent );

	}

	
	/*
	 * Apply current values. This will trigger the change callback
	 */
	this.apply = function() {

		updatePercent();

	}

	/*
	 * hack
	 */
	this.refreshWidth = function() {

	}

	
}