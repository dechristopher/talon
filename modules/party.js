/*
Created by Andrew DeChristopher <drew@kiir.us> on 9/7/2016
 */

//core libraries
const redis = require('redis');
const HashMap = require("hashmap");
const rstr = require('randomstring');
const gutil = require('gulp-util');

//custom libraries
const user = require('./user');

//ERORS
const ERROR_FAILED_SADD = '[' + gutil.colors.red('ERROR') + '] Failed to add value to set: ';
const ERROR_FAILED_EXISTS = '[' + gutil.colors.red('ERROR') + '] Failed to check existence of key: ';

//PREFIXES
const PARTY = '[' + gutil.colors.green('PARTY') + '] ';

//connect to redis
var rcon = redis.createClient(6379, 'localhost');

//var userToPartyMap = new HashMap();

//Redis sets of parties
const partiesG = 'parties';
const parties1 = 'parties:1';
const parties2 = 'parties:2';
const parties3 = 'parties:3';
const parties4 = 'parties:4';
const parties5 = 'parties:5';

//Add test usernames in a set called testparty
/*rcon.sadd(['testparty', 'drop', 'sparks', 'rogean',], function(err, reply){
	console.log(reply);
});*/

function createParty(username){
	var id = 'party:' + rstr.generate(6);
	//Check if party with generated ID already exists
	rcon.exists(id, function(err, reply){
		if(err == undefined){
			if(reply == 1){
				return createParty(username);
			}else{
				//Add user to new party set
				rcon.sadd([id, username], function(err, reply){
					if(err == undefined){
						if(reply == 1){
							console.log(PARTY + id + ' created. Added: ' + username + '. Adding to party sets.')
							//Add new party to global parties set
							rcon.sadd([partiesG, id], function(err, reply){
								if(err == undefined){
									if(reply == 1){
										console.log(PARTY + id + ' added to global parties set.');
										//Add new party to parties:1 set
										rcon.sadd([parties1, id], function(err, reply){
											if(err == undefined){
												if(reply == 1){
													console.log(PARTY + id + ' added to parties:1.');
													return id;
												}else{
													throw new Erorr('Party already exists!? [2]');
												}
											}else{
												console.log(err);
												throw new Error(ERROR_FAILED_SADD + parties1);
											}
										});
									}else{
										throw new Erorr('Party already exists!? [1]');
									}
								}else{
									console.log(err);
									throw new Error(ERROR_FAILED_SADD + partiesG);
								}
							});
						}else{
							throw new Error('User already part of party!');
						}
					}else{
						console.log(err);
						throw new Error(ERROR_FAILED_SADD + id);
					}
				});
			}
		}else{
			throw new Erorr(ERROR_FAILED_EXISTS + id)
		}
	});
}

function joinParty(username, party){

}

function changeParties(username, party){

}

function leaveParty(username){

}

function isMemberOfParty(username, party){
	//rcon.smember
}

function partyExists(party){
	rcon.exists(party, function(err, reply){
		if(reply == 1){

		}else{

		}
	});
}

function deleteParty(){

}

var testuser = user('testuser', 'STEAM_0:0:TESTING', 'TESTCHANNEL', 'OFI)*#BO*QBO@CLIb');

console.log(testuser.getUsername() + ' - ' + testuser.getSteamID() + ' - ' + testuser.getChannel() + ' - ' + testuser.getHWID());

var party = createParty(testuser.getUsername());
