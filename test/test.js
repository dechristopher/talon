/*
Created by Andrew DeChristopher <drew@kiir.us> on 6/1/2016.
 */

const user = require('../modules/user.js');
const party = require('../modules/party.js');
const match = require('../modules/match.js');
const cfg = require('../modules/cfg.js');
const sms = require('../modules/sms.js');
const redis = require('redis');
const git = require('git-last-commit');

git.getLastCommit(function (err, commit) {
  // read commit object properties
  // console.log('SENDING ADMIN SMS');
  // sms.sendAdminSms('[KIWI] Commits pushed to Talon repo. Running test suite >> [ ' + commit.branch + ' -> ' + commit.shortHash + ' ( ' + commit.author.name + ' <' + commit.author.email + '> ) ] ' + commit.subject);
	console.log('Last commit:', commit.shortHash);
});

var testCase = require('nodeunit').testCase;
var rcon;
var testPlayer = user('testuser', 'STEAM_0:0:TESTING', 'TESTCHANNEL');
var testMatch = match(1337, '8.8.8.8:27015', 'jR0mW3', 'team_drop', 'team_sparks', [testPlayer, testPlayer, testPlayer, testPlayer]);

// user.js test cases - NEEDS CONVERSION
exports['Test user generator factory'] = function (test) {
	test.expect(9);

    // Set up a normally created user object
	const testuser = user('testuser', 'STEAM_0:0:TESTING', 'TESTCHANNEL');
    // Set up a user object and pass blank arguments
	const testuser2 = user('', '', '');
    // Set up a user object and pass no arguments
	const testuser3 = user();

    // Perform normal tests on first testuser
	test.strictEqual(testuser.getUsername(), 'testuser', 'Tests that getUsername() function returns proper username.');
	test.strictEqual(testuser.getSteamID(), 'STEAM_0:0:TESTING', 'Tests that getSteamID() function returns proper SteamID.');
	test.strictEqual(testuser.getChannel(), 'TESTCHANNEL', 'Tests that getChannel() function returns proper channel.');

    // Perform checks to see if constructor logic returns undefined fields
	test.strictEqual(testuser2.getUsername(), Object.undefined, 'Tests that getUsername() function returns undefined when blank arguments are passed to the user constructor.');
	test.strictEqual(testuser2.getSteamID(), Object.undefined, 'Tests that getSteamID() function returns undefined when blank arguments are passed to the user constructor.');
	test.strictEqual(testuser2.getChannel(), Object.undefined, 'Tests that getChannel() function returns undefined when blank arguments are passed to the user constructor.');

    // Perform tests on blank constructor to verify Object.undefined returns
	test.strictEqual(testuser3.getUsername(), Object.undefined, 'Tests that getUsername() function returns undefined when no arguments are passed to the user constructor.');
	test.strictEqual(testuser3.getSteamID(), Object.undefined, 'Tests that getSteamID() function returns undefined when no arguments are passed to the user constructor.');
	test.strictEqual(testuser3.getChannel(), Object.undefined, 'Tests that getChannel() function returns undefined when no arguments are passed to the user constructor.');

	test.done();
};

// party.js test cases
exports.parties = testCase({
	setUp: function (callback) {
		rcon = redis.createClient(6379, cfg.backend);
		rcon.auth(cfg.auth);
		rcon.select(2, function (err, res) {
			if (err == undefined) {
				callback();
			} else {
				throw new Error(err);
			}
		});
	},
	tearDown: function (callback) {
		rcon.quit();
		callback();
	},
	testPartyCreation: function (test) {
		const partymember = user('partymember', 'STEAM_0:0:PARTY', 'PARTYCHANNEL');
		party.createParty(partymember.getUsername(), rcon, function (id) {
			party.partyExists(id, rcon, function (tf) {
				test.expect(1);
				test.strictEqual(tf, true, 'Tests that party successfully created.');
				test.done();
			});
		});
	},
	testGetNumPartyMembers: function (test) {
		party.getNumPartyMembers('party:KTSotnN', rcon, function (reply) {
			test.expect(1);
			test.strictEqual(reply, 4, 'Tests that all party members returned in array properly.');
			test.done();
		});
	},
	testGetPartyMembers: function (test) {
		party.getPartyMembers('party:KTSotnN', rcon, function (reply) {
			test.expect(1);
			test.strictEqual(reply.length, 4, 'Tests that all party members returned in array properly.');
			test.done();
		});
	}
});

// match.js test cases
exports.match = testCase({
	testGetMatchID: function (test) {
    		test.expect(1);
    		test.strictEqual(testMatch.getMatchID(), 1337, 'Tests that match id is returned properly.');
    		test.done();
	},
	testGetMatchIP: function (test) {
    		test.expect(1);
    		test.strictEqual(testMatch.getMatchIP(), '8.8.8.8:27015', 'Tests that match id is returned properly.');
    		test.done();
	},
	testGetMatchPassword: function (test) {
    		test.expect(1);
    		test.strictEqual(testMatch.getMatchPassword(), 'jR0mW3', 'Tests that match id is returned properly.');
    		test.done();
	},
	testGetTeamOneName: function (test) {
    		test.expect(1);
    		test.strictEqual(testMatch.getTeamOneName(), 'team_drop', 'Tests that team one name is returned properly.');
    		test.done();
	},
	testGetTeamTwoName: function (test) {
    		test.expect(1);
    		test.strictEqual(testMatch.getTeamTwoName(), 'team_sparks', 'Tests that team two name is returned properly.');
    		test.done();
	},
	testGetPlayers: function (test) {
    		test.expect(1);
    		test.strictEqual(testMatch.getPlayers()[0], testPlayer, 'Tests that match players are returned properly.');
    		test.done();
	},
	testGetNumPlayers: function (test) {
    		test.expect(1);
    		test.strictEqual(testMatch.getNumPlayers(), 4, 'Tests that number of players in match is returned properly.');
    		test.done();
	}
});
