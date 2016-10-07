/*
Created by Andrew DeChristopher <drew@kiir.us> on 8/30/2016.
 */

//core libraries
const io = require('socket.io').listen(27000);
const ss = require('socket.io-stream');
const fs = require('fs');
const path = require('path');
const gutil = require('gulp-util');

//demo webservice libraries
const express = require('express');
const app = express();
const server = require('http').Server(app);

//custom libraries
const log = require('../modules/log');
const sms = require('../modules/sms');
const cfg = require('../modules/cfg');

const KIWI = '[' + gutil.colors.green('KIWI') + '] ';
const DEMO = '[' + gutil.colors.green('DEMO') + '] ';
const DOWN = '[' + gutil.colors.cyan('DOWN') + '] ';

log(KIWI + 'Demo Transit Server', '-demo-server');

io.sockets.on('connection', function(socket) {
    log('Client connected', '-demo-server');
    //For uploads from US-NJ1
    ss(socket).on('us-nj1', function(stream, data) {
        var filename = path.basename(data.name).split('\\');
        var filename = filename[filename.length - 1];
        log(DEMO + 'Uploading: ' + filename);
        stream.pipe(fs.createWriteStream(cfg.demoDir + filename));
    });
    //For uploads from US-NJ2
    ss(socket).on('us-nj2', function(stream, data) {
        var filename = path.basename(data.name).split('\\');
        var filename = filename[filename.length - 1];
        log(DEMO + 'Uploading: ' + filename);
        stream.pipe(fs.createWriteStream(cfg.demoDir + filename));
    });
});

//Log express server start
server.listen(80, function() {
    log(TP + 'Demo download μSrvc started.');
});

//Send no demo ID given and then go back
app.get('/', function(req, res, next) {
    try {
        res.send('No demo ID provided. Returning to previous page.<script>setTimeout(function(){ window.history.back(); }, 3000);</script>');
        log(DOWN + '[' + req.ip + '] GET /');
    } catch (e) {
        next(e);
    }
});

app.get('/:id', function(req, res, next) {
    try {
        var id = req.params.id;
        res.sendFile(path.join(cfg.demoDir, 'kiwi-' + id + '.dem'));
        log(DOWN + '[' + req.ip + '] GET /' + id + ' ~ kiwi-' + id + '.dem');
    } catch (e) {
        next(e);
    }
});
