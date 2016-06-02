exports.testUserFactory = function(test){
    test.expect(9);

    const user = require("./user");
    
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
