/**
 * Created by Drew on 4/22/2016.
 */
// Private
var playerCount = 0;

function depositMinusFee(num) {
    return num - 0.1;
}

// Public
module.exports = Player;

function Player(n, c) {
    this.id = playerCount;
    this.nm = n;
    this.channel = c;
    playerCount++;
}

Player.prototype.getName = function() {
    return this.nm;
};

Player.prototype.getChannel = function() {
    return this.channel;
};