var express = require('express'),
	 app = express.createServer(),
	 io = require('socket.io').listen(app);


var mimes = {
	text: {'Content-Type': 'text/plain'},
	json: {'Content-Type': 'application/json'},
}


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
	
})




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

function emitTweets(data) {
	console.log('sending tweets:', data);
	io.sockets.emit('tweets', data);
}

function emitNotes(data) {
	console.log('sending notes:', data);
	io.sockets.emit('notes', data);
}

function emitParams(data) {
	console.log('sending params:', data);
	io.sockets.emit('params', data);
}


app.use(express.bodyParser());

app.post('/tweets', function(req, res) {
	emitTweets(req.body);
	sendOK(res);
})

app.post('/notes', function(req, res) {
	emitNotes(req.body);
	sendOK(res);
})

app.post('/params', function(req, res) {
	emitParams(req.body);
	sendOK(res);
})

app.post('/all', function(req, res) {
	if (req.body.tweets !== undefined)
		emitTweets(req.body.tweets);
	
	if (req.body.notes !== undefined)
		emitNotes(req.body.notes);
	
	if (req.body.params !== undefined)
		emitParams(req.body.params);
	
	sendOK(res);
})

app.listen(8080);