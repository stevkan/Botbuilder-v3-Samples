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

server.post('/api/redirect', function (req, res, next) {
    res.send(200, {ok: 'ok'});
});

server.get('/api/redirect', function (req, res, next) {
    bot.beginDialog("*:/survey");
    // res.send('triggered');
    next();
});

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

        var card = new builder.HeroCard(session)
            .title('Call Dialog from API')
            .buttons([
                builder.CardAction.openUrl(session, "https://v-stkanb-reusable-bot.azurewebsites.net/api/redirect", 'Open URL')
            ]);
        session.send(new builder.Message(session).addAttachment(card));
    }
]);

bot.dialog('/survey', [
    function (session, args, next) {
      if (session.message.text === "done") {
        session.send("Great, back to the original conversation");
        session.endDialog();
      } else {
          builder.Prompts.choice(session,
            'Hello, I\'m the survey dialog. I\'m interrupting your conversation to ask you a question. Type "done" to resume\nHow is your experience today?',
            ["awesome", "good", "bad", "worst"],
            { listStyle: builder.ListStyle.button });
      }
    },
  function (session, results) {
      session.send("Thank you. Your response " + results.response + " has been recorded. Have a great conversation.");
      session.endDialog();
  }
]);