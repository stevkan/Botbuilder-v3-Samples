var fs = require('fs');
var filenames = fs.readdirSync("bot-config");

var links = JSON.parse(fs.readFileSync("links.json"), "utf-8");

filenames.forEach(function(filename){
    var file = JSON.parse(fs.readFileSync("bot-config/" + filename, 'utf-8').replace(/\s\s+/g, " ").replace(/  +/g, ' ').trim());

    for(var key in file){
        //console.log("typeof file["+key+"] : "+(typeof file[key]));
        if(typeof file[key] === "string"){
            var match = file[key].match(/\[((.)*?)\]( )*\(((.)*?)\)/ig);
            if(match){
                var matchedString = match[0];
                matchFound = matchedString.replace(/\(((.)*?)\)/ig, "()");
                //console.log("matchFound is "+matchFound);
                var label = matchFound.replace(/(\[|\]|\(\))/ig, "").trim();
                //console.log("Extracted Label is "+label+" and link is "+links[label]);
                var builtLink = matchFound.replace("()", "("+links[label]+")");
                if(!links[label]){
                    //console.log("matchFound is "+matchFound);
                    //console.log("Extracted Label is "+label);
                    //console.log("Link not found for label : "+label+" in "+filename);
                    //console.log("\n");
                }
                //console.log("Built Link is "+builtLink);
                file[key] = file[key].replace(matchedString, builtLink);
                //if(filename === "path-1-1-1-1-1.json"){
                    //console.log("File path-1-1-1-1-1.json with key : "+key+"\ncontent : "+file[key]+"\nmatchFound : "+matchFound+"\nlabel : "+label+"\nbuiltLink : "+builtLink);
                //}
            }
        }
    }
    //fs.writeFileSync("bot-config/" + filename, JSON.stringify(file, null, 5));
    //if(filename === "path-1-1-1-1-1.json"){
        //console.log("content of the file path-1-1-1-1-1.json is "+JSON.stringify(file, null, 5));
    //}
})
