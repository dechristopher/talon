/*
Created by Andrew DeChristopher <drew@kiir.us> on 1/25/2017.
 */

let match = (mid, mip, pw, mhash, map, t1n, t2n, pl) => {
    // ID of the match
	let matchid = Object.undefined;
	if (mid !== '') {
		matchid = mid;
	}

	// IP of match server
	let matchip = Object.undefined;
	if (mip !== '') {
		matchip = mip;
	}

	// Password of match server
	let matchpw = Object.undefined;
	if (pw !== '') {
		matchpw = pw;
	}

	// Hash of match
	let mmatchhash = Object.undefined;
	if (mhash !== '') {
		matchhash = mhash;
	}

	// Map of match
	let mmatchmap = Object.undefined;
	if (map !== '') {
		matchmap = map;
	}

    // Name of team one
	let teamOneName = Object.undefined;
	if (t1n !== '') {
		teamOneName = t1n;
	}

    // Name of team two
	let teamTwoName = Object.undefined;
	if (t2n !== '') {
		teamTwoName = t2n;
	}

    // Array of player objects
	let players = Object.undefined;
	if (pl !== '' && pl !== []) {
		players = pl;
	}

    // Return anonymous functions as "internal methods"
	return {
		getMatchID: () => {
			return matchid;
		},
		getMatchIP: () => {
			return matchip;
		},
		getMatchPassword: () => {
			return matchpw;
		},
		getMatchHash: () => {
			return matchhash;
		},
		getMatchMap: () => {
			return matchmap;
		},
		getTeamOneName: () => {
			return teamOneName;
		},
		getTeamTwoName: () => {
			return teamTwoName;
		},
		getPlayers: () => {
			return players;
		},
		getNumPlayers: () => {
			return players.length;
		}
	};
};

module.exports = match;
