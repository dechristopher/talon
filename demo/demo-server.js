/*
Created by Andrew DeChristopher <drew@kiir.us> on 8/30/2016.
 */

//core libraries
const io = require('socket.io').listen(27000);
const ss = require('socket.io-stream');
const fs = require('fs');
const path = require('path');
const mime = require('mime');
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
    log(KIWI + 'Client connected', '-demo-server');
    //For uploads from US-NJ1
    ss(socket).on('us-nj1', function(stream, data) {
        var filename = path.basename(data.name).split('\\');
        var filename = filename[filename.length - 1];
        var filesize = data.size;
        log(DEMO + 'Uploading: ' + filename + ' ~' + filesize + ' B', '-demo-server');
        stream.pipe(fs.createWriteStream(cfg.demoDir + filename));
    });
    //For uploads from US-NJ2
    ss(socket).on('us-nj2', function(stream, data) {
        var filename = path.basename(data.name).split('\\');
        var filename = filename[filename.length - 1];
        log(DEMO + 'Uploading: ' + filename + ' ~' + filesize + ' B', '-demo-server');
        stream.pipe(fs.createWriteStream(cfg.demoDir + filename));
    });
});

//Log express server start
server.listen(80, function() {
    log(DOWN + 'Demo download μSrvc started.', '-demo-server');
});

//Send no demo ID given and then go back
app.get('/', function(req, res, next) {
    try {
        res.send('No demo ID provided. Returning to previous page.<script>setTimeout(function(){ window.history.back(); }, 3000);</script>');
        log(DOWN + '[' + req.ip + '] GET /', '-demo-server');
    } catch (e) {
        next(e);
    }
});

app.get('/:id', function(req, res, next) {
    try {
        var id = req.params.id;
        fs.exists(path.join(cfg.demoDir, 'kiwi-' + id + '.dem'), function(exists) {
            if (exists) {
                //res.download(path.join(cfg.demoDir, 'kiwi-' + id + '.dem'));

                log(DOWN + 'Found demo @ ' + path.join(cfg.demoDir, 'kiwi-' + id + '.dem'), '-demo-server')

                var file = path.join(cfg.demoDir, 'kiwi-' + id + '.dem');
                var filename = path.basename(file);
                var mimetype = mime.lookup(filename);
                var filestream = fs.createReadStream(file);

                res.setHeader('Content-disposition', 'attachment; filename=' + filename);
                res.setHeader('Content-type', mimetype);

                filestream.pipe(res);
            } else {
                res.send('Invalid demo ID. Returning to previous page.<script>setTimeout(function(){ window.history.back(); }, 3000);</script>');
            }
        });
        log(DOWN + '[' + req.ip + '] GET /' + id + ' ~ kiwi-' + id + '.dem', '-demo-server');
    } catch (e) {
        next(e);
    }
});
