var fs = require('fs');
var filenames = [];

//function readFiles(dirname, onFileContent, onError) {
  fs.readdirSync("bot-config", "utf-8", function(err, files) {
    if (err) {
      onError(err);
      return;
    }
    filenames = files
    console.log("Read dir files are "+files.toString());
})
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
    console.log("Sorted Filnames : "+filenames.toString());
    conversationData = {"welcome":[], "init":{"next":[]}}
    var convData = conversationData.init;
    for(var i=2; i<filenames.length; i++){
        var pathArr = filenames[i].replace("path-","").replace(".json","").split("-");
        //console.log("pathArr for filename "+filenames[i]+" is "+pathArr.toString());
        var convData = conversationData.init;
        for(var j=0; j<pathArr.length; j++){
            //console.log("j = "+j+" and pathArr length is "+pathArr.length);
            if(j === pathArr.length - 1){
                //console.log("Adding the next convData for "+JSON.stringify(convData))
                convData.next = convData.next.concat([{"next":[]}])
                //console.log("convData after adding "+JSON.stringify(convData));
            }else{
                convData = convData.next[parseInt(pathArr[j])-1];
            }
        }
        //console.log("Constructed conversationData before reading files so far "+JSON.stringify(conversationData));
    }
    //console.log("Constructed conversationData before reading files "+JSON.stringify(conversationData));

    fs.readFileSync("bot-config/" + filenames[0], 'utf-8', function(err, content) {
        if (err) {
          console.log(err);
          return;
        }
        content = content.replace(/\r?\n|\r/g, " ").trim();
        conversationData["welcome"] = JSON.parse(content);
    });
    fs.readFileSync("bot-config/" + filenames[1], 'utf-8', function(err, content) {
            if (err) {
              console.log(err);
              return;
            }
            content = content.replace(/\r?\n|\r/g, " ").trim();
            var data = JSON.parse(content);
            //var next = [];
            /**for(var i=0; i<data.Choices.length; i++){
                next = next.concat({});
            }**/
            //data = Object.assign({}, data);
            conversationData["init"] = Object.assign({}, data, conversationData["init"])
    })
            var j = 0;
            var pathFiles = filenames.slice(2, filenames.length);
            pathFiles.forEach(function(file){
                fs.readFileSync("bot-config/" + file, 'utf-8', function(err, content) {
                    if (err) {
                      console.log(err);
                      return;
                    }
                    content = content.replace(/\r?\n|\r/g, " ").trim();
                    //console.log("Reading the file "+file);
                    //console.log("Read content is"+content);
                    //console.log("=====================")
                    pathArr = file.replace("path-","").replace(".json","").split("-");
                    //console.log("pathArr for filename "+file+" is "+pathArr.toString());
                    var data = JSON.parse(content);
                    var convData = conversationData.init;
                    for(var j=0; j<pathArr.length; j++){
                        //console.log("j = "+j+" and value is "+pathArr[j]+" and pathArr length is "+pathArr.length);
                        if(j === pathArr.length - 1){
                            //console.log("Adding the next convData for "+JSON.stringify(convData))
                            //console.log("Constructed object is "+JSON.stringify(Object.assign({}, data, {"next" : convData.next[parseInt(pathArr[j])-1].next})))
                            convData.next[parseInt(pathArr[j])-1] = Object.assign({}, data, {"next" : convData.next[parseInt(pathArr[j])-1].next});
                            //console.log("convData after adding "+JSON.stringify(convData));
                        }else{
                            convData = convData.next[parseInt(pathArr[j])-1];
                        }
                    }
                    //console.log("Constructed conversationData before reading files so far "+JSON.stringify(conversationData));
                    /**fs.writeFile("output-"+file+".json", JSON.stringify(conversationData, null, 5), (err) => {
                        if(err){
                            console.log(err);
                            return;
                        }
                        console.log("File saved successfully");
                    })**/
                    //console.log("==================================================================")
                });
            });
        /**fs.writeFile("output.json", JSON.stringify(conversationData, null, 5), (err) => {
            if(err){
                console.log(err);
                return;
            }
            console.log("File saved successfully");
    });**/
    /**setTimeout(function(){
        fs.writeFile("output.json", JSON.stringify(conversationData, null, 5), (err) => {
            if(err){
                console.log(err);
                return;
            }
            console.log("File saved successfully");
        });
    }, 10000)**/

//}
