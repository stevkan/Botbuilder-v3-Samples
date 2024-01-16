var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 

});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector);
bot.set('storage', new builder.MemoryBotStorage()); 


/**
 * DIALOG SECTION
 */

// Calls bot upon start up

bot.on('conversationUpdate', function(message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function(identity) {
            if (identity.id === message.address.bot.id) {
                var reply = new builder.Message()
                    .address(message.address)
                    .text("Welcome");
                bot.send(reply);
            }
        });
    }
});

// Add first run dialog
bot.dialog('firstRun', function (session) {    
    session.userData.firstRun = true;
    session.send("Hello...").replaceDialog('/');
}).triggerAction({
    onFindAction: function (context, callback) {
        // Only trigger if we've never seen user before
        if (!context.userData.firstRun) {
            // Return a score of 1.1 to ensure the first run dialog wins
            callback(null, 1.1);
        } else {
            callback(null, 0.0);
        }
    }
});

var logUserConversation = (event) => {
    console.log('message: ' + event.text + ', user: ' + event.address.user.name);
    console.log("Event", JSON.stringify(event, null, 4));
};

// Middleware for logging
bot.use({
    receive: function(event, next) {
        console.log("Received from user:");
        logUserConversation(event);
        next();
    },
    send: function(event, next) {
        console.log("Sent by bot:");
        logUserConversation(event);
        next();
    }
});

// bot.dialog('/');
var loggedIn = '';

bot.dialog('/', [
    function(session) {
        if (!session.userData.name) {
            builder.Prompts.text(session, "What is your name?");
        }
    },
    function(session, results) {
        if (results.response) {
            session.userData.name = results.response;
            session.beginDialog('greetingDialog');
        }
    }
]);

bot.dialog('greetingDialog', [
    function(session) {
        // session.send(session.dialogData.loggedIn);
            session.send("Welcome %s!", session.userData.name);
            builder.Prompts.confirm(session, "Try another dialog?");                
    },
    function(session, results) {
        var confirm = results.response;
        if(confirm == true) {
            session.replaceDialog('deleteDialog');
        }
        else {
            session.send("Going back to main dialog");
            session.replaceDialog('greetingDialog');
        }
    }
]);

bot.dialog('deleteDialog', [
    function(session) {
            session.send('your acc has been deleted');
            session.userData = {};
            //session.save()
            session.reset('/');
    }
]);