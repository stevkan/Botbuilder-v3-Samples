"use strict";
global.builder = require("botbuilder");
global.formBuilder = require('botbuilder-forms')
var botbuilder_azure = require("botbuilder-azure");
var fileReader = require("fs");
var path = require('path');
var fs = require('fs');
global.transcript = require('./transcript');

var responseDelayInSeconds = 0;

var choice3 = '';
var choice4 = '';
const finalNote = 'Wonderful!  I went ahead and pulled some additional resources on this topic that you may want to reference for the future.';
var customMessage = '';

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword']
    //stateEndpoint: process.env['BotStateEndpoint'],
    //openIdMetadata: process.env['BotOpenIdMetadata']
});

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

    var name1Arr = name1.replace("path", "").split("-");
    var name2Arr = name2.replace("path", "").split("-");

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

global.conversationData = {"welcome":[], "init":{"next":[]}}
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
    var pathContent = fs.readFileSync("bot-config/" + file, 'utf-8');
    pathContent = pathContent.replace(/\r?\n|\r/g, " ").trim();
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

var bot = new builder.UniversalBot(connector);

bot.use({
    botbuilder: function (session, next) {
        if(session.message && session.message.type === "message"){
            //console.log("Receive Message with session message is "+JSON.stringify(session.message, null, 5));
            transcript.logConversations({"text" : session.message.text, "action" : "Receive_Message"}, session.message.address.conversation.id);
        }
        next();
    },
    send: function (event, next) {
        //console.log("Send called with type as "+event.type);
        if(event.type === "message"){
            //console.log("Send Message with session message is "+JSON.stringify(event, null, 5));
            transcript.logConversations({"text" : event.text, "action" : "Send_Message", "attachments" : event.attachments}, event.address.conversation.id);
            //console.log("Full event is "+JSON.stringify(event, null, 5));
        }
        next();
    }
})

/**const logUserConversation = (event) => {
    console.log('message: ' + event.text + ', user: ' + event.address.user.name);
};

// Middleware for logging
bot.use({
    receive: function (event, next) {
        logUserConversation(event);
        next();
    },
    send: function (event, next) {
        logUserConversation(event);
        next();
    }
});**/

var createWelcomeTimeoutCallbacks = function(array, finalStatement){
    var functionBody = "||"
    for(var i=0; i<array.length; i++){
        if( i !== array.length-1 ){
            functionBody = functionBody.replace("||",
                "session.sendTyping();setTimeout(function(){session.send(\""+array[i]+"\");||}, "+(responseDelayInSeconds * 1000)+");");
        }else{
             functionBody = functionBody.replace("||", finalStatement );
        }
    }
    functionBody = functionBody.replace("||", "");
    functionBody = functionBody + "session.conversationData.visited = false;";
    //functionBody = functionBody + "session.conversationData.nameGiven = null;";
    return new Function('session', functionBody);
}

var welcomeMessageFunction = createWelcomeTimeoutCallbacks(conversationData["welcome"], "session.beginDialog('/');");
bot.dialog('Welcome Message', [welcomeMessageFunction]);

var builderPromptsText = builder.Prompts.text;

var createInitiateConvFunction = function(){
    var functionBody = "if(session.message.text !== \"\" && !session.conversationData.visited){session.conversationData.nameGiven = \"|name|\";}";
    functionBody = functionBody + "session.conversationData.currentConversationData = Object.assign({}, conversationData[\"init\"], {next : []});";
    //functionBody = functionBody + "if(!session.conversationData.nameGiven){";
    //functionBody = functionBody + "session.sendTyping();";
    //functionBody = functionBody + "setTimeout(function(){var promptForName = \""+conversationData["welcome"][conversationData["welcome"].length-1]+"\";console.log(\"Prompt for name : \"); console.log(promptForName);builder.Prompts.text(session, promptForName);}, "+ (responseDelayInSeconds * 1000)+");console.log(\"Prompt for name sent\");";
    //functionBody = functionBody + "}else{
    functionBody = functionBody + "console.log(\"Inside createInitiateConvFunction\");"
    functionBody = functionBody + "next();";
    //functionBody = functionBody + "}";
    functionBody = functionBody + "session.conversationData.currentConversationData = Object.assign({}, conversationData[\"init\"], {next : []});";
    return new Function (['session', 'results', 'next'], functionBody);
}

var createInitiateConvResponseFunction = function(){
    var functionBody = "console.log(\"Inside createInitiateConvResponseFunction\");"
    functionBody = functionBody + "if(!session.conversationData.nameGiven){session.conversationData.nameGiven = \"|name|\";}";
    //functionBody = functionBody + "console.log(\"Initiate COnv Response function called with nameGiven as \"+session.conversationData.nameGiven);"
    functionBody = functionBody + "if(session.conversationData.visited){session.send(\""+"Welcome back "+"\"+session.conversationData.nameGiven);}";
    functionBody = functionBody + "||"
    for(var key  in conversationData["init"]){
        if(key !== "Prompt" && key !== "Choices" && key !== "next"){
            functionBody = functionBody.replace("||",
                "session.sendTyping();setTimeout(function(){session.send(\""+conversationData["init"][key]+"\");||}, "+(responseDelayInSeconds * 1000)+");");
        }else if(key === "Prompt"){
             functionBody =  functionBody.replace("||",
                "session.sendTyping();setTimeout(function(){builder.Prompts.choice(session, \""+conversationData["init"][key]+"\",\""+conversationData["init"]["Choices"].join("|")+"\", { listStyle: builder.ListStyle.button } ); session.conversationData.welcomeMessageFinished = true;}, "+(responseDelayInSeconds * 1000)+");");
        }
    }
    functionBody = functionBody.replace("||", "");
    functionBody = functionBody + "session.conversationData.currentConversationEnded = false;";
    functionBody = functionBody + "session.conversationData.currentConversationPath = undefined;";
    functionBody = functionBody.replace("<name>", "\"\+session.conversationData.nameGiven\+\"");
    //functionBody = functionBody + "session.conversationData.currentConversationData = session.conversationData.currentConversationData.replace(\"<name>\", session.conversationData.nameGiven);";
    //console.log("Created Function Body : "+functionBody);
    return new Function(['session', 'results'], functionBody);
}

//global.currentConversationData = conversationData["init"];
global.functionSelfCallback = function(conv){

}

global.questions = [
  {
    field: 'Text',
    question: 'Your Email Address?',
    prompt: 'Is this your Email Address: {Text}?',
    validation: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    repromptText: 'Sorry, that doesn\'t look right. Please enter a valid email address'
  }
]

bot.library(formBuilder.createLibrary())

//global.sleep = require('sleep');

var createConvFunction = function(){
    var functionBody = "session.sendTyping();";
    functionBody = functionBody + "if(session.message.text === \"Start Over\"){session.beginDialog(\"/\", {\"name\" : session.conversationData.nameGiven})}else if(session.message.text === \"Send Email\"){session.beginDialog(\"FormBuilder:/\", {questions: questions})}else{"
    functionBody = functionBody + "if(session.conversationData.currentConversationData.Choices){for(var j = 0; j<session.conversationData.currentConversationData.Choices.length; j++){";
    functionBody = functionBody + "if(session.message.text === session.conversationData.currentConversationData.Choices[j]){";
    functionBody = functionBody + "if(!session.conversationData.currentConversationPath){session.conversationData.currentConversationPath=\"\"+j}else{session.conversationData.currentConversationPath=session.conversationData.currentConversationPath+\"-\"+j}";
    functionBody = functionBody + "console.log(\"Current Conversation Path : \"+session.conversationData.currentConversationPath);"
    functionBody = functionBody + "var currentConversationData = conversationData[\"init\"];var pathSteps = session.conversationData.currentConversationPath.split(\"-\");for(var t=0; t<pathSteps.length; t++){ currentConversationData = currentConversationData.next[parseInt(pathSteps[t])];}"
    functionBody = functionBody + "session.conversationData.currentConversationData = Object.assign({}, currentConversationData, { next : [] });";
    functionBody = functionBody + "console.log(\"Current Conversation Data : \"+JSON.stringify(session.conversationData.currentConversationData));"
    functionBody = functionBody + "session.sendTyping();";
    functionBody = functionBody + "Object.keys(session.conversationData.currentConversationData).forEach(function(key){";
    //functionBody = functionBody + "console.log(\"Inside for loop with key : \"+key);"
    //functionBody = functionBody + "if(key !== \"Prompt\" && key !== \"Choices\" && key !== \"next\" && key !== \"EndConv\"){console.log(\"Current Conversation Data with \"+key+\" : \"+JSON.stringify(session.conversationData.currentConversationData[key]));setTimeout(function(){console.log(\"Before sending the \"+key);console.log(\"And sending data is \"+JSON.stringify(session.conversationData.currentConversationData[key]));session.send(session.conversationData.currentConversationData[key]);session.sendTyping()}, parseInt(key) * "+(responseDelayInSeconds * 1000)+")}";
    //functionBody = functionBody + "else if(key === \"Prompt\"){console.log(\"Inside Prompt with key : \"+key);setTimeout(function(){builder.Prompts.choice(session, session.conversationData.currentConversationData[key], session.conversationData.currentConversationData[\"Choices\"].join(\"|\"),{ listStyle: builder.ListStyle.button } )}, (Object.keys(session.conversationData.currentConversationData).length-2) * "+(responseDelayInSeconds * 1000)+")}"
    functionBody = functionBody + "if(key !== \"Prompt\" && key !== \"Choices\" && key !== \"next\" && key !== \"EndConv\"){setTimeout(function(){var sendText = (session.conversationData.currentConversationData[key].replace(\"<name>\", session.conversationData.nameGiven));console.log(\"SendText is \"+(session.conversationData.currentConversationData[key].replace(\"<name>\", session.conversationData.nameGiven)));console.log(\"Index Of <name> is \"+session.conversationData.currentConversationData[key].indexOf(\"<name>\"));console.log(\"Name Given is \"+session.conversationData.nameGiven);session.send(\"\"+(session.conversationData.currentConversationData[key].replace(\"<name>\", session.conversationData.nameGiven)));session.sendTyping()}, parseInt(key) * "+(responseDelayInSeconds * 1000)+")}";
    functionBody = functionBody + "else if(key === \"Prompt\"){setTimeout(function(){var sendText = session.conversationData.currentConversationData[key].replace(\"<name>\", session.conversationData.nameGiven);builder.Prompts.choice(session, \"\"+(session.conversationData.currentConversationData[key].replace(\"<name>\", session.conversationData.nameGiven)), session.conversationData.currentConversationData[\"Choices\"].join(\"|\"),{ listStyle: builder.ListStyle.button } )}, (Object.keys(session.conversationData.currentConversationData).length-2) * "+(responseDelayInSeconds * 1000)+")}"
    functionBody = functionBody + "});";
    //functionBody = functionBody + "console.log(\"Current End Conv : \"+session.conversationData.currentConversationData[\"EndConv\"]);";
    functionBody = functionBody + "if(!session.conversationData.currentConversationData[\"Prompt\"] && session.conversationData.currentConversationData[\"EndConv\"] === \"Yes\"){var delay = (Object.keys(session.conversationData.currentConversationData).length) *"+(responseDelayInSeconds * 1000)+";session.sendTyping();setTimeout(function(){builder.Prompts.choice(session, \"Goodbye!\", \"Start Over|End Chat|Send Email\",{ listStyle: builder.ListStyle.button } ); session.conversationData.currentConversationEnded = true;session.conversationData.visited = true},delay);}";
    functionBody = functionBody + "break;}}}else{next()}}";

    functionBody = functionBody.replace("<name>", "\"\+session.conversationData.nameGiven\+\"");

    return new Function(['session', 'results', 'next'], functionBody);
}


var initiateConvFunction = createInitiateConvFunction();
var createInitiateConvResponse = createInitiateConvResponseFunction()
var convFunction = createConvFunction();

bot.dialog("/", [initiateConvFunction,
  createInitiateConvResponse,
  convFunction,
  convFunction,
  convFunction,
  convFunction,
  convFunction,
  convFunction,
  convFunction,
  function(session, results){//console.log("Session Ended with email address as "+session.message.text);
                                        transcript.createPDFAndSendEmail(session.message.text, session);}]);

bot.dialog("Intiate Conversation", [
  function(session, args){
      session.send("Welcome "+session.conversationData.nameGiven+" !!");
  },
]);


bot.dialog('Ask Name', [
    function(session, args){
        builder.Prompts.text(session, 'Can I know your name?');
    },
    function(session, results){
        //console.log('Got the username : '+session.message.text);
        session.conversationData.nameGiven = session.message.text;
        session.endDialogWithResult(results);
    }
]);

bot.dialog('User Situation' , [
    function(session, args){
        //console.log('Hitting the User Situation dialog');
        session.sendTyping();
            setTimeout(function(){
             builder.Prompts.choice(session,
              args+' Which of these best matches the situation you have?',
             'No payment towards a service I already received|No coverage for medication I need|Denial of pre-authorization request for a service my doctor prescribed',
             { listStyle: builder.ListStyle.button }
             );
        },responseDelayInSeconds * 1000);

        //console.log('Hitting the end of User Situation dialog');
    },
    function(session, results){
        //console.log('Hitting the second function of User Situation dialog');
        session.endDialogWithResult(results);
    }
]);

bot.dialog('Received EOB or a Bill', [
    function(session){
        session.sendTyping();
        setTimeout(function(){
            builder.Prompts.choice(session,
            'Have you received an Explanation of Benefits, known as an EOB from your plan yet or a bill from the doctor?',
            'I have my EOB|I only have a bill from the doctor|I have both the EOB and the bill from the doctor',
            { listStyle: builder.ListStyle.button }
          );
        }, responseDelayInSeconds * 1000);
    },
    function(session, results){
       session.endDialogWithResult(results);
    }
])

bot.dialog('Reason for Denial', [
    function(session){
        //console.log('Reason for denial first function')
        session.sendTyping();
        setTimeout(function(){
            builder.Prompts.choice(session,
            'Can you tell me which of these best matches the reason provided on the denial letter?',
            'Medication not on approved drug list or formulary|Approved prior-authorization not received|Medication requires me to use another medication first, called step therapy|Medication limit has already been met (dose or quantity)|Requires a different pharmacy or mail-order pharmacy|Other reason',
            { listStyle: builder.ListStyle.button }
           );
        }, responseDelayInSeconds * 1000);
    },
    function(session, results){
        //console.log('Reason for denial second function');
        session.endDialogWithResult(results);
    }
])

bot.dialog('Ready for steps to take', [
    function(session){
       session.sendTyping();
       setTimeout(function(){
          builder.Prompts.confirm(session,
           'Are you ready for some steps you can take?');
       }, responseDelayInSeconds * 1000);
    },
    function(session, results){
        session.endDialogWithResult(results);
    }
]);

bot.dialog('Did that help', [
    function(session){
       session.sendTyping();
       setTimeout(function(){
           builder.Prompts.choice(session,
            'Did that help?',
             'Yes|No',
             { listStyle: builder.ListStyle.button }
         );
       }, responseDelayInSeconds * 1000);
    },
    function(session, results){
        session.endDialogWithResult(results);
    }
]);


bot.on('conversationUpdate', function (message) {
    //console.log('Conversation Update called with message as '+JSON.stringify(message, null, 5));
    //console.log("Current Bot is "+JSON.stringify(bot, null, 5));
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                //if(!convStartedAddress.has(message.address)){
                   // convStartedAddress.add(message.address);
                    //console.log('Starting the root dialog');
                    bot.beginDialog(message.address, 'Welcome Message');
                //}
            }
        });
    }else if(message.membersRemoved){
        console.log("A member removed with message as "+JSON.stringify(message, null, 5));
    }
});

bot.localePath(path.join(__dirname, './locale'));

/**bot.dialog('/', function (session) {
    session.send('You said ' + session.message.text);
});**/
console.log("Before Initializing the bot");


if (useEmulator) {
    console.log("Initializing the bot inside if condition");
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());
} else {
    console.log("Initializing the bot inside else condition");
    module.exports = { default : connector.listen() }
}
