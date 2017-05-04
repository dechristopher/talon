/*
Created by Andrew DeChristopher <drew@kiir.us> on 2/27/2017.
 */

// core libraries
const c = require('chalk');
const r = require('requestify');

// import configuration
const cfg = require('./cfg');

// custom libraries
const log = require('./log');
const tutil = require('./util');

// logging constants
const SLACK = '[' + c.yellow('S') + c.green('L') + c.cyan('A') + c.magenta('C') + c.red('K') + ']';

// slack export object
let slack = {};

slack.postMatch = function(type, id, ip, pass, hash, map, t1n, t2n, players) {
    let payload = tutil.genPayload(type, id, ip, pass, hash, map, t1n, t2n, players);
    // log(SLACK + payload);
    r.post(cfg.matchesWebhook, { payload: payload }, { dataType: 'form-url-encoded' }).then(function(response) {
        if (response.getCode() != 200) {
            log('Failed to post match #' + id + ' to slack', 'slack', true)
        }
        log(SLACK + 'Posted match to slack...');
    });
};

module.exports = slack;