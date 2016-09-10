/*
Created by Andrew DeChristopher <drew@kiir.us> on 9/7/2016
 */

//core libraries
const redis = require('redis');
const HashMap = require("hashmap");
const rstr = require('randomstring');
const gutil = require('gulp-util');
const os = require('os');

//custom libraries
const user = require('./user');

//ERORS
const ERROR_FAILED_CREATE = '[' + gutil.colors.red('ERROR') + '] Party created but didn\'t add user: ';
const ERROR_FAILED_SADD = '[' + gutil.colors.red('ERROR') + '] Failed to add value to set: ';
const ERROR_FAILED_SCARD = '[' + gutil.colors.red('ERROR') + '] Failed to get number of members of: ';
const ERROR_FAILED_SISMEMBER = '[' + gutil.colors.red('ERROR') + '] Failed to check if value member of: ';
const ERROR_FAILED_SMEMBERS = '[' + gutil.colors.red('ERROR') + '] Failed getting members of: ';
const ERROR_FAILED_EXISTS = '[' + gutil.colors.red('ERROR') + '] Failed to check existence of key: ';

//PREFIXES
const EXISTS = '[' + gutil.colors.cyan('EXISTS') + '] ';
const ISMEMBER = '[' + gutil.colors.cyan('ISMEMBER') + '] ';
const PARTY = '[' + gutil.colors.green('PARTY') + '] ';
const SUCCESS = '[' + gutil.colors.green('SUCCESS') + '] ';

//connect to redis
//var rcon = redis.createClient(6379, 'localhost');

//var userToPartyMap = new HashMap();

//Redis sets of parties
const partiesG = 'parties';
const parties1 = 'parties:1';
const parties2 = 'parties:2';
const parties3 = 'parties:3';
const parties4 = 'parties:4';
const parties5 = 'parties:5';

/*
	Generates unique party, adds user to it, and adds it to global and single member party sets.
	'username' - string
	RET: generated party ID "party:[7-digit alphanumeric id]"
 */
exports.createParty = function(username, rcon, callback) {
    var id = 'party:' + rstr.generate(7);
    //Check if party with generated ID already exists
    partyExists(id, rcon, function(tf) {
        if (tf) {
            //Somehow generated existing party id, so recursively retry until success.
            console.log('RETRYING');
            return createParty(username, callback);
        } else {
            //Add user to new party set
            rcon.sadd([id, username], function(err, reply) {
                if (err == undefined) {
                    if (reply == 1) {
                        console.log(PARTY + id + ' created. Added: ' + username + '. Adding to party sets.')
                            //Add new party to global parties set
                        rcon.sadd([partiesG, id], function(err, reply) {
                            if (err == undefined) {
                                if (reply == 1) {
                                    console.log(PARTY + id + ' added to global parties set.');
                                    //Add new party to parties:1 set
                                    rcon.sadd([parties1, id], function(err, reply) {
                                        if (err == undefined) {
                                            if (reply == 1) {
                                                console.log(PARTY + id + ' added to parties:1.');
                                                //Final checks to ensure user in party
                                                isMemberOfParty(id, username, rcon, function(tf) {
                                                    if (tf) {
                                                        callback(id);
                                                    } else {
                                                        throw new Error(ERROR_FAILED_CREATE + username + os.EOL + member);
                                                    }
                                                });
                                            } else {
                                                throw new Erorr('Party already exists!? [2]');
                                            }
                                        } else {
                                            throw new Error(ERROR_FAILED_SADD + parties1 + os.EOL + err);
                                        }
                                    });
                                } else {
                                    throw new Erorr('Party already exists!? [1]');
                                }
                            } else {
                                throw new Error(ERROR_FAILED_SADD + partiesG + os.EOL + err);
                            }
                        });
                    } else {
                        throw new Error('User already part of party!? [0]');
                    }
                } else {
                    throw new Error(ERROR_FAILED_SADD + id + os.EOL + err);
                }
            });
        }
    });
}

function joinParty(username, party) {

}

function changeParties(username, party) {

}

function leaveParty(username) {

}

/*
	Checks whether or not a user exists in a given party
	'party' - string (party:XXXXXXX)
	'username' - string
	RET: bool - is user in party
 */
exports.isMemberOfParty = function(party, username, rcon, callback) {
    rcon.sismember([party, username], function(err, reply) {
        if (err == undefined) {
            var tf = false;
            if (reply == 1) {
                console.log(ISMEMBER + username + ' -> ' + party + ' >> true');
                tf = true;
            } else {
                console.log(ISMEMBER + username + ' -> ' + party + ' >> false');
                tf = false;
            }
            callback(tf);
        } else {
            throw new Error(ERROR_FAILED_SISMEMBER + party + os.EOL + err);
        }
    });
}

function isMemberOfParty(party, username, rcon, callback) {
    rcon.sismember([party, username], function(err, reply) {
        if (err == undefined) {
            var tf = false;
            if (reply == 1) {
                console.log(ISMEMBER + username + ' -> ' + party + ' >> true');
                tf = true;
            } else {
                console.log(ISMEMBER + username + ' -> ' + party + ' >> false');
                tf = false;
            }
            callback(tf);
        } else {
            throw new Error(ERROR_FAILED_SISMEMBER + party + os.EOL + err);
        }
    });
}

/*
	Checks whether or not a party already exists in the datastore
	'party' - string (party:XXXXXXX)
	RET: bool - party exists
 */
exports.partyExists = function(party, rcon, callback) {
    rcon.exists(party, function(err, reply) {
        if (err == undefined) {
            var tf = false;
            if (reply == 1) {
                console.log(EXISTS + party + ' >> true');
                tf = true;
            } else {
                console.log(EXISTS + party + ' >> false');
                tf = false;
            }
            callback(tf);
        } else {
            throw new Error(ERROR_FAILED_EXISTS + party + os.EOL + err);
        }
    });
}

function partyExists(party, rcon, callback) {
    rcon.exists(party, function(err, reply) {
        if (err == undefined) {
            var tf = false;
            if (reply == 1) {
                console.log(EXISTS + party + ' >> true');
                tf = true;
            } else {
                console.log(EXISTS + party + ' >> false');
                tf = false;
            }
            callback(tf);
        } else {
            throw new Error(ERROR_FAILED_EXISTS + party + os.EOL + err);
        }
    });
}

function getNumPlayersInParty(party, rcon, callback) {
    partyExists(party, rcon, function(tf) {
        if (tf) {
            rcon.scard(party, function(err, reply) {
                if (err == undefined) {
                    callback(reply);
                } else {
                    throw new Error(ERORR_FAILED_SCARD);
                }
            });
        } else {
            console.log('Party DNE')
        }
    });
}

function getPlayersInParty(party, rcon, callback) {

}

function deleteParty(party, rcon, callback) {

}

/*var testuser = user('testuser', 'STEAM_0:0:TESTING', 'TESTCHANNEL', 'OFI)*#BO*QBO@CLIb');

console.log(testuser.getUsername() + ' - ' + testuser.getSteamID() + ' - ' + testuser.getChannel() + ' - ' + testuser.getHWID());

createParty(testuser.getUsername(), rcon, function(id) {
    console.log(SUCCESS + 'Created party: ' + id);
    process.exit();
});*/
