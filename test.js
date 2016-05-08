/**
 * Created by Drew on 4/22/2016.
 */
var redis = require("redis");
var rstring = require("randomstring");
var pub = redis.createClient(6379, "192.168.1.128");
var inm = redis.createClient(6379, "192.168.1.128");
var name = "drop";
var queue = rstring.generate({
    length: 12,
    charset: 'alphabetic'
});

var stdin = process.openStdin();

inm.on("subscribe", function (channel, count) {
    process.stdout.write("LSTN: " + channel + " : " + count + "\nBEAKCore >>");
});


/**
 *
 * FIX THE WAY THAT THE CONSOLE LISTENER CALLBACK PARSES INPUT SO WE CAN DO PROPER MESSAGES
 * 
 */


stdin.addListener("data", function(d) {
    var input = d.toString().trim();
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that
    // with toString() and then trim()
    if (input != "q") {
        if (input == "latency") {
            var now = new Date().getTime();
            pub.publish("talon", queue + "~" + name + "~latency~" + now);
            console.log("SENT: [" + now + "] to 'talon'");
        }else {
            pub.publish("talon", queue + "~" + name + "~" + input);
            console.log("SENT: [" + input + "] to 'talon'");
        }
    } else {
        pub.publish("talon", queue + "~" + name + "~q");
        pub.quit();
        process.stdin.destroy();
    }
});

inm.on("message", function (channel, message) {
        console.log("RPLY: --> " + message);
});

inm.subscribe(queue);