/*
Created by Andrew DeChristopher <drew@kiir.us> on 10/5/2016.
 */

var dotenv = require('dotenv');
var cfg = {};

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    dotenv.config({
        path: '.env'
    });
} else {
    dotenv.config({
        path: '.env.test',
        silent: true
    });
}

//Talon version
cfg.version = process.env.TALON_VERSION || '1.2.6';

//Dev mode enabled
cfg.dev = false;

//Debug mode enabled
cfg.debug = process.env.TALON_DEBUG.bool || false;

//Firewall enabled
cfg.firewallEnabled = true;

//Backend Redis datastore and MQ to use
cfg.backend = process.env.TALON_BACKEND || 'kiir.us';

//Talon instance region
cfg.region = parseInt(process.env.TALON_REGION) || 1;

//Set the default queue size
cfg.qSize = parseInt(process.env.TALON_QSIZE) || 10;

//Boolean to display all server IPs every parseServer tick
cfg.displayServers = false;

//Port of the talonPanel
cfg.port = parseInt(process.env.TALON_PORT) || 3000;

//Secret used for random hash generation
cfg.secret = process.env.TALON_APP_SECRET || 'keyboard cat';

//API key for KIWI web API
cfg.api = process.env.TALON_API_KEY;

//Redis datastore authentication password
cfg.auth = process.env.TALON_REDIS_PW;

//Unused datadog key, just to make sure it exists
cfg.datadog = process.env.DATADOG_API_KEY;

//Server lists with region-based indexes
cfg.servers = [
    'conf/dev-servers.txt',
    'conf/us-e-servers.txt'
];

//Admin phone numbers for important SMS notifications
cfg.adminNumbers = [
    '5089306274',
    '8103577576'
];

//Directory used by demo-server.js to dump uploaded demos
cfg.demoDir = process.env.TALON_DEMO_DIR || '/mnt/volume-nyc1-01/demos/';

//Twillio account info
cfg.accountSid = process.env.TWILIO_ACCOUNT_SID;
cfg.authToken = process.env.TWILIO_AUTH_TOKEN;
cfg.sendingNumber = process.env.TWILIO_NUMBER || '9093411337';

var requiredConfig = [cfg.accountSid, cfg.authToken, cfg.sendingNumber];
var isConfigured = requiredConfig.every(function(configValue) {
    return configValue || false;
});

if (!isConfigured) {
    var errorMessage =
        'TALON_REDIS_PW, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_NUMBER must be set.';

    throw new Error(errorMessage);
}

module.exports = cfg;
