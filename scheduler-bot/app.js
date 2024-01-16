var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
var schedule = require("node-schedule");

var rule = new schedule.RecurrenceRule();
// Run the task Mondays-Fridays
rule.dayOfWeek = [0, new schedule.Range(1, 5)];
rule.hour = 13;
// rule.minute = 08;
rule.second = 10;

// schedule.scheduleJob(rule, beginStatusDialog);

console.log('Schedule initialzed.');

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

var bot = new builder.UniversalBot(connector);
bot.set('storage', new builder.MemoryBotStorage());

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                schedule.scheduleJob(rule, function () {
                    bot.beginDialog(message.address, '/');
                })
            }
        });
    }
});

var logUserConversation = (event) => {
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
        builder.Prompts.text(session, "What is your name?");
    },
    function (session) {
        session.send('You said %s', session.message.text);
    }
]);
