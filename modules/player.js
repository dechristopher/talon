/*
Created by Andrew DeChristopher <drew@kiir.us> on 4/22/2016.
 */

module.exports = Player;

function Player(n, s, c) {
    this.nm = n;
    this.sid = s;
    this.channel = c;
}

Player.prototype.getName = function() {
    return this.nm;
};

Player.prototype.getSid = function() {
    return this.sid;
};

Player.prototype.getChannel = function() {
    return this.channel;
};
