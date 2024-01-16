/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework.
-----------------------------------------------------------------------------*/

require('dotenv').config();

var restify = require('restify');
var builder = require('botbuilder');
var azure = require("botbuilder-azure");
var uuid = require("uuid");

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
// var inMemoryStorage = new builder.MemoryBotStorage();

var documentDbOptions = {
    host: process.env.CosmosHost,
    masterKey: process.env.CosmosMasterKey,
    database: process.env.CosmosDatabase,
    collection: process.env.CosmosCollection
};
var docDbClient = new azure.DocumentDbClient(documentDbOptions, {
    masterKey: documentDbOptions.masterKey
});
var cosmosStorage = new azure.AzureBotStorage({ gzipData: false }, docDbClient);

var sessionAddress;

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector, function (session) {
    session.send('Welcome');
    session.beginDialog('/main');
    sessionAddress = session.message.address;
})
    .set('storage', cosmosStorage); // Register in-memory storage

bot.on('event', (event, session) => {
    // bot.loadSession(event.address, (session) => {
    var conversationId = event.address.conversation.id;

    if (!session.userData.conversations) {
        session.userData.conversations = {};
    }

    if (!(conversationId in session.userData.conversations)) {
        session.userData.conversations[conversationId] = [];
    }

    session.userData.conversations[conversationId].push("event");
    session.save();
    next();
    // });
});

const logUserConversation = (event, msg) => {
    console.log('message: ' + event.text + ', user: ' + event.address.user.name);
    // console.log(event);
    // console.log(msg);
};

// Middleware for logging
bot.use({
    receive: function (event, session, next) {
        console.log("Received from user:");

        // var sessionAddress = event.address;
        var msg = new builder.Message().address(sessionAddress);
        msg.data.type = "event";
        msg.data.name = event.address.user.name;
        msg.data.value = event.text;
        console.log(session.message.address);
        logUserConversation(event, msg);

        next();
        return;
    },
    send: function (event, session, next) {
        console.log("Sent by bot:");

        // var sessionAddress = event.address;
        var msg = new builder.Message().address(sessionAddress);
        msg.data.type = "event";
        msg.data.name = event.address.user.name;
        msg.data.value = event.text;
        console.log(session.message.address);
        logUserConversation(event, msg);

        next();
        return;
    }
});

// ----greetings.js -----
bot.dialog('/main', [
    function (session, args, next) {
        session.send("Glad you could join.");
        session.send(msg);
        next();
        session.beginDialog('/next');
    }
]);

bot.dialog('/next', [
    function (session, args, next) {
        builder.Prompts.text(session, "Continue?");
        next();
    },
    function (session, results, next) {
        if (results.response == "Yes") {
            session.beginDialog('/hello');
        }
        next();
    }
]);

bot.dialog("/hello", [
    function (session, result, next) {
        session.send("hello");
        next();
    },
    function (session) {
        session.replaceDialog("/how_can_i_help");
        next();
    }
]);

// ----common.misc.js -----
bot.dialog("/how_can_i_help",
    function (session, result, next) {
        session.endConversation("how can I help?");
        next();
    }
);

var msg = new builder.Message(sessionAddress)
    .address(sessionAddress)
    .textFormat(builder.TextFormat.xml)
    .attachmentLayout(builder.AttachmentLayout.carousel)
    .attachments([
        new builder.HeroCard()
            .text("1")
            .images([builder.CardImage.create(null, 'http://www.nurturedinnorfolk.co.uk/image/cache/data/Mizuna%20Green-600x400w.jpg')]),
        new builder.HeroCard()
            .title("2")
            .images([builder.CardImage.create(null, 'https://cdn.zmescience.com/wp-content/uploads/2015/02/blue-600x400.jpg')]),
        new builder.HeroCard()
            .title("3")
            .images([builder.CardImage.create(null, 'http://www.journaldugeek.com/files/2014/07/PowerShot-SX400-IS-RED-FSL-600x400.jpg')]),
    ]);
// bot.send(msg)
