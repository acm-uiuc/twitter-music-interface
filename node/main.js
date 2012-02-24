/**
 * To send data to the server, send a POST request to one of four places.
 * Make sure to send JSON encoded data and set the Content-Type header to
 * application/json when posting data.
 *
 * /tweets
 * Adds tweets to the server. Data should be an array of objects. Each object
 * represents one tweet. Data should look like this:
 *		
 *		[
 *			{
 *				"name": "User display name",
 *				"username": "The @username, but without the @.",
 *				"avatar": "URL of the display picture",
 *				"link": "Optional: a link to the specific tweet",
 *				"text": "The text in the tweet"
 *			},
 *			{ ... },
 *			{ ... }
 *		]
 * 
 * 
 * /notes
 * Sets the note sequences. Data should be an object containing arrays of 
 * pitches indexed by the name of the sequence. Data should look like this:
 * 
 *		{
 *			"melody": [ 0, 1, 2, 3, 4, 5, 6, 7 ],
 *			"bass": [ 0, 1, 2, 3, 4, 5, 6, 7 ],
 *			"snare": [ 0, 0, 0, 0, 1, 0, 0, 0 ],
 *			"bassdrum": [ 1, 0, 0, 0, 1, 0, 0, 0 ],
 *			"hihat": [ 0, 1, 0, 1, 0, 1, 0, 1, 0 ]
 *		}
 *		
 *	You may update individual sequences by omitting the other sequences.
 *	(e.g. you can update only the melody by sending only the melody.)
 * 
 * 
 * /params
 * Sets the parameter values. Data should be an object containing float
 * values [0-1] indexed by the name of the parameter.
 * Data should look like this:
 * 
 *		{
 *			"Param 1": 0.4,
 *			"Param 2": 0.8,
 *			"Param 3": 0.2,
 *			...
 *		}
 * 
 * You may update individual parameters the same way as with notes.
 * 
 * 
 * /all
 * Sets tweets, notes and params all at once. Data should be an object 
 * containing three objects: tweets, notes and params. Each object should
 * be formatted as shown above.
 * Data should look like this:
 * 
 *		{
 *			tweets: [ ... ],
 *			notes: { ... },
 *			params: { ... }
 *		}
 *		
 *	To retrieve the data stored by the server, send a GET request to any of
 *	the above locations. Data will be returned encoded in JSON.
 */


var express = require('express'),
	 app = express.createServer(),
	 io = require('socket.io').listen(app);


var mimes = {
	text: {'Content-Type': 'text/plain'},
	json: {'Content-Type': 'application/json'},
}

var stored = {
	maxTweets: 6,
	tweets: [],
	notes: {},
	params: {}
}



/**
 * Socket.IO Communication
 */

io.configure(function() {
	//io.enable('browser client minification');
	//io.enable('browser client etag');
	//io.enable('browser client gzip');
	//io.set('log level', 1);
	io.set('log level', 2);
	io.set('transports', [ 
	  'websocket',
	  'flashsocket',
	  'htmlfile',
	  'xhr-polling',
	  'jsonp-polling',
	]);
})

io.sockets.on('connection', function(socket) {
	emitStoredData(socket);
	
	socket.on('get data', function() {
		emitStoredData(socket);
	})
})


function addTweets(data) {
	for (var i = 0; i < data.length; i++) {
		stored.tweets.push(data[i]);
	}
	
	while (stored.tweets.length > stored.maxTweets)
		stored.tweets.shift();
}

function emitTweets(data, socket) {
	socket = socket || io.sockets;
	console.log('sending tweets:', data);
	socket.emit('tweets', data);
}

function addNotes(data) {
	for (var key in data) {
		if (data.hasOwnProperty(key))
			stored.notes[key] = data[key];
	}
}

function emitNotes(data, socket) {
	socket = socket || io.sockets;
	console.log('sending notes:', data);
	socket.emit('notes', data);
}

function addParams(data) {
	for (var key in data) {
		if (data.hasOwnProperty(key))
			stored.params[key] = data[key];
	}
}

function emitParams(data, socket) {
	socket = socket || io.sockets;
	console.log('sending params:', data);
	socket.emit('params', data);
}

function emitStoredData(socket) {
	socket = socket || io.sockets;
	emitTweets(stored.tweets, socket);
	emitNotes(stored.notes, socket);
	emitParams(stored.params, socket);
}





/**
 * HTTP Communication
 */

function badRequest(res) {
	res.send('Bad Request', mimes.text, 400);
}

function sendOK(res) {
	res.send('OK', mimes.text, 200);
}

function sendJSON(res, data) {
	res.send(JSON.stringify(data), mimes.json, 200);
}



app.use(express.bodyParser());


app.get('/tweets', function(req, res) {
	sendJSON(res, stored.tweets);
})

app.post('/tweets', function(req, res) {
	addTweets(req.body);
	emitTweets(req.body);
	sendOK(res);
})

app.get('/notes', function(req, res) {
	sendJSON(res, stored.notes);
})

app.post('/notes', function(req, res) {
	addNotes(req.body);
	emitNotes(req.body);
	sendOK(res);
})

app.get('/params', function(req, res) {
	sendJSON(res, stored.params);
})

app.post('/params', function(req, res) {
	addParams(req.body);
	emitParams(req.body);
	sendOK(res);
})

app.get('/all', function(req, res) {
	sendJSON(res, {
		tweets: stored.tweets,
		notes: stored.notes,
		params: stored.params,
	})
})

app.post('/all', function(req, res) {
	if (req.body.tweets !== undefined) {
		addTweets(req.body.tweets);
		emitTweets(req.body.tweets);
	}
	
	if (req.body.notes !== undefined) {
		addNotes(req.body.notes);
		emitNotes(req.body.notes);
	}
	
	if (req.body.params !== undefined) {
		addParams(req.body.params);
		emitParams(req.body.params);
	}
	
	sendOK(res);
})

app.listen(8080);