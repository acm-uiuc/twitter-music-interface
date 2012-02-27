
var useTestValues = true;

// Hardcoded sequences for testing. Use array of 16 0's for production
var sequence = {
	melody: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	bass: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	bassdrum: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	hihat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
}

var renderers = {
	melody: null,
	bass: null,
	bassdrum: null,
	snare: null,
	hihat: null,
}

// List all the parameters here. Default values should probably be 0.
var parameters = {
	'Param 1': 0,
	'Param 2': 0,
	'Param 3': 0,
	'Param 4': 0,
	'Param 5': 0,
}


function setParams(data) {
	for (var key in data) {
		if (data.hasOwnProperty(key)) {
			parameters[key] = data[key];
			updateParam(key);
		}
	}
}

function setSequence(data) {
	for (var key in data) {
		if (data.hasOwnProperty(key)) {
			sequence[key] = data[key];
			renderSequence(key);
		}
	}
}

function renderSequence(name) {
	if (renderers[name])
		renderers[name].render(sequence[name]);
}

function renderAll() {
	for (var key in renderers) {
		if (renderers.hasOwnProperty(key))
			renderSequence(key);
	}
}

function updateParam(name) {
	var item = $('[data-param="' + name + '"]');
	if (parameters[name] < 0)
		item.addClass('negative');
	else
		item.removeClass('negative');
	
	item.find('.name').html(getParamText(name, parameters[name]));
	item.find('.bar span').css('width', Math.abs(parameters[name] * 100) + '%');
}


function SequenceRenderer(canvas, colors) {
	/**
	 * The canvas to render to
	 */
	this.canvas = canvas;
	
	/**
	 * The colors to use when rendering
	 * @type Object
	 * @property {color} background The background color
	 * @property {color} grid The color of the grid
	 * @property {color} downbeat The color of the grid for downbeats
	 * @property {color} note The color of notes
	 */
	this.colors = colors || {
		background: '#eee',
		grid: '#ccc',
		note: '#555',
	}
	
	/**
	 * The number of possible pitches in the sequence
	 */
	this.pitches = 8;
	/**
	 * The number of steps between downbeats
	 */
	this.division = 4;
	/**
	 * The number of beats per grid line
	 */
	this.subdivision = 1;
	
	this.joinTop = false;
	this.joinBottom = false;
	
	/**
	 * Renders a sequence to the canvas
	 * @param {number[]} sequence The sequence of pitches to render
	 */
	this.render = function(sequence) {
			
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;

		
		var c = canvas.getContext('2d');
		var w = canvas.width;
		var h = canvas.height;
		
		var hstep = (w - 1) / sequence.length;
		var vstep = (this.joinBottom ? h : (h - 1)) / this.pitches;
		
		this.renderGrid(c, w, h, hstep, vstep);
		this.renderNotes(c, w, h, hstep, vstep, sequence);
	}
	
	this.renderGrid = function(c, w, h, hstep, vstep) {
		c.fillStyle = this.colors.background;
		c.fillRect(0, 0, w, h);

		hstep *= this.subdivision;
		
		c.lineWidth = 1;
		c.lineCap = 'butt';
		c.strokeStyle = this.colors.grid;
		
		var i = 0;
		c.beginPath();
		for (var x = 0; x <= w; x += hstep) {
			var xx = Math.round(x) + 0.5;
			if (i == 0) {
				c.moveTo(xx, 0);
				c.lineTo(xx, h);
			}
			else {
				c.dashedLine(xx, 0, xx, h, [1, 1]);
			}
			
			i = (i + 1) % this.division;
		}
		c.stroke();
		
		c.beginPath();
		for (var y = 0; y <= h; y += vstep) {
			var yy = Math.round(y) + 0.5;
			if ((y == 0 && !this.joinTop) || y == h - 1) {
				c.moveTo(0, yy);
				c.lineTo(w, yy);
			}
			else {
				c.dashedLine(0, yy, w, yy, [1, 1]);
			}
		}
		c.stroke();
	}
	
	this.renderNotes = function(c, w, h, hstep, vstep, sequence) {
		// draw notes
		c.fillStyle = this.colors.note;
		
		var x = 0;
		for (var i = 0; i < sequence.length; i++) {
			var x1 = Math.round(x) + 1;
			var x2 = Math.round(x + hstep)
			var yy = Math.round(h - sequence[i] * vstep)
				+ (this.jointop || this.joinBottom ? 1 : 0);
			
			c.fillRect(x1, yy, Math.round(x2 - x1), Math.round(vstep - 1));
			x += hstep;
		}
	}
	
}

function RhythmRenderer(canvas, colors) {
	var r = new SequenceRenderer(canvas, colors);
	r.pitches = 1;
	r.noteWidth = 9;
	
	return r;
}


function getParamText(name, value) {
	value = Math.round(value * 100);
	if (value == 0)
		return value + '&ensp;' + name;
	else if (value > 0)
		return '+' + value + '&ensp;' + name;
	else
		return name + '&ensp;&minus;' + Math.abs(value);
}

function buildParams() {
	var list = $('#params');
	
	for (var key in parameters) {
		if (!parameters.hasOwnProperty(key))
			continue;
		
		var item = $('<div>').attr('data-param', key).append(
			$('<span>').addClass('name').html(getParamText(key, parameters[key])),
			$('<span>').addClass('bar').append(
				$('<span>')
					.css('width', Math.abs(parameters[key] * 100) + '%')
			)
		)
		
		if (parameters[key] < 0)
			item.addClass('negative');
		
		list.append(item);
	}
}



// Initialize the page

$(window).resize(renderAll);

$(document).ready(function() {
	
	var firstUpdate = true;
	
	renderers.melody = new SequenceRenderer($('#melody').get(0));
	renderers.melody.colors.note = '#9aa641';
	renderers.bass = new SequenceRenderer($('#bass').get(0));
	renderers.bass.colors.note = '#a82934';
	renderers.snare = new RhythmRenderer($('#snare').get(0));
	renderers.snare.joinBottom = true;
	renderers.bassdrum = new RhythmRenderer($('#bassdrum').get(0));
	renderers.bassdrum.joinTop = true;
	renderers.bassdrum.joinBottom = true;
	renderers.hihat = new RhythmRenderer($('#hihat').get(0));
	renderers.hihat.joinTop = true;
	renderers.hihat.subdivision = 2;
	renderers.snare.colors.note = renderers.bassdrum.colors.note
		= renderers.hihat.colors.note = '#3d89a0';
	
	renderAll();
	
	buildParams();
	
	if (useTestValues) {
		var testTweet = {
			avatar: 'https://twimg0-a.akamaihd.net/profile_images/426806419/Kana_reasonably_small.png',
			name: 'Joel Spadin',
			username: 'ChaosinaCan',
			text: '@sigumusicuiuc, blah blah blah blah blah. Testing testing, blah blah blah blah blah. Testing testing, blah blah blah blah blah. 140 reached'
		}

		for (var i = 0; i < 5; i++)
			addTweet(testTweet, true);
	}
	
	if (window.io === undefined) {
		console.error('Could not connect to Node server.');
		return;
	}
	
	socket = io.connect('http://localhost:8080/');
	
	socket.on('tweets', function(data) {
		console.log(data instanceof Array);
		if (!$.isArray(data))
			data = [data];
		
		console.log(data);
		
		for (var i = 0; i < data.length; i++) {
			console.log(i, data[i]);
			addTweet(data[i], firstUpdate);
		}
		
		firstUpdate = false;
	})
	
	socket.on('notes', function(data) {
		setSequence(data);
	})
	
	socket.on('params', function(data) {
		setParams(data);
	})
})

if (useTestValues) {
	sequence = {
		melody: [-1, 5, 8, 3, 4, 2, 1, 0, 1, 6, 7, 7, 2, 8, -1, 1],
		bass: [-1, 5, 8, 3, 4, 2, 1, 0, 1, 6, 7, 7, 2, 8, -1, 1],
		bassdrum: [1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1],
		snare: [0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1],
		hihat: [1,1,1,1, 1,0,1,0, 1,1,1,1, 0,1,0,1, 1,1,1,1, 1,0,1,0, 1,1,1,1, 0,1,0,1],
	}

	parameters = {
		'Param 1': 0,
		'Param 2': 0.5,
		'Param 3': -0.2,
		'Param 4': 1,
		'Param 5': -1,
	}

}


// http://stackoverflow.com/a/4663129/371344
var CP = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
if (CP.lineTo) {
    CP.dashedLine = function(x, y, x2, y2, da) {
        if (!da) da = [10,5];
        this.save();
        var dx = (x2-x), dy = (y2-y);
        var len = Math.sqrt(dx*dx + dy*dy);
        var rot = Math.atan2(dy, dx);
        this.translate(x, y);
        this.moveTo(0, 0);
        this.rotate(rot);       
        var dc = da.length;
        var di = 0, draw = true;
        x = 0;
        while (len > x) {
            x += da[di++ % dc];
            if (x > len) x = len;
            draw ? this.lineTo(x, 0): this.moveTo(x, 0);
            draw = !draw;
        }       
        this.restore();
    }
}