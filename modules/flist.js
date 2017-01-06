const fs = require('fs');
const log = require('./log');

var flist = {};

//Fill an arraylist list with lines from a file
flist.fill = function(file, list, numSrv, displayname, err) {
    fs.exists(file, function(exists) {
        if (exists) {
            fs.readFileSync(file).toString().split('\n').forEach(function(line) {
                if (line !== '') {
                    list.add(line);
                }
            });
            log('FILLED ' + displayname + ': [ ' + list + ' ]');
			numSrv = list.size();
        } else {
            throw new Error(err + file);
        }
    });
}

module.exports = flist;
