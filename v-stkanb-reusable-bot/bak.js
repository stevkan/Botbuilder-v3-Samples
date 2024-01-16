/*-----------------------------------------------------------------------------
A simple Language Understanding (LUIS) bot for the Microsoft Bot Framework.
-----------------------------------------------------------------------------*/
require('dotenv').config();

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
var cognitiveservices = require('botbuilder-cognitiveservices');


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

// Create your bot with a function to receive messages from the user
// This default message handler is invoked if the user's utterance doesn't
// match any intents handled by other dialogs.
var bot = new builder.UniversalBot(connector);

bot.set('storage', new builder.MemoryBotStorage());

const logUserConversation = (event) => {
    console.log("Event", JSON.stringify(event, null, 4));
    // if (event.type == "message" && event.agent) {
    // }
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

// bot.on('conversationUpdate', function (message) {
//     if (message.membersAdded) {
//         message.membersAdded.forEach(function (identity) {
//             if (identity.id === message.address.bot.id) {
//                 bot.beginDialog(message.address, '/');
//             }
//         });
//     }
// });

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisSubscriptionKey = process.env.LuisSubscriptionKey
var luisAPIHostName = process.env.LuisAPIHostName // || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey;
// Create a recognizer that gets intents from LUIS, and add it to the bot
var luisRecognizer = new builder.LuisRecognizer(LuisModelUrl);


// Recognizer and and Dialog for GA QnAMaker service
var qnarecognizer = new cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: process.env.QnAKnowledgebaseId,
    authKey: process.env.QnAAuthKey, // || process.env.QnASubscriptionKey, // Backward compatibility with QnAMaker (Preview)
    endpointHostName: process.env.QnAEndpointHostName
});

var basicQnAMakerDialog = new cognitiveservices.QnAMakerDialog({
    recognizers: [qnarecognizer],
    defaultMessage: 'No match! Try changing the query terms!',
    qnaThreshold: 0.3
});

bot.recognizer(luisRecognizer);
console.log(luisRecognizer)
// bot.recognizer(basicQnAMakerDialog);

bot.dialog('/', basicQnAMakerDialog);


// Add a dialog for each intent that the LUIS app recognizes.
// See https://docs.microsoft.com/bot-framework/nodejs/bot-builder-nodejs-recognize-intent-luis
bot.dialog('GreetingDialog',[
    (session) => {
        session.send('You reached the Greeting intent. You said \'%s\'.', session.message.text);
        builder.Prompts.text(session, "What is your name?");
    },
    (session, results) => {
        session.userData.name = results.response;
        session.send("Glad you could make it, " + session.userData.name);

        builder.Prompts.text(session, "Ask me something!");
    },
    (session, results) => {
        session.conversationData.question = results.response;
        session.send(session.conversationData.question + " is an interesting topic!")
        session.endDialog();
    }
]).triggerAction({
    matches: 'Greeting'
})

// Read note dialog
// bot.dialog('Timesheet', [
//     function (session, args, next) {

//         // Resolve and store any Note.Title entity passed from LUIS.
//         var intent = args.intent;
//         console.log(session.message.text)
//         console.log("intent", intent)
//         console.log("intents: ", intent.entities[0].resolution)
//         console.log("intents: ", intent.entities[1].resolution)
//         var entity = builder.EntityRecognizer.findEntity(intent.entities, 'datetimeV2');

//         // Prompt for note name
//         next({ response: entity });
//     },
//     function (session, results) {
//         session.endDialog("Here's the '%s' note: '%s'.", results.response.entity, session.conversationData.timeRequest);
//     }
// ]).triggerAction({
//     matches: 'StartTimesheet'
// });

bot.dialog('WeatherDialog',
    (session, next) => {
        session.send('You reached the Weather intent. You said \'%s\'.', session.message.text);
        session.endDialog();
    }
).triggerAction({
    matches: 'Weather.GetForecast'
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
const bodyParser = require('body-parser');
const request = require('request');
const corsMiddleware = require('restify-cors-middleware');

const cors = corsMiddleware({
  origins: ['*']
});

// Create HTTP tokenServer.
let tokenServer = restify.createServer();
tokenServer.pre(cors.preflight);
tokenServer.use(cors.actual);
tokenServer.use(bodyParser.json({
  extended: false
}));
tokenServer.dl_name = 'DirectLine';
tokenServer.listen(process.env.port || process.env.PORT || 3500, function() {
  console.log(`\n${ tokenServer.dl_name } listening to ${ tokenServer.url }.`);
});

// Listen for incoming requests.
tokenServer.post('/directline/token', (req, res) => {
  // userId must start with `dl_`
  const userId = (req.body && req.body.id) ? req.body.id : `dl_${ Date.now() + Math.random().toString(36) }`;
  const options = {
    method: 'POST',
    uri: 'https://directline.botframework.com/v3/directline/tokens/generate',
    headers: {
      'Authorization': `Bearer ${ process.env.directLineSecret }`
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
      res.status(500);
      res.send('Call to retrieve token from DirectLine failed');
    }
  });
});
