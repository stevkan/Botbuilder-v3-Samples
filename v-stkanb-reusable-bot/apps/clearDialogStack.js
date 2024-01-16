/* global address1 */
/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var azure = require("botbuilder-azure");

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
var azureTableClient = new azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new azure.AzureBotStorage({ gzipData: false }, azureTableClient);

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
        builder.Prompts.text(session, 'Hi there! What can I do for you today?');
    },
    function (session, results) {
        session.endConversation('Goodbye!');
    }
])
.beginDialogAction('sportAction', 'Sports', {
    matches: /^sports$/i,
})
.beginDialogAction('cookingAction', 'Cooking', {
    matches: /^cooking$/i,
    onSelectAction: function (session, args, next) {
        session.clearDialogStack();
        next();
    }
});

bot.dialog('Sports', [
    function (session) {
        session.send('Sports here');
        builder.Prompts.text(session, "Tell me your favorite sport?");
    },
    function (session, results) {
        session.send("You said: ", results.response);
        builder.Prompts.choice(session, "Is this right?", "Yes|No");
    },
    function (session, results) {
        session.endDialog("You said: ", results.response);
    }
]);

bot.dialog('Cooking', [
    function (session, results) {
        session.send('Cooking here');
        builder.Prompts.text(session, "Tell me your favorite food?");
    },
    function (session, results) {
        session.dialogData.food = results.response;
        session.send('You also said: ' + session.dialogData.food);
        builder.Prompts.choice(session, "Is this right?", "Yes|No");
    },
    function (session, results) {
        session.send("You said: %s", results.response.entity);
        session.replaceDialog('/');
    }
]);