var fs = require('fs');

var files = process.argv.slice(2);

process.stdout.write("SpeakerFriend.prerender = {};\n");

for(var i = 0; i < files.length; i++) {
    fs.readFile(files[i],
        (function(i){ return function(err, buffer) {
            process.stdout.write("SpeakerGoogle.prerender[" + JSON.stringify(files[i].trim()) + "] = " + JSON.stringify('data:audio/mpeg;base64,' + buffer.toString('base64')) + ";\n");
        }})(i)
    );
}
