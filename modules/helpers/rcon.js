/*
Created by Andrew DeChristopher <drew@kiir.us> on 5/12/2017.
 */

// gameserver rcon module used for backend->server communication like querying player list and spinning up servers

// core libraries
const cfg = require('../cfg');
const c = require('chalk');
const rcon = require('srcds-rcon');

// logging constant
const RCON = '[' + c.green('RCON') + '] ';

let modRcon = {};

// Run a one-off command with a provided callback with parameters (output)
modRcon.cmd = function(ip, pass, command, callback) {
    let conn = rcon({
        address: ip,
        password: pass
    });

    conn.connect().then(() => {
        console.log(RCON, 'Connected!', command, '->', ip);
        return conn.command(command).then(out => {
            callback(out);
        });
    }).catch(console.error);
};

module.exports = modRcon;