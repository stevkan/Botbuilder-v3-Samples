// This loads the environment variables from the .env file
require('dotenv-extended').load();

var builder = require('botbuilder');
var restify = require('restify');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

var inMemoryStorage = new builder.MemoryBotStorage();

// Create connector and listen for messages
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});
var bot = new builder.UniversalBot(connector).set('storage', inMemoryStorage);
server.post('/api/messages', connector.listen());


bot.dialog('/', [
    function (session) {
        
        var msg = {
            facebook: {
                attachment: {
                    'type': "template",
                    'payload': {
                        'template_type': "list",
                        'top_element_style': "compact",
                        'elements': [
                            {
                                'title': "Microsoft Bot Framework 1",
                                'image_url': "http://static.panoramio.com/photos/large/72318690.jpg",
                                'subtitle': "Check 1 out!",
                                'buttons': [
                                    {
                                        'type': "phone_number",
                                        'title': "Call Now 1",
                                        'payload': "+18001234567"
                                    }
                                ]
                            },
                            {
                                'title': "Microsoft Bot Framework 2",
                                'image_url': "http://static.panoramio.com/photos/large/72318690.jpg",
                                'subtitle': "Check 2 out!",
                                'buttons': [
                                    {
                                        'type': "phone_number",
                                        'title': "Call Now 2",
                                        'payload': "8001234567"
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        };
        
        var reply = new builder.Message(session).sourceEvent(msg);
        
        session.send(reply);
        session.endDialog();
    }
]);
