/*
Created by Andrew DeChristopher <drew@kiir.us> on 1/25/2017.
 */

const match = (mid, mip, pw, t1n, t2n, pl) => {
    // ID of the match
	var matchid = Object.undefined;
	if (mid !== '') {
		matchid = mid;
	}

	// IP of match server
	var matchip = Object.undefined;
	if (mip !== '') {
		matchip = mip;
	}

	// Password of match server
	var matchpw = Object.undefined;
	if (pw !== '') {
		matchpw = pw;
	}

    // Name of team one
	var teamOneName = Object.undefined;
	if (t1n !== '') {
		teamOneName = t1n;
	}

    // Name of team two
	var teamTwoName = Object.undefined;
	if (t2n !== '') {
		teamTwoName = t2n;
	}

    // Array of player objects
	var players = Object.undefined;
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
