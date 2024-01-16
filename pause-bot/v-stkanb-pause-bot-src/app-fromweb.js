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

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

var bot = new builder.UniversalBot(connector);
bot.set('storage', new builder.MemoryBotStorage());

/**
 * DIALOG SECTION
 */

// Calls bot upon start up

// bot.on('conversationUpdate', function(message) {
//     if (message.membersAdded) {
//         message.membersAdded.forEach(function(identity) {
//             if (identity.id === message.address.bot.id) {
//                 // var reply = new builder.Message()
//                 //     .address(message.address)
//                 //     .text("Welcome");
//                 // bot.send(reply);
//                 bot.beginDialog(message.address, '/');
//             }
//         });
//     }
// });


// Add first run dialog
// bot.dialog('firstRun', function (session) {
//     session.userData.firstRun = true;
//     session.send("Hello...").replaceDialog('/');
// }).triggerAction({
//     onFindAction: function (context, callback) {
//         // Only trigger if we've never seen user before
//         if (!context.userData.firstRun) {
//             // Return a score of 1.1 to ensure the first run dialog wins
//             callback(null, 1.1);
//         } else {
//             callback(null, 0.0);
//         }
//     }
// });

var logUserConversation = (event) => {
    console.log('message: ' + event.text + ', user: ' + event.address.user.name);
    console.log("event", JSON.stringify(event, null, 4));
};

// Middleware for logging
bot.use({
    receive: function (event, next) {
        console.log("Received from user:");
        logUserConversation(event);
        next();
    },
    send: function (event, next) {
        console.log("Sent by bot:");
        logUserConversation(event);

        console.log("The event value is: " + event.value);
        if (event.value === true) {
            pauseDialog();
        } else if (event.value === false) {
            resumeDialog();
        } else {
            // do nothing
        }

        next();
    }
});

bot.dialog('/', [
    function (session) {
        session.send("Welcome");
        session.beginDialog('/greetingDialog');
    }
]);

bot.dialog('/greetingDialog', [
    function (session) {
        if (!session.userData.name) {
            builder.Prompts.text(session, "What is your name?");
        }
    },
    function (session, results) {
        console.log(results);
        if (results.response) {
            session.userData.name == results.response;
        }
        session.send("Welcome %s!", session.userData.name);
        builder.Prompts.confirm(session, "Would you like to start over?");
    },
    function (session, results) {
        var confirm = results.response;
        if (confirm == true) {
            session.replaceDialog('/deleteDialog');
        }
        else {
            session.send("Going back to the greeting dialog.");
            session.replaceDialog('/greetingDialog');
        }
    }
]);

bot.dialog('/deleteDialog', [
    function (session) {
        session.send('Your login information has been deleted.');
        session.send("Sending you back to the beginning");
        session.userData = {};
        session.reset('/');
    }
]);

function pauseDialog(message) {
    bot.dialog(message.address, '/pauseDialog', [
        function (session) {
            session.send("Conversations have stopped");
            console.log("Conversation paused");
        }
    ])
    // .triggerAction({
    //     matches: /Conversation.*paused/i
    // });
}

function resumeDialog(message) {
    bot.dialog(message.address, '/resumeDialog', [
        function (session) {
            session.send("Conversations have started");
            console.log("Conversation resumed");
            session.endDialog();
        }
    ])
    // .triggerAction({
    //     matches: /Conversation.*resumed/i
    // });
}
