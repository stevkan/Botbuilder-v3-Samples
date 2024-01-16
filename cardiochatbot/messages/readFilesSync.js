var fs = require('fs');
var filenames = fs.readdirSync("bot-config");

//console.log("Filenames are "+filenames.toString());

filenames.sort((name1,name2) => {
    name1 = name1.replace(".json", "");
    name2 = name2.replace(".json", "");

    if(name1 === "welcome"){
        return -1;
    }else if(name2 === "welcome"){
        return 1
    }

    if(name1 === "init"){
        return -1;
    }else if(name2 === "init"){
        return 1
    }

    name1Arr = name1.replace("path", "").split("-");
    name2Arr = name2.replace("path", "").split("-");

    if(name1Arr.length < name2Arr.length){
        return -1;
    }else if(name2Arr.length < name1Arr.length){
        return 1;
    }else if(name1Arr.length === name2Arr.length){
        for(var i=0; i<name1Arr.length; i++){
            if(parseInt(name1Arr[i]) < parseInt(name2Arr[i])){
                return -1;
            }else if(parseInt(name2Arr[i]) < parseInt(name1Arr[i])){
                return 1;
            }else{
                continue;
            }
        }
    }
});
//console.log("Sorted Filnames : "+filenames.toString());

conversationData = {"welcome":[], "init":{"next":[]}}
var convData = conversationData.init;
for(var i=2; i<filenames.length; i++){
    var pathArr = filenames[i].replace("path-","").replace(".json","").split("-");
    var convData = conversationData.init;
    for(var j=0; j<pathArr.length; j++){
        if(j === pathArr.length - 1){
            convData.next = convData.next.concat([{"next":[]}])
        }else{
            convData = convData.next[parseInt(pathArr[j])-1];
        }
    }
}
//console.log("Constructed conversationData before reading files "+JSON.stringify(conversationData));
var welcomeContent = fs.readFileSync("bot-config/" + filenames[0], 'utf-8');
welcomeContent = welcomeContent.replace(/\r?\n|\r/g, " ").trim();
conversationData["welcome"] = JSON.parse(welcomeContent);

var initContent = fs.readFileSync("bot-config/" + filenames[1], 'utf-8');
initContent = initContent.replace(/\r?\n|\r/g, " ").trim();
conversationData["init"] = Object.assign({}, JSON.parse(initContent), conversationData["init"])

var pathFiles = filenames.slice(2, filenames.length);
pathFiles.forEach(function(file){
    console.log("Reading the file : "+file);
    var pathContent = fs.readFileSync("bot-config/" + file, 'utf-8');
    pathContent = pathContent.replace(/\s\s+/g, " ").replace(/  +/g, ' ').trim();
    pathArr = file.replace("path-","").replace(".json","").split("-");
    var data = JSON.parse(pathContent);
    var convData = conversationData.init;
    for(var j=0; j<pathArr.length; j++){
        if(j === pathArr.length - 1){
            convData.next[parseInt(pathArr[j])-1] = Object.assign({}, data, {"next" : convData.next[parseInt(pathArr[j])-1].next});
        }else{
            convData = convData.next[parseInt(pathArr[j])-1];
        }
    }
});

fs.writeFile("output.json", JSON.stringify(conversationData, null, 5), (err) => {
    if(err){
        console.log(err);
        return;
    }
    console.log("File saved successfully");
});
