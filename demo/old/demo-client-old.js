/**
 * Created by Drew on 5/23/2016.
 */
let cron = require('cron');
let S = require('string');
let requestify = require('requestify');
let recursive = require('recursive-readdir');
let path = require('path');
let HashMap = require('hashmap');
let fs = require('fs');
let datetime = require('node-datetime');
let sys = require('sys');
let exec = require('child_process').exec;
let c = require('chalk');

// HashMap of demos and filesizes
let dList = new HashMap();
// HashMap of demos and check counters
let checkdList = new HashMap();
// HashMap of demos to check for on the server to delete if they've been uploaded
let delList = new HashMap();

log('~ TALON DEMO PARSER v0.7');

// Wraps console.log for printing date in front
function log(message) {
	let dt = datetime.create();
	let time = dt.format('m/d/y H:M:S');
	console.log('[' + time + '] ' + message);
}

// Check if string contains another
function contains(a, b) {
	return S(a).contains(b);
}

// Returns size of file given by filename
function getFilesizeInBytes(filename) {
	let stats = fs.statSync(filename);
	return stats.size;
}

// Ignores a file if it isn't a demo file
function ignoreFunc(file, stats) {
    // `file` is the absolute path to the file, and `stats` is an `fs.Stats`
    // object returned from `fs.lstat()`.
	return !contains(file, '.dem');
}

// Returns the actual demo filename from the path
function getDemoName(filename) {
    // log('FILEPATH: ' + filename);
    // log('FILE: ' + file);
    // log("REFERENCED: " + file);
	return path.basename(filename);
}

// Echos some bs on rsync
function puts(error, stdout, stderr) {
	if (stdout !== null) {
		log(c.green(stdout));
	}
	if (stderr !== null) {
		log(c.red(stderr));
	}
	if (error !== null) {
		log(c.red(error));
	}
}

// Deletes the demo from the local drive
function deleteDemo(code, filename) {
	log('DELETE?: ' + code + ' - ' + filename);
	if (code === true) {
		fs.exists(filename, function (exists) {
			if (exists) {
                // Show in green
				log(c.green('DELETING LOCAL DEMO: ' + filename));
				fs.unlink(filename);
				delList.remove(filename);
				checkdList.remove(filename);
				dList.remove(filename);
			} else {
                // Show in red
				log(c.red('LOCAL DEMO NOT FOUND: ' + filename));
				delList.remove(filename);
				checkdList.remove(filename);
				dList.remove(filename);
			}
		});
	} else {
		log(c.red('Demo not found on server: 404'));
	}
}

function sendFileToDemoCDN(filename) {
	exec('sshpass -p "@@DJDROPIRISH&!#@@KIIRUS&!#@@" rsync ' + filename + ' root@demo.kiir.us:/var/www/demo/' + getDemoName(filename), puts);
}

function demoExistsOnCDN(Url, callback, filename) {
	let http = require('http'),
		url = require('url');
	let options = {
		method: 'HEAD',
		host: url.parse(Url).host,
		port: 80,
		path: url.parse(Url).pathname
	};
	let req = http.request(options, function (r) {
		log('GOT: ' + r.statusCode);
		callback(r.statusCode == 200, filename);
	});
	req.end();
}

// Checks for demo files and uploads them a minute
// after their file size has stopped increasing
let checkForDemos = cron.job('*/20 * * * * *', function () {
	log(c.green('Checking for demos...'));
    // Find new demo files
	recursive('C:\\KIWI', /* [ignoreFunc], */ function (err, files) {
		if (err !== null) {
			log(c.red('Errors: ' + err));
		}
        // Files is an array of filenames
		for (let i = 0; i < files.length; i++) {
			if (!dList.has(files[i]) && contains(files[i], '.dem')) {
				log(c.blue('ADDED: ' + files[i]));
				dList.set(files[i], getFilesizeInBytes(files[i]));
				checkdList.set(files[i], 0);
			}
		}
	});
});

let checkDemoGrowth = cron.job('*/20 * * * * *', function () {
	dList.forEach(function (value, key) {
        // Check for demo file growth
		let currSize = getFilesizeInBytes(key);
		if (currSize > value) {
			log('STILL RECORDING: ' + getDemoName(key));
			dList.set(key, currSize);
			checkdList.set(key, 0);
		} else {
            // Add 1 to value of 20 second intervals file size has been the same
			log('UNCHANGED: ' + getDemoName(key));
			checkdList.set(key, checkdList.get(key) + 1);
            // If a minute has passed with no growth
			if (checkdList.get(key) == 3) {
				log('UPLOADING: ' + getDemoName(key));
                // Upload demo to CDN, check for success, and delete demo from local server
				delList.set(key, 0);
				sendFileToDemoCDN(key);
			}
		}
	});
});

let checkToDelete = cron.job('*/5 * * * * *', function () {
	if (delList.count() > 0) {
		log('Checking for uploaded demos.');
		delList.forEach(function (value, key) {
			log('CHECKING FOR: http://demo.kiir.us/demos/' + getDemoName(key));
			demoExistsOnCDN('http://demo.kiir.us/demos/' + getDemoName(key), deleteDemo, key);
		});
	}
});

checkForDemos.start();
checkDemoGrowth.start();
checkToDelete.start();
