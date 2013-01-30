APP.Slider = function( name ) {

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
	var NAME_MARGIN   = 13,
		SLIDER_WIDTH  = 90;

	var scope = this,
		name  = name,
		closedWidth,
		percent,

		isDisabled,

		// $domElement,
		$box,
		$slider,
		$bar,
		
		onChangeCallback = function( value ) { };

	init();

	function init() {

		// html
		var html = [
			'<li>',				
				'<div class="name">' + name + '</div>',
				'<div class="dragable">',			
					'<div class="slider">',
						'<div class="bar"></div>',
						'<div class="box"></div>',
					'</div>',
				'</div>',				
			'</li>',
		].join('');		

		var $html = $(html);

		// shortcuts
		$box    = $html.find('.box');
		$slider = $html.find('.slider');
		$bar    = $html.find('.bar');

		// public
		scope.$domElement = $html;		

		// plegar desplegar
		scope.$domElement.on( 'mouseenter', onMouseenter );
		scope.$domElement.on( 'mouseleave', onMouseleave );

		// TODO: mover a Timeline y recorrer todos los sliders (de esta forma solo escuchamos un onLoadEvent)
		// refrescar posicion horizontal de los elementos en base a la anchura de .name.
		// es necesario esperar a que las fuentes se hayan cargado.
		/*$(window).on('load', function() {

				// inexplicablemente necesitamos ejecutar la funcion de intervalo 3 veces ?????
				// creo que esto tiene que ver con los espacios en los nombres ( si se eliminan los espacios no hace falta el intervalo)
				var count = 0;	

				var interval = setInterval( function() {

				var $dragable = scope.$domElement.find( '.dragable' ),
					$name 	  = scope.$domElement.find( '.name' );

				// cache value
				closedWidth = $name.width() + NAME_MARGIN * 2;

				// posicionar slider
				$dragable.css( 'left', closedWidth + 'px' ); 
				
				// actualizar anchura
				scope.$domElement.width( closedWidth );

				if ( count == 10 )
					clearInterval( interval );

				count++;

			}, 100 );			
			
		} );*/

		refreshWidth();

	}

	function refreshWidth() {

		var $dragable = scope.$domElement.find( '.dragable' ),
			$name 	  = scope.$domElement.find( '.name' );

		// cache value
		closedWidth = $name.width() + NAME_MARGIN * 2;

		// posicionar slider
		$dragable.css( 'left', closedWidth + 'px' );	

		// actualizar anchura
		scope.$domElement.width( closedWidth );

	}

	// subscribers

	function onMousedown( event ) {		

		if ( ! $(event.target).hasClass( 'name' ) )
			$(document).on( 'mousemove', onMousemove );	

		// .....
		// alertar a todos los sliders
		APP.Slider.isSliderHandled = true;

		event.stopPropagation();
		return false;

	}

	function onMouseup( event ) {

		// .....
		// alertar a todos los sliders
		APP.Slider.isSliderHandled = false;

		$(document).off( 'mousemove', onMousemove );

		// detect if mouse up has happened outside this slider.
		// console.log( $(event.target).closest('#sliders').length );
		if ( $(event.target).closest( scope.$domElement ).length === 0 ) {

			// scope.disable();
			onMouseleave();
		}

	}

	function onMousemove( event ) {

		var sliderWidth = $slider.width(),
			mouseX  = event.clientX - $slider.offset().left;			// local mouse x	
		
		percent = mouseX / sliderWidth * 100;
		percent = (percent > 100) ? 100 : (percent < 0) ? 0 : percent;	// clamp [0..100]

		updatePercent();
		
	}

	function onMouseout( event ) {

		// detect mouse out of browser
		if ( event.relatedTarget === null )
			$(document).off( 'mousemove', onMousemove );

	}

	// close slider
	function onMouseleave( event ) {

		if ( APP.Slider.isSliderHandled )
			return;

		scope.$domElement.width( closedWidth );
		scope.$domElement.find( '.name' ).css( 'opacity', 0.5 );
		scope.$domElement.find( '.dragable' ).css( 'opacity', 0 );

		scope.disable();

	}

	// open slider
	function onMouseenter( event ) {

		if ( APP.Slider.isSliderHandled )
			return;

		scope.$domElement.width( closedWidth + SLIDER_WIDTH + NAME_MARGIN );	
		scope.$domElement.find( '.name' ).css( 'opacity', 1 );
		scope.$domElement.find( '.dragable' ).css( 'opacity', 1 );

		scope.enable();

	}
	
	function updatePercent() {
		
		$bar.css( 'width', percent + '%' );
		$box.css( 'left', percent + '%' );

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

		if ( isDisabled )
			isDisabled = false;

		scope.$domElement.on( 'mousedown', onMousedown );
		$(document).on( 'mouseup', onMouseup );
		$(document).on( 'mouseout', onMouseout );
		
	}

	/*
	 * Disable event listeners.
	 */
	this.disable = function() {

		isDisabled = true;

		scope.$domElement.off( 'mousedown', onMousedown );
		$(document).off( 'mouseup', onMouseup );
		$(document).off( 'mouseout', onMouseout );
		$(document).off( 'mousemove', onMousemove );

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

		refreshWidth();

	}

	
}

// Hack to avoid sliders to show when another is being handled
// this tells us when a handler is currently being handled
APP.Slider.isSliderHandled = null;

