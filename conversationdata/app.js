/*-----------------------------------------------------------------------------
A simple OAuthCard bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var azure = require('botbuilder-azure');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Bot Storage: Here we register the state storage for your bot. 
// Default store: volatile in-memory store - Only for prototyping!
// We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
// For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
var documentDbOptions = {
    host: 'https://v-stkanb-cosmosdb.documents.azure.com:443/',
    masterKey: 'AAV5Aib3NsdG8qO3qEuPBEVJewG5ccBBV3BhJqbqreFb0StAw0brCO7bgeWbp14U09Kr56peD2votJFKTCrfJw==',
    database: 'botdb',
    collection: 'botdata'
};
var docDbClient = new azure.DocumentDbClient(documentDbOptions, {
    masterKey: documentDbOptions.masterKey
});
var cosmosStorage = new azure.AzureBotStorage({ gzipData: false }, docDbClient);

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    // appId: process.env.MicrosoftAppId,
    // appPassword: process.env.MicrosoftAppPassword
    appId: "03113ae6-4141-4adc-b3b6-6a38910b8aa0",
    appPassword: "$Qn$=&zd.3YmDL5l"
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Creates bot using Cosmos for saving state data
var bot = new builder.UniversalBot(connector).set('storage', cosmosStorage);

bot.dialog('/', [
    session => {
        session.conversationData = {
            sessionId: session.message.address.conversation.id,
            beginTime: (new Date()).toISOString()
        }
        builder.Prompts.text(session, 'feedback')
    },
    (session, arg) => {
        session.conversationData.feedback = arg.response;
        session.endDialog('feedback-received');
        session.beginDialog('next');
    }
])
bot.dialog('next', [
    (session) => {
        builder.Prompts.confirm(session, "End the conversation?");
    },
    (session, arg) => {
        var response = arg.response;
        if (response == false) {
            session.endDialog('newfeedback-received');
        } else if (response == true) {
            session.endDialog();
            session.endConversation('Completed');
        }
    }
]);
