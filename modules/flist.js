var flist;

//Fill an arraylist list with lines from a file
flist.fill = function(file, list, displayname, err) {
    fs.exists(file, function(exists) {
        if (exists) {
            fs.readFileSync(file).toString().split('\n').forEach(function(line) {
                if (line !== '') {
                    list.add(line);
                }
            });
            log('FILLED ' + displayname + ': [ ' + list + ' ]');
        } else {
            throw new Error(err + file);
        }
    });
}

module.exports = flist;
