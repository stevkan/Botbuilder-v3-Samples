var restify = require('restify');
var builder = require('botbuilder');
var azure = require("botbuilder-azure");
var timeout = require('botbuilder-timeout');

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
bot.set('storage', new builder.MemoryBotStorage());

const options = {
    PROMPT_IF_USER_IS_ACTIVE_MSG: "Hey are you there?",
    PROMPT_IF_USER_IS_ACTIVE_TIMEOUT_IN_MS: 6000,
    END_CONVERSATION_MSG: "Conversation Ended",
    END_CONVERSATION_TIMEOUT_IN_MS: 10000
};

timeout.setConversationTimeout(bot, options);

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
    (session, args, next) => {
        builder.Prompts.text(session, `What's your name?`);
        
    },
    (session, args, next) => {
        session.send(`Hi ${session.message.text}`);
    }]
);