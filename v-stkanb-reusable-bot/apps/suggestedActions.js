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
        
        var msg = new builder.Message(session)
            .text("Hi! What is your favorite color?")
            .suggestedActions(
                builder.SuggestedActions.create(
                    session,[
                        builder.CardAction.imBack(session, "green", "green"),
                        builder.CardAction.imBack(session, "blue", "blue"),
                        builder.CardAction.imBack(session, "red", "red")
                    ]
                )
            );
        builder.Prompts.choice(session, msg, ["green", "blue", "red"]);
    },
    function(session, results) {
        session.send('I like ' +  results.response.entity + ' too!');
    }
]);
