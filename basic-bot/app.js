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
    .set('storage', new builder.MemoryBotStorage()); // Register in-memory storage

var count = 0;

// async function logConversationData(event, turnData, next) {
//     if (!turnData) {
//         console.log("error: no turnData object");
//         await next();
//         return;
//     }

//     if (event.type === "conversationUpdate") {
//         await next();
//         return;
//     }

//     if (!turnData.text) {
//         await next();
//         return;
//     }

//     if (event.type === "message") {
//         count++;
//         turnData.date_time = new Date();
//         turnData.count = count;

//         console.log(count + ': ', turnData);

//         bot.loadSession(event.address, function (error, session) {
//             var conversationId = event.address.conversation.id;

//             if (!session.userData.conversations) {
//                 session.userData.conversations = {};
//             }

//             if (!(conversationId in session.userData.conversations)) {
//                 session.userData.conversations[conversationId] = [];
//             }

//             session.userData.conversations[conversationId].push(turnData);
//             session.save();
//             next();
//         });
//     }

// }

// // Middleware for logging
// bot.use({
//     receive: function (event, next) {
//         var turn_data = {
//             speaker: "user",
//             text: event.text
//         };

//         logConversationData(event, turn_data, next);
//     },
//     send: function (event, next) {
//         var turn_data = {
//             speaker: "bot",
//             text: event.text
//         };

//         logConversationData(event, turn_data, next);
//     }
// });

let logger = {
    info: function (data) {
        // console.log(data)
    }
}

bot.use({
    botbuilder(session, next) {
        logger.info("MESSAGE RECEIVED:" + session.message.text);
        next();
    },
    send(event, next) {
        let address = event.address;
        bot.loadSession(address, function (err, session) {
            if (err) {
                console.log(err);
            };
            // console.log(session);
            logger.info("MESSAGE SENT: " + event.text);
            logger.info("CONVERSATION DATA: " + session.conversationData.response);
            logger.info("USER DATA: " + session.userData);
            logger.info("DIALOG DATA: " + session.dialogData);
        });
        next();
    }
});

// ----greetings.js -----
bot.dialog('/main', [
    function (session, args, next) {
        session.send("Glad you could join.");
        session.beginDialog('/next');
    }
]);

bot.dialog('/next', [
    function (session, args, next) {
        builder.Prompts.choice(session, "Do you want to raise a ticket for this problem?", "Yes|No",
            {
                maxRetries: 3,
                retryPrompt: 'Sorry, that is not a valid input',
                listStyle: builder.ListStyle.button
            }
        );
    },
    function (session, results, next) {
        // console.log("session: ", session)
        session.conversationData.response = results.response.entity;
        if (session.conversationData.response == "Yes") {
            session.beginDialog('/hello');
        } else {
            session.beginDialog('/goodbye');
        }
    }
]);

bot.dialog("/hello", [
    function (session, result, next) {
        session.send("Let's start over");
        session.replaceDialog("/main");
    }
]);

// ----common.misc.js -----
bot.dialog("/goodbye",
    function (session, result, next) {
        session.send("Ending conversation");
        session.endConversation();
    }
);


/**
 * Creates token server
 */
const bodyParser = require('body-parser');
const request = require('request');
const corsMiddleware = require('restify-cors-middleware');

const cors = corsMiddleware({
    origins: ['*']
});
// Create HTTP server.
let dl_server = restify.createServer();
dl_server.pre(cors.preflight);
dl_server.use(cors.actual);
dl_server.use(bodyParser.json({
    extended: false
}));
dl_server.dl_name = 'DirectLine';
dl_server.listen(process.env.port || process.env.PORT || 3500, function () {
    console.log(`\n${dl_server.dl_name} listening to ${dl_server.url}.`);
});
// Listen for incoming requests.
dl_server.post('/directline/token', (req, res) => {
    // userId must start with `dl_`
    const userId = (req.body && req.body.id) ? req.body.id : `dl_${Date.now() + Math.random().toString(36)}`;
    const options = {
        method: 'POST',
        uri: 'https://directline.botframework.com/v3/directline/tokens/generate',
        headers: {
            'Authorization': `Bearer ${process.env.directLineSecret}`
        },
        json: {
            User: {
                Id: userId
            }
        }
    };
    request.post(options, (error, response, body) => {
        if (!error && response.statusCode < 300) {
            res.send({
                token: body.token
            });
        } else {
            res.status(500).send('Call to retrieve token from DirectLine failed');
        }
    });
});
