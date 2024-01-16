/*-----------------------------------------------------------------------------
A simple Language Understanding (LUIS) bot for the Microsoft Bot Framework.
-----------------------------------------------------------------------------*/
require('dotenv').config();

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
var cognitiveservices = require('botbuilder-cognitiveservices');


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: 'e9da8332-8c9a-401d-9ff2-5584a0333909',
    appPassword: 'gnLiOF^dFbL*wv5%',
    openIdMetadata: ''
});

// Listen for messages from users
server.post('/api/messages', connector.listen());

// Create your bot with a function to receive messages from the user
// This default message handler is invoked if the user's utterance doesn't
// match any intents handled by other dialogs.
var bot = new builder.UniversalBot(connector);

bot.set('storage', new builder.MemoryBotStorage());

const logUserConversation = (event) => {
    console.log("Event", JSON.stringify(event, null, 4));
    // if (event.type == "message" && event.agent) {
    // }
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
        next();
    }
});

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                bot.beginDialog(message.address, '/');
            }
        });
    }
});

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName // || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey;
// Create a recognizer that gets intents from LUIS, and add it to the bot
var luisrecognizer = new builder.LuisRecognizer(LuisModelUrl);


// Recognizer and and Dialog for GA QnAMaker service
var qnarecognizer = new cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: process.env.QnAKnowledgebaseId,
    authKey: process.env.QnAAuthKey || process.env.QnASubscriptionKey, // Backward compatibility with QnAMaker (Preview)
    endpointHostName: process.env.QnAEndpointHostName
});

var basicQnAMakerDialog = new cognitiveservices.QnAMakerDialog({
    recognizers: [qnarecognizer],
    defaultMessage: 'No match! Try changing the query terms!',
    qnaThreshold: 0.3
});

bot.recognizer(luisrecognizer);
bot.recognizer(basicQnAMakerDialog);

bot.dialog('/', basicQnAMakerDialog);


// Add a dialog for each intent that the LUIS app recognizes.
// See https://docs.microsoft.com/bot-framework/nodejs/bot-builder-nodejs-recognize-intent-luis
bot.dialog('GreetingDialog',[
    (session) => {
        session.send('You reached the Greeting intent. You said \'%s\'.', session.message.text);
        session.endDialog();
    }
]).triggerAction({
    matches: 'Greeting'
})

bot.dialog('WeatherDialog',
    (session, next) => {
        session.send('You reached the Weather intent. You said \'%s\'.', session.message.text);
        session.endDialog();
    }
).triggerAction({
    matches: 'Weather.GetForecast'
})

bot.dialog('HelpDialog',
    (session) => {
        session.send('You reached the Help intent. You said \'%s\'.', session.message.text);
        session.endDialog();
    }
).triggerAction({
    matches: 'Help'
})

bot.dialog('reset', [
        function(session, args, next) {
            session.send("Ok, starting over.");
            next();
        },
        function(session) {
            session.send("Welcome Back");
            session.beginDialog('/');
        }
    ]
).triggerAction({
    matches: /^reset/i
});