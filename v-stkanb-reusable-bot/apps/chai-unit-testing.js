/* global address1 */
/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var azure = require("botbuilder-azure");
var chai = require("chai");

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
var azureTableClient = new azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
bot.set('storage', tableStorage);

const logUserConversation = (event) => {
    console.log('message: ' + event.text + ', user: ' + event.address.user.name);
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

// Calls bot upon start up
// bot.on('send', (message) => {
//     console.log(message);
//     chai.expect(message.text).to.satisfy(function(text) {
//         if (text === message1 || text === message2 ) {
//             return true;
//         }
//         else {
//             return false;
//         }
//     });
// });

// done();

// Calls bot upon start up
// bot.on('conversationUpdate', function (message) {
//     if (message.membersAdded) {
//         message.membersAdded.forEach(function (identity) {
//             if (identity.id === message.address.bot.id) {
//                 bot.beginDialog(message.address, '/');
//             }
//         });
//     }
// });

bot.dialog('/', [
    function (session) {
        var welcomeCard = new builder.HeroCard(session)
            .title('How can I help you?')
            .images([
                new builder.CardImage(session)
                    .url('https://www.miataturbo.net/attachments/insert-bs-here-4/78009d1370019848-random-pictures-thread-only-rule-keep-sfw-1682345-slide-slide-1-biz-stone-explains-how-he-turned-91-random-photos-into-movie-jpg')
                    .alt('Mocha')
            ])
            .buttons([
                builder.CardAction.imBack(session, "order coffee", "Order a Coffee")
            ]);
        session.send(new builder.Message(session).addAttachment(welcomeCard));
    }
]);