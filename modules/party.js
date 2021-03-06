/*
Created by Andrew DeChristopher <drew@kiir.us> on 9/7/2016.
 */

// core libraries
const redis = require('redis');
const rstr = require('randomstring');
const c = require('chalk');
const os = require('os');

// custom libraries
const user = require('./user');
const log = require('./log');

// ERORS
const ERROR_FAILED_CREATE = '[' + c.red('ERROR') + '] Party created but didn\'t add user: ';
const ERROR_FAILED_SADD = '[' + c.red('ERROR') + '] Failed to add value to set: ';
const ERROR_FAILED_SCARD = '[' + c.red('ERROR') + '] Failed to get number of members of: ';
const ERROR_FAILED_SISMEMBER = '[' + c.red('ERROR') + '] Failed to check if value member of: ';
const ERROR_FAILED_SMEMBERS = '[' + c.red('ERROR') + '] Failed getting members of: ';
const ERROR_FAILED_EXISTS = '[' + c.red('ERROR') + '] Failed to check existence of key: ';

// PREFIXES
const EXISTS = '[' + c.cyan('EXISTS') + '] ';
const ISMEMBER = '[' + c.cyan('ISMEMBER') + '] ';
const MEMBERS = '[' + c.cyan('MEMBERS') + '] ';
const PARTY = '[' + c.green('PARTY') + '] ';
const SUCCESS = '[' + c.green('SUCCESS') + '] ';

// Redis sets of parties
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
exports.createParty = function (username, rcon, callback) {
	let id = 'party:' + rstr.generate(7);
    // Check if party with generated ID already exists
	partyExists(id, rcon, function (tf) {
		if (tf) {
            // Somehow generated existing party id, so recursively retry until success.
			log('RETRYING', 'party');
			return createParty(username, callback);
		}
            // Add user to new party set
		rcon.sadd([id, username], function (err, reply) {
			if (err == undefined) {
				if (reply == 1) {
					log(PARTY + id + ' created. Added: ' + username + '. Adding to party sets.', 'party');
                            // Add new party to global parties set
					rcon.sadd([partiesG, id], function (err, reply) {
						if (err == undefined) {
							if (reply == 1) {
								log(PARTY + id + ' added to global parties set.', 'party');
                                    // Add new party to parties:1 set
								rcon.sadd([parties1, id], function (err, reply) {
									if (err == undefined) {
										if (reply == 1) {
											log(PARTY + id + ' added to parties:1.', 'party');
                                                // Final checks to ensure user in party
											isMemberOfParty(id, username, rcon, function (tf) {
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
	});
};

// not sure if this should just implement changeParties or not...
function joinParty(username, party, rcon, callback) {

}

/*
	Swaps user from one party to another
    and deletes old party if last member
    before leaving
    'username' - string
	'party' - string (party:XXXXXXX)
    'destparty' - string (party:XXXXXXX)
	RET: bool - deleted or not
 */
function changeParties(username, party, destparty, rcon, callback) {

}

/*
	Leave party and create new one
    'username' - string
	'party' - string (party:XXXXXXX)
	RET: bool - left or not
 */
function leaveParty(username, party, rcon, callback) {

}

/*
	Deletes a party from redis if no members
	'party' - string (party:XXXXXXX)
	RET: bool - deleted or not
 */
function deleteParty(party, rcon, callback) {

}

/*
	Checks whether or not a user exists in a given party
	'party' - string (party:XXXXXXX)
	'username' - string
	RET: bool - is user in party
 */
exports.isMemberOfParty = function (party, username, rcon, callback) {
	rcon.sismember([party, username], function (err, reply) {
		if (err == undefined) {
			let tf = false;
			if (reply == 1) {
				log(ISMEMBER + username + ' -> ' + party + ' >> true', 'party');
				tf = true;
			} else {
				log(ISMEMBER + username + ' -> ' + party + ' >> false', 'party');
				tf = false;
			}
			callback(tf);
		} else {
			throw new Error(ERROR_FAILED_SISMEMBER + party + os.EOL + err);
		}
	});
};

function isMemberOfParty(party, username, rcon, callback) {
	rcon.sismember([party, username], function (err, reply) {
		if (err == undefined) {
			let tf = false;
			if (reply == 1) {
				log(ISMEMBER + username + ' -> ' + party + ' >> true', 'party');
				tf = true;
			} else {
				log(ISMEMBER + username + ' -> ' + party + ' >> false', 'party');
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
exports.partyExists = function (party, rcon, callback) {
	rcon.exists(party, function (err, reply) {
		if (err == undefined) {
			let tf = false;
			if (reply == 1) {
				log(EXISTS + party + ' >> true', 'party');
				tf = true;
			} else {
				log(EXISTS + party + ' >> false', 'party');
				tf = false;
			}
			callback(tf);
		} else {
			throw new Error(ERROR_FAILED_EXISTS + party + os.EOL + err);
		}
	});
};

function partyExists(party, rcon, callback) {
	rcon.exists(party, function (err, reply) {
		if (err == undefined) {
			let tf = false;
			if (reply == 1) {
				log(EXISTS + party + ' >> true', 'party');
				tf = true;
			} else {
				log(EXISTS + party + ' >> false', 'party');
				tf = false;
			}
			callback(tf);
		} else {
			throw new Error(ERROR_FAILED_EXISTS + party + os.EOL + err);
		}
	});
}

/*
	Gets the number of players in a given party
	'party' - string (party:XXXXXXX)
	RET: int - num in party
 */
exports.getNumPartyMembers = function (party, rcon, callback) {
	partyExists(party, rcon, function (tf) {
		if (tf) {
			rcon.scard(party, function (err, reply) {
				if (err == undefined) {
					log(MEMBERS + reply, 'party');
					callback(reply);
				} else {
					throw new Error(ERROR_FAILED_SCARD);
				}
			});
		} else {
			log('Party DNE', 'party');
		}
	});
};

function getNumPartyMembers(party, rcon, callback) {
	partyExists(party, rcon, function (tf) {
		if (tf) {
			rcon.scard(party, function (err, reply) {
				if (err == undefined) {
					log(MEMBERS + reply, 'party');
					callback(reply);
				} else {
					throw new Error(ERROR_FAILED_SCARD);
				}
			});
		} else {
			log('Party DNE', 'party');
		}
	});
}

/*
	Gets all player usernames in a party
	'party' - string (party:XXXXXXX)
	RET: array - all player usernames
 */
exports.getPartyMembers = function (party, rcon, callback) {
	partyExists(party, rcon, function (tf) {
		if (tf) {
			rcon.smembers(party, function (err, reply) {
				if (err == undefined) {
					log(MEMBERS + reply.length, 'party');
					callback(reply);
				} else {
					throw new Error(ERROR_FAILED_SMEMBERS);
				}
			});
		} else {
			log('Party DNE', 'party');
		}
	});
};

function getPartyMembers(party, rcon, callback) {
	partyExists(party, rcon, function (tf) {
		if (tf) {
			rcon.smembers(party, function (err, reply) {
				if (err == undefined) {
					log(MEMBERS + reply.length, 'party');
					callback(reply);
				} else {
					throw new Error(ERROR_FAILED_SMEMBERS);
				}
			});
		} else {
			log('Party DNE', 'party');
		}
	});
}
