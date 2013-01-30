APP.Score = function( model ) {

	var scope = this,

		model = model,

		$domElement,
		$color1,
		$name1,
		$point1,
		$color2,
		$name2,
		$point2,

		players = [];


	init();

	function init() {

		var html = [
			'<div id="score">',
				'<div id="player1">',
					'<span class="color"></span>',
					'<span class="name">---</span>',
					'<span class="point">--</span>',
				'</div>',
				'<div id="player2">',
					'<span class="color"></span>',
					'<span class="name">-</span>',
					'<span class="point">--</span>',
				'</div>',
			'</div>'
		].join('');

		$domElement = $( html );

		// players = [ $domElement.find( '#player1'), $domElement.find( '#player2') ];
		
		$color1  = $domElement.find( '#player1 .color' );
		$name1   = $domElement.find( '#player1 .name' );
		$point1  = $domElement.find( '#player1 .point' );

		$color2  = $domElement.find( '#player2 .color' );
		$name2   = $domElement.find( '#player2 .name' );
		$point2  = $domElement.find( '#player2 .point' );

		$domElement.appendTo( $( 'section#matches' ) );

		model.on( 'dataTreeChange', onDataTreeChange );
		model.on( 'selectedNodeChange', onSelectedNodeChange );
		model.on( 'playerColorChange', onPlayerColorChange );

	}

	function onDataTreeChange() {

		// refresh names
		var matchData = model.getDataTree().data,
			namePlayer1 = matchData.player1.slice( 0, 3 ),
			namePlayer2 = matchData.player2.slice( 0, 3 );

		$name1.html( namePlayer1 );
		$name2.html( namePlayer2 );

		onSelectedNodeChange( model.getDataTree() );

	}

	function onSelectedNodeChange( selectedNode ) {

		// update score
		var setScore   = selectedNode.data.setScore,
			gameScore  = selectedNode.data.gameScore,
			pointScore = selectedNode.data.pointScore,
			service    = selectedNode.data.service;

		$point1.html( pointScore[ 0 ] );
		$point2.html( pointScore[ 1 ] );

		

		switch( service ){
		case '0':
			$color1.css( 'opacity', 1 );
			$color2.css( 'opacity', 0.3 );
			break;
		case '1':
			$color1.css( 'opacity', 0.3 );
			$color2.css( 'opacity', 1 );
			break;
		default:
			$color1.css( 'opacity', 1 );
			$color2.css( 'opacity', 1 );
			break;
		}

	}

	function onPlayerColorChange( player ) {

		var color = "#" + model.getPlayerColor( player ).getHexString();

		switch( player ){
		case 0:
			$color1.css( 'background-color', color );
			break;
		case 1:
			$color2.css( 'background-color', color );
			break;
		}

	}

	this.disable = function() {

		$domElement.css( 'opacity', 0 );

	}

	this.enable = function() {

		$domElement.css( 'opacity', 0.7 );

	}

};