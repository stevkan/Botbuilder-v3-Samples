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
    appId: 'e9da8332-8c9a-401d-9ff2-5584a0333909',
    appPassword: 'gnLiOF^dFbL*wv5%',
    openIdMetadata: ''
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, 'DefaultEndpointsProtocol=https;AccountName=vstkanb;AccountKey=oaZ7svb2YuR210vpk8GVaGLBscT9Zy7DtYJjbVBWADg4zhKugAfrqjXyjs4h1BeEqcLOgkJTr2AthDqGVC91lg==;'); // process.env['AzureWebJobsStorage']);
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

bot.use({
    botbuilder: (session, next) => {
        if (session.conversationData != null) {
            if (session.message.text) {
                const match = /test/i.exec(session.message.text);
                if (!match) {
                    return next();
                }
                var message = "Ending conversation";
                return session.endConversation(message);
            }
            return next();
        } else if (session.conversationData == null) {
            var message = "The message is ended, foo!";
            return session.message(message);
        }
    }
});

bot.dialog('/', [
    function (session) {
        builder.Prompts.text(session, "Hi. What is your name?");
    },
    function (session, results) {
        session.userData.name = results.response;
        builder.Prompts.choice(session, "Would you like to add a calendar event?", ["Yes", "No"]);
    }
])

bot.dialog('meetingDialog', [
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
                        'data': {
                            'accept': true
                        }
                    },
                    {
                        'type': 'Action.Submit',
                        'title': 'Decline',
                        'data': {
                            'accept': false
                        }
                    }
                ]
            }
        };

        var msg = new builder.Message(session).addAttachment(card);
        session.send(msg);
    },
    function (session, results) {
        session.dialogData.calAccept = results.response.entity;
        if (session.dialogData.calAccept == true) {
            session.send("Calendar event added");
            session.replaceDialog('/');
        } else if (session.dialogData.calAccept == false) {
            session.send("Calendar event rejected.");
            session.replaceDialog('/');
        }
    }
])
    .triggerAction({
        matches: /Yes/i
    })
    .beginDialogAction('returnMain', '/', {
        matches: /No/i
    });

// bot.dialog('/nextDialog', [
//     function (session) {
//         session.send("I'm Olive. Happy to assist you for room booking!");
//         session.send("I just need a few more details to get you booked for the trip of a lifetime!");
//     }
// ]);