/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

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

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

// var tableName = 'botdata';
// var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
// var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// // Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
// bot.set('storage', tableStorage);

// var bot = new builder.UniversalBot(connector, function (session, args) {
//     session.send('You reached the default message handler. You said \'%s\'.', session.message.text);
// });

bot.set('storage', new builder.MemoryBotStorage());

const logUserConversation = (event) => {
    console.log("Event", JSON.stringify(event, null, 4));
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

bot.dialog('/', [
    function (session) {
        
        var card = {
            'contentType': 'application/vnd.microsoft.card.adaptive',
            'content': {
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "type": "AdaptiveCard",
                "version": "1.0",
                "body": [
                    {
                        "type": "TextBlock",
                        "text": "Hi!! How can I help you today?",
                        "weight": "Bolder",
                        "size": "Medium"
                    }
                ],
                "actions": [
                    {
                        "type": "Action.Submit",
                        "title": "Action.Submit",
                        "data": { "x": "close" }
                    }
                ]
            }
        };
        
        var msg = new builder.Message(session)
            .addAttachment([card]);
        session.send(msg);
    }
]);

bot.dialog('/', [
    function (session) {
        console.log(session);
        session.send("I'm Olive. Happy to assist you for room booking!");
        session.send("I just need a few more details to get you booked for the trip of a lifetime!");
    }
]).triggerAction({
    matches: /Rooms.*&.*Stay/i
});

// /**
//  * Creates token server
//  */
// const generateDirectLineToken = require('./scripts/generateDirectLineToken');
// const renewDirectLineToken = require('./scripts/renewDirectLineToken');
// const bodyParser = require('body-parser');
// const request = require('request');
// const corsMiddleware = require('restify-cors-middleware');

// const cors = corsMiddleware({
//     origins: ['*']
// });
// // Create HTTP server.
// let dl_server = restify.createServer();
// dl_server.pre(cors.preflight);
// dl_server.use(cors.actual);
// dl_server.use(bodyParser.json({
//     extended: false
// }));
// dl_server.dl_name = 'DirectLine';
// dl_server.listen(process.env.port || process.env.PORT || 3500, function () {
//     console.log(`\n${dl_server.dl_name} listening to ${dl_server.url}.`);
// });
// // Listen for incoming requests.
// dl_server.post('/directline/token', (req, res) => {
//     // userId must start with `dl_`
//     const userId = (req.body && req.body.id) ? req.body.id : `dl_${Date.now() + Math.random().toString(36)}`;
//     const options = {
//         method: 'POST',
//         uri: 'https://directline.botframework.com/v3/directline/tokens/generate',
//         headers: {
//             'Authorization': `Bearer ${process.env.directLineSecret}`
//         },
//         json: {
//             User: {
//                 Id: userId
//             }
//         }
//     };
//     request.post(options, (error, response, body) => {
//         if (!error && response.statusCode < 300) {
//             res.send({
//                 token: body.token
//             });
//         } else {
//             res.status(500).send('Call to retrieve token from DirectLine failed');
//         }
//     });
// });
