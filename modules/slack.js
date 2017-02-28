/*
Created by Andrew DeChristopher <drew@kiir.us> on 2/27/2017.
 */

// https://hooks.slack.com/services/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

// core libraries
const util = require('util');
const c = require('chalk');
const r = require('requestify');

// import configuration
const cfg = require('./cfg');

// custom libraries
const log = require('./log');
const tutil = require('./util');

// logging constants
const SLACK = '[' + c.yellow('S') + c.green('L') + c.cyan('A') + c.magenta('C') + c.red('K') + ']';

log(SLACK + 'PRETTY!!!!');

let slack = {};

slack.postMatch = function (type, id, ip, pass, hash, map, t1n, t2n, players) {
	payload = tutil.genPayload(type, id, ip, pass, hash, map, t1n, t2n, players);
	log(SLACK + payload);
    r.post(cfg.matchesWebhook, {
        payload: payload
    }, {dataType: 'form-url-encoded'})
    .then(function(response) {
        // Get the response body (JSON parsed or jQuery object for XMLs)
        // response.getBody();
        //
        // // Get the raw response body
        // response.body;
    });
};

module.exports = slack;