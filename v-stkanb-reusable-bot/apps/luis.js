require('dotenv').config();

var restify = require('restify');
var builder = require('botbuilder');

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

var bot = new builder.UniversalBot(connector, function (session, args) {
    session.send('You reached the default message handler. You said \'%s\'.', session.message.text);
});

bot.set('storage', new builder.MemoryBotStorage());

const logUserConversation = (event) => {
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

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName;

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey;
// Create a recognizer that gets intents from LUIS, and add it to the bot
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
bot.recognizer(recognizer);

bot.dialog('GreetingDialog',
    (session) => {
        session.send('You reached the Greeting intent. You said \'%s\'.', session.message.text);
        session.endDialog();
    }
).triggerAction({
    matches: 'Greeting'
})

bot.dialog('HelpDialog',
    (session) => {
        session.send('You reached the Help intent. You said \'%s\'.', session.message.text);
        session.endDialog();
    }
).triggerAction({
    matches: 'Help'
})

bot.dialog('CancelDialog',
    (session) => {
        session.send('You reached the Cancel intent. You said \'%s\'.', session.message.text);
        session.endDialog();
    }
).triggerAction({
    matches: 'Cancel'
})

/**
 * Creates token server
 */
const generateDirectLineToken = require('./scripts/generateDirectLineToken');
const renewDirectLineToken = require('./scripts/renewDirectLineToken');
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
