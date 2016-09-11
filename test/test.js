const user = require("../modules/user.js");
const party = require('../modules/party.js');
const redis = require('redis');
var testCase = require('nodeunit').testCase;

var rcon;

exports['Test user generator factory'] = function(test) {
    test.expect(9);

    //Set up a normally created user object
    const testuser = user('testuser', 'STEAM_0:0:TESTING', 'TESTCHANNEL');
    //Set up a user object and pass blank arguments
    const testuser2 = user('', '', '');
    //Set up a user object and pass no arguments
    const testuser3 = user();

    //Perform normal tests on first testuser
    test.strictEqual(testuser.getUsername(), "testuser", "Tests that getUsername() function returns proper username.");
    test.strictEqual(testuser.getSteamID(), "STEAM_0:0:TESTING", "Tests that getSteamID() function returns proper SteamID.");
    test.strictEqual(testuser.getChannel(), "TESTCHANNEL", "Tests that getChannel() function returns proper channel.");

    //Perform checks to see if constructor logic returns undefined fields
    test.strictEqual(testuser2.getUsername(), Object.undefined, "Tests that getUsername() function returns undefined when blank arguments are passed to the user constructor.");
    test.strictEqual(testuser2.getSteamID(), Object.undefined, "Tests that getSteamID() function returns undefined when blank arguments are passed to the user constructor.");
    test.strictEqual(testuser2.getChannel(), Object.undefined, "Tests that getChannel() function returns undefined when blank arguments are passed to the user constructor.");

    //Perform tests on blank constructor to verify Object.undefined returns
    test.strictEqual(testuser3.getUsername(), Object.undefined, "Tests that getUsername() function returns undefined when no arguments are passed to the user constructor.");
    test.strictEqual(testuser3.getSteamID(), Object.undefined, "Tests that getSteamID() function returns undefined when no arguments are passed to the user constructor.");
    test.strictEqual(testuser3.getChannel(), Object.undefined, "Tests that getChannel() function returns undefined when no arguments are passed to the user constructor.");

    test.done();
};

exports.parties = testCase({
    setUp: function(callback) {
        rcon = redis.createClient(6379, 'kiir.us');
        const auth = "KIWICLIENTREDISPASSWORDTHATISWAYTOOLONGTOGUESSBUTSTILLFEASIBLETOGETBYDECRYPTINGOURCLIENTSOKUDOSTOYOUIFYOUDIDLOLJKPLEASETELLUSTHISISSCARY";
        rcon.auth(auth);
        rcon.select(2, function(err, res) {
            if (err == undefined) {
                callback();
            } else {
                throw new Error(err);
            }
        });
    },

    tearDown: function(callback) {
        rcon.quit();
        callback();
    },

    testPartyCreation: function(test) {
        const partymember = user('partymember', 'STEAM_0:0:PARTY', 'PARTYCHANNEL');
        party.createParty(partymember.getUsername(), rcon, function(id) {
            party.partyExists(id, rcon, function(tf) {
                test.expect(1);
                test.strictEqual(tf, true, "Tests that party successfully created.");
                test.done();
            });
        });
    },

        });
    }
});
