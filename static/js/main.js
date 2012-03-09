
var useTestValues = false;

var defaultArray = [];
for (var i = 0; i < 64; i++)
	defaultArray.push(0);

// Hardcoded sequences for testing. Use array of 16 0's for production
var sequence = {
	melody: defaultArray,
	bass: defaultArray,
	bassdrum: defaultArray,
	snare: defaultArray,
	hihat: defaultArray,
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
	'happiness': 0,
	'excitement': 0,
	'confusion': 0,
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
			
			sequence[key] = data[key];//.splice(16);
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
	item.find('.bar span').css('width', Math.abs(parameters[name]) + '%');
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
	this.division = 16;
	/**
	 * The number of beats per grid line
	 */
	this.subdivision = 1;
	
	this.joinTop = false;
	this.joinBottom = false;
	
	this.mergeNotes = true;
	this.fillNotes = true;
	this.fillLength = 4;
	
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
		
		var lastPitch = 0;
		var x = 0;
		for (var i = 0; i < sequence.length; i++) {
			var x1 = Math.round(x) + 1;
			var x2 = Math.round(x + hstep)
			var pitch = sequence[i];
			
			if (this.mergeNotes && i > 0 && sequence[i - 1] == sequence[i])
				x1 -= 1;
			
			if (this.fillNotes && i % this.fillLength != 0) {
				if (sequence[i] <= 0 && lastPitch > 0) {
					pitch = lastPitch;
					x1 -= 1;
				}
			}
			
			if (pitch > 0) {
				var yy = Math.round(h - pitch * vstep)
					+ (this.jointop || this.joinBottom ? 1 : 0);

				c.fillRect(x1, yy, Math.round(x2 - x1), Math.round(vstep - 1));
			}
			
			x += hstep;
			lastPitch = pitch;
		}
	}
	
}

function RhythmRenderer(canvas, colors) {
	var r = new SequenceRenderer(canvas, colors);
	r.pitches = 1;
	r.noteWidth = 9;
	r.mergeNotes = false;
	
	return r;
}


function getParamText(name, value) {
	value = Math.round(value);
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
		
		var item = $('<li>').attr('data-param', key).append(
			$('<span class="name">').html(getParamText(key, parameters[key])),
			$('<span class="bar">').append(
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
    console.log("IF this runs, rj is a poopyhead");
	
	var firstUpdate = true;
	
	// If an instrument has 2x the resolution of other instruments,
	// set its subdivision to 2.
	
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
	
	renderers.snare.colors.note = renderers.bassdrum.colors.note
		= renderers.hihat.colors.note = '#3d89a0';
	
	renderers.melody.subdivision = renderers.bass.subdivision
		= renderers.snare.subdivision = renderers.bassdrum.subdivision
		= renderers.hihat.subdivision = 1;
	
	renderAll();
	buildParams();
	
	if (useTestValues) {
		var testTweet = {
			userimgurl: 'https://twimg0-a.akamaihd.net/profile_images/426806419/Kana_reasonably_small.png',
			displayname: 'Joel Spadin',
			username: 'ChaosinaCan',
			raw_input: '@sigumusicuiuc, blah blah blah blah blah. Testing testing, blah blah blah blah blah. Testing testing, blah blah blah blah blah. 140 reached',
			url: 'http://google.com',
			params: {
				'Failness': 4,
				'Awesome': -6,
				'Derp': 10,
				'Eels': 0,
				'Pandas': 42,
				'Downvotes': 2,
			}
		}

		for (var i = 0; i < 5; i++)
			addTweet(testTweet, true);
	}
	
	if (window.io === undefined) {
		console.error('Could not connect to Node server.');
		return;
	}
	
	socket = io.connect('/');
	console.log(socket);
	
   socket.on('test',function(data) {
      console.log("test data received");
      console.log(data);
   });

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
	    console.log("YO DAWG WE GOT US SOME NOTES");
	    console.log(data);
		setSequence(data);
	})
	
	socket.on('params', function(data) {
		setParams(data);
	      console.log("Yo we got some params for us : ",data);
	})
})

if (useTestValues) {
	sequence = {
		melody: [1,0,0,0, 0,0,7,0, 3,0,0,4, 1,1,2,2,  2,2,3,0, 4,5,7,6, 5,0,6,6, 6,6,5,0, 4,0,2,0, 1,0,0,0, 3,0,0,4, 1,1,2,2,  2,2,3,0, 4,5,7,6, 5,0,6,0, 8,0,6,0],
		bass: [1,1,1,1, 1,1,1,1, 1,1,1,1, 2,2,2,3, 5,0,8,0, 5,0,1,0, 1,0,8,0, 1,0,8,0, 2,2,2,2, 3,3,3,3, 5,5,5,5, 6,6,6,6, 2,2,3,3, 1,1,1,1, 0,0,0,0, 0,0,4,4 ],
		bassdrum: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0 ],
		snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0, 1,0,0,0 ],
		hihat: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0 ],
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
