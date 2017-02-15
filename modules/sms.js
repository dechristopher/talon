/*
Created by Andrew DeChristopher <drew@kiir.us> on 10/5/2016.
 */

let client = require('twilio');
const gutil = require('gulp-util');
const cfg = require('./cfg');
const log = require('./log');

const SMS = '[' + gutil.colors.green('SMS') + '] ';

client = client(cfg.accountSid, cfg.authToken);

module.exports.sendSms = function (to, message) {
	client.messages.create({
		body: message,
		to: to,
		from: cfg.sendingNumber
            // mediaUrl: 'http://www.yourserver.com/someimage.png'
	}, function (err, data) {
		if (err) {
			console.error('Could not send SMS.');
			console.error(err, data);
		} else {
			log(SMS + to + ' : ' + message);
            // log('[SMS] Talon Started!');
		}
	});
};

module.exports.sendAdminSms = function (message) {
	cfg.adminNumbers.forEach(function (entry) {
		client.messages.create({
			body: message,
			to: entry,
			from: cfg.sendingNumber
                // mediaUrl: 'http://www.yourserver.com/someimage.png'
		}, function (err, data) {
			if (err) {
				console.error('Could not send SMS.');
				console.error(err, data);
			} else {
				log(SMS + 'ADMIN : ' + message);
                // log('[SMS] Talon Started!');
			}
		});
	});
};
