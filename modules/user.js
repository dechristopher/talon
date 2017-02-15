/*
Created by Andrew DeChristopher <drew@kiir.us> on 6/1/2016.
 */

const user = (u, s, c, h) => {
	let username = Object.undefined;
	if (u !== '') {
		username = u;
	}
	let steamid = Object.undefined;
	if (s !== '') {
		steamid = s;
	}
	let channel = Object.undefined;
	if (c !== '') {
		channel = c;
	}
	let hwid = Object.undefined;
	if (c !== '') {
		hwid = h;
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
		},
		getHWID: () => {
			return hwid;
		}
	};
};

module.exports = user;
