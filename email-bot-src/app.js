/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

require('dotenv').config();

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
var inMemoryStorage = new builder.MemoryBotStorage();

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
bot.set('storage', inMemoryStorage);

bot.dialog('/', function (session) {
    console.log(session);
    try {
        console.log("\nTO\n");
        console.log(session.message.sourceEvent.ToRecipients);
        console.log("\nADDRESS USER\n");
        console.log(session.message.address.user);
        console.log("\nTEXT BODY\n");
        console.log(session.message.sourceEvent.TextBody);
        console.log("\nBODY\n");
        console.log(session.message.sourceEvent.Body);
    } catch (ex) {
        console.log("Meh.  Probably wasn't an email.")
        console.log(ex);
    }
    if (session.message.text === "list") {
        session.beginDialog("list");
    } else {
        var reply = new builder.Message(session);
        if (session.message.source.channelId === "email") {
            reply.sourceEvent({
                email: {
                    "htmlBody": `<html><body style="font-family: Calibri; font-size: 11pt;">You said ${session.message.text}.<br>${session.message.sourceEvent.Body.Text}</body></html>`,
                    "subject": `${session.message.sourceEvent.Subject}`,
                    "importance": `${session.message.sourceEvent.Importance}`
                }
            });

            session.send(reply);
            //session.send('You said ' + session.message.text + "\n" + session.message.sourceEvent.TextBody.Text);
        } else {
            reply.text(session.message.text.toString());
            session.send('You said ' + session.message.text);
        }
    }
});

bot.dialog('list', [
    function (session) {
        calendarAPI.listEventsAPI(function (events, answer) {
            var na = {};
            answer = "";

            for (e of events) {
                //console.log(e);
                const start = new Date(e.start.dateTime);
                answer += e.summary;
                answer += start.getDate();
                answer += "   ";
            }

            console.log("End of the function: " + answer);

            var reply = new builder.Message(session);
            reply.sourceEvent({
                email: {
                    // use whatever body styling is desired.
                    "htmlBody": `<html><body style="font-family: Calibri; font-size: 11pt;">${answer}<br>${session.message.sourceEvent.Body.Text}</body></html>`,
                    "subject": `${session.message.sourceEvent.Subject}`,
                    "importance": `${session.message.sourceEvent.Importance}`
                }
            });

            session.send(reply);
            session.send(answer);
            session.endDialog();
        });
    }
]);
