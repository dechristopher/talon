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
