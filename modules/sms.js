/*
Created by Andrew DeChristopher <drew@kiir.us> on 10/5/2016.
 */

const cfg = require('./cfg');
const log = require('./log');
const client = require('twilio')(cfg.accountSid, cfg.authToken);

module.exports.sendSms = function(to, message) {
    client.messages.create({
        body: message,
        to: to,
        from: cfg.sendingNumber
            //mediaUrl: 'http://www.yourserver.com/someimage.png'
    }, function(err, data) {
        if (err) {
            console.error('Could not send SMS.');
            console.error(err);
        } else {
            //log('[SMS] Talon Started!');
        }
    });
};

module.exports.sendAdminSms = function(message) {
    cfg.adminNumbers.forEach(function(entry) {
        client.messages.create({
            body: message,
            to: entry,
            from: cfg.sendingNumber
                //mediaUrl: 'http://www.yourserver.com/someimage.png'
        }, function(err, data) {
            if (err) {
                console.error('Could not send SMS.');
                console.error(err);
            } else {
                //log('[SMS] Talon Started!');
            }
        });
    });
};
