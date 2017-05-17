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

let conn = rcon({
    address: 'us-ch1.kiir.us',
    password: 'lkjh209gu09cyvl4no89gsd'
});

conn.connect().then(() => {
    console.log(RCON, 'connected');
    conn.command('status').then(status => console.log(`status is is \n${status}`));
    return conn.command('sv_password KIWISARETASTY').then(() => {
        console.log(RCON, 'changed password');
    });
}).catch(console.error);