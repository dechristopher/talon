/*
Created by Andrew DeChristopher <drew@kiir.us> on 1/25/2017.
 */
const match = (mid, t1n, t2n, pl) => {
    //ID of the match
    var matchid = Object.undefined;
    if (mid !== "") {
        matchid = mid;
    }

    //Name of team one
    var teamOneName = Object.undefined;
    if (t1n !== "") {
        teamOneName = t1n;
    }

    //Name of team two
    var teamTwoName = Object.undefined;
    if (t2n !== "") {
        teamTwoName = t2n;
    }

    //Array of player objects
    var players = Object.undefined;
    if (pl !== "" && pl !== []) {
        players = pl;
    }

    //Return anonymous functions as "internal methods"
    return {
        getMatchID: () => {
            return matchid;
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
