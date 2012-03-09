//setup Dependencies
var connect = require('connect')
    , express = require('express')
    , io = require('socket.io')
    , port = (process.env.PORT || 8081);

//Setup Express
var server = express.createServer();
server.configure(function(){
    server.set('views', __dirname + '/views');
    server.set('view options', { layout: false });
    server.use(connect.bodyParser());
    server.use(express.cookieParser());
    server.use(express.session({ secret: "shhhhhhhhh!"}));
    server.use(connect.static(__dirname + '/static'));
    server.use(server.router);
});

//setup the errors
server.error(function(err, req, res, next){
    if (err instanceof NotFound) {
        res.render('404.jade', { locals: { 
                  title : '404 - Not Found'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX' 
                },status: 404 });
    } else {
        res.render('500.jade', { locals: { 
                  title : 'The Server Encountered an Error'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX'
                 ,error: err 
                },status: 500 });
    }
});
server.listen( port);

//Setup Socket.IO
var mimes = {
	text: {'Content-Type': 'text/plain'},
	json: {'Content-Type': 'serverlication/json'},
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

 var io = io.listen(server);
 io.sockets.on('connection', function(socket){
    emitStoredData(socket);

 	socket.on('get data', function() {
 		emitStoredData(socket);
 	})
 });


function addTweets(data) {
	
	if (!Array.isArray(data))
		data = [data];
	
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
   console.log("adding notes with data: ", data);
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



server.use(express.bodyParser());


server.get('/tweets', function(req, res) {
	sendJSON(res, stored.tweets);
})

server.post('/tweets', function(req, res) {
	addTweets(req.body);
	emitTweets(req.body);
	sendOK(res);
})

server.get('/notes', function(req, res) {
	sendJSON(res, stored.notes);
})

server.post('/notes', function(req, res) {
   console.log("req.body: ", req.body);
	addNotes(req.body);
	emitNotes(req.body);
	sendOK(res);
})

server.get('/params', function(req, res) {
	sendJSON(res, stored.params);
})

server.post('/params', function(req, res) {
	addParams(req.body);
	emitParams(req.body);
	sendOK(res);
})

server.get('/all', function(req, res) {
	sendJSON(res, {
		tweets: stored.tweets,
		notes: stored.notes,
		params: stored.params,
	})
})

server.post('/all', function(req, res) {
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


///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////

server.get('/', function(req,res){
  res.render('index.jade', {
    locals : { 
              title : 'Your Page Title'
             ,description: 'Your Page Description'
             ,author: 'Your Name'
             ,analyticssiteid: 'XXXXXXX' 
            }
  });
});


//A Route for Creating a 500 Error (Useful to keep around)
server.get('/500', function(req, res){
    throw new Error('This is a 500 Error');
});

//The 404 Route (ALWAYS Keep this as the last route)
server.get('/*', function(req, res){
    throw new NotFound;
});

function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}


console.log('Listening on http://0.0.0.0:' + port );
