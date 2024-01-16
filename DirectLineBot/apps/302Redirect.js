/* global address1 */
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
    appId: "b55ae686-29ab-430c-8b3b-5effc3005241",
    appPassword: "H^*HEMM)I#ik(}_5",
    openIdMetadata: ""
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());
server.post('/api/redirect', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
bot.set('storage', tableStorage);

// Calls bot upon start up
bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                bot.beginDialog(message.address, '/');
            }
        });
    }
});

bot.dialog('/', [
    function (session) {
        
         var card = new builder.HeroCard(session)
            .title('302 Redirect - Open URL')
            .buttons([
                builder.CardAction.openUrl(session, "https://302redirect.azurewebsites.net/api/redirect", 'Open URL')
            ]);
        session.send(new builder.Message(session).addAttachment(card));
        
        // var urlValue = card.content.body.filter(function(el) {
        //     return el.value;
        // });
        
        // console.log(JSON.stringify(urlValue));
        // session.dialogData.url = function(url) {
        //     if (urlValue === "http://www.google.com") {
        //         return urlValue = "http://www.bing.com";
        //     } else {
        //         return urlValue;
        //     }
        // };
        
        // session.dialogData.msg = new builder.Message(session).addAttachment(card);
        // console.log(session.dialogData.url);
        // session.send(session.dialogData.msg);
        // session.replaceDialog('/redirect');
    }
]);

bot.dialog('/redirect', [
    function (session) {
        
        // if (session.message && session.message.value) {
        //     // A Card's Submit Action obj was received
        //     processSubmitAction(session, session.message.value);
        //     return;
        // }

        var card = {
            'contentType': 'application/vnd.microsoft.card.adaptive',
            'content': {
                '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
                'type': 'AdaptiveCard',
                'version': '1.0',
                'body': [ /* */],
                'actions': [
                    // Hotels Search form
                    {
                        'type': 'Action.ShowCard',
                        'title': 'Hotels',
                        'speak': '<s>Hotels</s>',
                        'card': {
                            'type': 'AdaptiveCard',
                            'body': [ /* */],

                            'actions': [
                                {
                                    'type': 'Action.OpenUrl',
                                    'title': 'Action.OpenUrl (google.com)',
                                    'url': session.dialogData.url
                                }
                            ]
                        }

                    }

                ]
            }
        };
        var msg = new builder.Message(session).addAttachment(card);
        session.send(msg);
        session.endDialog();
    }
]);

// function processSubmitAction(session, value) {
//     session.send(session.message.value);
// };

// bot.dialog('redirectDialog', require('./redirect'));


// b55ae686-29ab-430c-8b3b-5effc3005241
// H^*HEMM)I#ik(}_5