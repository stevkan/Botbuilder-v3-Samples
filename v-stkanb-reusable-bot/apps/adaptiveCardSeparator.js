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

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
bot.set('storage', tableStorage);

const logUserConversation = (event) => {
    console.log('message: ' + event.text + ', user: ' + event.address.user.name);
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
            "contentType": "application/vnd.microsoft.card.adaptive",
            "content": {
                '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
                'version': '1.0',
                'type': 'AdaptiveCard',
                'body': [
                {
                    'type': 'TextBlock',
                    'text': 'Meeting Title',
                    'weight': 'bolder'
                },
                {
                    'type': 'TextBlock',
                    'text': 'Location',
                    'separator': true,
                    'isSubtle': true,
                    'size': 'small'
                },
                {
                    'type': 'TextBlock',
                    'text': 'Location',
                    'spacing': 'none'
                },
                {
                    'type': 'TextBlock',
                    'text': 'Organizer',
                    'separator': true,
                    'isSubtle': true,
                    'size': 'small'
                },
                {
                    'type': 'TextBlock',
                    'text': 'Organizer Name',
                    'spacing': 'none'
                },
                {
                    'type': 'TextBlock',
                    'text': 'Start Time',
                    'separator': true,
                    'isSubtle': true,
                    'size': 'small'
                },
                {
                    'type': 'ColumnSet',
                    'spacing': 'none',
                    'columns': [
                    {
                        'type': 'Column',
                        'width': 'auto',
                        'items': [
                        {
                            'type': 'TextBlock',
                            'text': '05:00 PM',
                            'isSubtle': false,
                            'weight': 'bolder'
                        }
                        ]
                    },
                    {
                        'type': 'Column',
                        'width': 'auto',
                        'items': [
                        {
                            'type': 'TextBlock',
                            'text': 'May 21'
                        }
                        ]
                    },
                    {
                        'type': 'Column',
                        'width': 'auto',
                        'items': [
                        {
                            'type': 'TextBlock',
                            'text': '2017',
                            'isSubtle': true,
                            'weight': 'bolder'
                        }
                        ]
                    }
                    ]
                },
                {
                    'type': 'TextBlock',
                    'text': 'End Time',
                    'separator': true,
                    'isSubtle': true,
                    'size': 'small'
                },
                {
                    'type': 'ColumnSet',
                    'spacing': 'none',
                    'columns': [
                    {
                        'type': 'Column',
                        'width': 'auto',
                        'items': [
                        {
                            'type': 'TextBlock',
                            'text': '05:30 PM',
                            'isSubtle': false,
                            'weight': 'bolder'
                        }
                        ]
                    },
                    {
                        'type': 'Column',
                        'width': 'auto',
                        'items': [
                        {
                            'type': 'TextBlock',
                            'text': 'May 21'
                        }
                        ]
                    },
                    {
                        'type': 'Column',
                        'width': 'auto',
                        'items': [
                        {
                            'type': 'TextBlock',
                            'text': '2017',
                            'isSubtle': true,
                            'weight': 'bolder'
                        }
                        ]
                    }
        
                    ]
                }
                ],
                'actions': [
                {
                    'type': 'Action.Submit',
                    'title': 'Accept',
                    'data':{
                        'accept': true
                    }
                },
                {
                    'type': 'Action.Submit',
                    'title': 'Decline',
                    'data':{
                        'accept': false
                    }
                }
                ]
          }
        };

        var msg = new builder.Message(session).addAttachment(card);
        session.send(msg);
    }
]);

// bot.dialog('/nextDialog', [
//     function (session) {
//         session.send("I'm Olive. Happy to assist you for room booking!");
//         session.send("I just need a few more details to get you booked for the trip of a lifetime!");
//     }
// ]);