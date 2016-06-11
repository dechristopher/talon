const user = (u, s, c) => {
    var username = Object.undefined;
    if (u !== "") {
        username = u;
    }
    var steamid = Object.undefined;
    if (s !== "") {
        steamid = s;
    }
    var channel = Object.undefined;
    if (c !== "") {
        channel = c;
    }
    return {
        getUsername: () => {
            return username;
        },
        getSteamID: () => {
            return steamid;
        },
        getChannel: () => {
            return channel;
        }
    };
};

module.exports = user;
