/*
Created by Andrew DeChristopher <drew@kiir.us> on 8/30/2016.
 */

// core libraries
const io = require('socket.io').listen(27000);
const ss = require('socket.io-stream');
const fs = require('fs');
const path = require('path');
const mime = require('mime');
const c = require('chalk');

// demo webservice libraries
const express = require('express');
const app = express();
const server = require('http').Server(app);

// custom libraries
const log = require('../modules/log');
const sms = require('../modules/sms');
const cfg = require('../modules/cfg');

// Define ERRORS and other constants
const KIWI = '[' + c.green('KIWI') + '] ';
const DEMO = '[' + c.green('DEMO') + '] ';
const DOWN = '[' + c.cyan('DOWN') + '] ';
const NJ1 = '[' + c.magenta('NJ1') + '] ';
const NJ2 = '[' + c.magenta('NJ2') + '] ';

// Log startup
log(KIWI + 'Demo Transit Server', '-demo-server');

// Demo upload socket handling and transit logistics
io.sockets.on('connection', function (socket) {
	log(KIWI + 'Client connected', '-demo-server');
    // For uploads from US-NJ1
	ss(socket).on('us-nj1', function (stream, data) {
		var filename = path.basename(data.name).split('\\');
		filename = filename[filename.length - 1];
		var filesize = data.size;
		log(DEMO + NJ1 + 'Uploading: ' + filename + ' ~' + filesize + ' B', '-demo-server');
		stream.pipe(fs.createWriteStream(cfg.demoDir + filename));
	});
    // For uploads from US-NJ2
	ss(socket).on('us-nj2', function (stream, data) {
		var filename = path.basename(data.name).split('\\');
		filename = filename[filename.length - 1];
		log(DEMO + NJ2 + 'Uploading: ' + filename + ' ~' + filesize + ' B', '-demo-server');
		stream.pipe(fs.createWriteStream(cfg.demoDir + filename));
	});
});

// Log express server start
server.listen(80, function () {
	log(KIWI + 'Demo download μSrvc started.', '-demo-server');
});

// Send no demo ID given and then go back
app.get('/', function (req, res, next) {
	try {
		res.send('No demo ID provided. Returning to previous page.<script>setTimeout(function(){ window.history.back(); }, 3000);</script>');
        // Disable logging for UptimeRobot requests to '/'
		if (res.ip != '::ffff:63.143.42.242') {
			log(DOWN + '[' + req.ip + '] GET /', '-demo-server');
		}
	} catch (e) {
		next(e);
	}
});

// Request for demo ID (ex. http://demo.kiir.us/15 OR http://demo.kiir.us/582)
app.get('/:id', function (req, res, next) {
	try {
		var id = req.params.id;
		fs.exists(path.join(cfg.demoDir, 'kiwi-' + id + '.dem'), function (exists) {
			if (exists) {
                // res.download(path.join(cfg.demoDir, 'kiwi-' + id + '.dem'));

				log(DOWN + 'Found demo @ ' + path.join(cfg.demoDir, 'kiwi-' + id + '.dem'), '-demo-server');

				var file = path.join(cfg.demoDir, 'kiwi-' + id + '.dem');
				var filename = path.basename(file);
				var mimetype = mime.lookup(filename);
				var filestream = fs.createReadStream(file);

				res.setHeader('Content-disposition', 'attachment; filename=' + filename);
				res.setHeader('Content-type', mimetype);

				filestream.pipe(res);
			} else {
				log(DOWN + 'Invalid demo ID given: ' + id, '-demo-server');
				res.send('Invalid demo ID. Returning to previous page.<script>setTimeout(function(){ window.history.back(); }, 3000);</script>');
			}
		});
		log(DOWN + '[' + req.ip + '] GET /' + id + ' ~ kiwi-' + id + '.dem', '-demo-server');
	} catch (e) {
		next(e);
	}
});
