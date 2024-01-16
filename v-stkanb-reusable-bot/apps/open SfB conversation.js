/* global address1 */
/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var azure = require("botbuilder-azure");
var timeout = require('botbuilder-timeout');
var address;
var user;

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
var userStore = [];
var bot = new builder.UniversalBot(connector, function(session) {
    // address = session.message.address;
    // user = Object.assign({}, session.message.address.conversation);
    // userStore.push(address);
});
bot.set('storage', tableStorage);

const logUserConversation = (event) => {
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

// Every 5 seconds, check for new registered users and start a new dialog
// setInterval(function () {
//     var newAddresses = userStore.splice(0);
//     newAddresses.forEach(function (address) {

//         console.log('Starting survey for address:', address);

//         // new conversation address, copy without conversationId
//         var newConversationAddress = Object.assign({}, address);
//         // console.log("user 2: " + user.id);
//         newConversationAddress.user = Object.assign({}, user);
//         savedAddress = Object.assign({}, newConversationAddress);
//         console.log('new convo address: ', newConversationAddress);

//         // start survey dialog
//         bot.beginDialog(newConversationAddress, '/start', null, function (err) {
//             if (err) {
//                 // error ocurred while starting new conversation. Channel not supported?
//                 bot.send(new builder.Message()
//                     .text('This channel does not support this operation: ' + err.message)
//                     .address(address));
//             }
//         });

//     });
// }, 5000);

const options = {
    PROMPT_IF_USER_IS_ACTIVE_MSG: "Hey are you there?",
    PROMPT_IF_USER_IS_ACTIVE_BUTTON_TEXT: "Yes I am",
    PROMPT_USER_IS_ACTIVE_RESPONSE: "Glad you are here",
    PROMPT_IF_USER_IS_ACTIVE_TIMEOUT_IN_MS: 6000,
    END_CONVERSATION_MSG: "Conversation Ended",
    END_CONVERSATION_TIMEOUT_IN_MS: 10000
};

timeout.setConversationTimeout(bot, options);

var savedAddress = {};

// Calls bot upon start up
bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                bot.beginDialog(message.address, '/main');
                savedAddress = message.address;
                user = Object.assign({}, message.address.conversation);
                console.log("user 1: " + user.id);
                console.log(message.address);
            }
        });
    }
});

server.post('/api/redirect',
    function (req, res, message, next) {
        res.send(200, {ok: 'ok'});
    }
);

server.get('/api/redirect', 
    function (req, res, next) {
        res.redirect('sip:helpdesk.im@microsoft.com', next);
        closeWindow();
        bot.beginDialog(savedAddress, '*:/survey');
        // res.send('triggered');
    }
);

function closeWindow() {
    close();
};

bot.dialog('/main', [
    function(session) {
        session.send("Hi. Welcome to Steve's Reusable Bot");
        builder.Prompts.confirm(session, "Shall we continue?");
    },
    function(session, results) {
        session.dialogData.continue = results.response;
        console.log(session.dialogData.continue);
        if (session.dialogData.continue == true) {
            session.beginDialog('/start');
        } else {
            session.send("We can try again later. Ending for now.");
            session.endConversation();
        }
    }
])

bot.dialog('/start', [
   function(session) {
       var card = {
           'contentType': 'application/vnd.microsoft.card.adaptive',
           'content': {
               '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
               'type': 'AdaptiveCard',
               'version': '1.0',
               'body': [
                    {
                        'type': 'Container',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'text': 'API Flow'                                
                            }
                        ]
                    }
               ],
               'actions': [
                   {
                       'type': 'Action.Submit',
                       'title': 'Follow flow',
                       'data': 'API flow'
                   }
               ]
           }
       };
       
       var msg = new builder.Message(session)
        .addAttachment(card);
       session.send(msg);
   }
]);



bot.dialog('/api', [
    function (session) {

        var card = new builder.HeroCard(session)
            .title('Call Dialog from API')
            .buttons([
                builder.CardAction.openUrl(session, "sip:helpdesk.im@microsoft.com", 'Open URL')
            ]);
        session.send(new builder.Message(session).addAttachment(card));
    }
]).triggerAction({
    matches: /API.*flow/i
});

bot.dialog('/survey', [
    function (session) {
      if (session.message.text === "done") {
        session.send("Great, back to the original conversation");
        session.endDialog();
      } else {
          session.userData.userChoice = builder.Prompts.choice(session,
            'Hello, I\'m the survey dialog. I\'m interrupting your conversation to ask you a question. Type "done" to resume\nHow is your experience today?',
            ["awesome", "good", "bad", "worst"],
            { listStyle: builder.ListStyle.button });
      }
    }
]);

bot.dialog('/response', [
    function (session) {
      session.userData.userChoice = 'tester';
      session.send("userChoice is: " + session.userData.userChoice);
      session.send("Thank you. Your response " + session.userData.userChoice + " has been recorded. Ending the conversation.");
      session.endConversation();
      user = Object.assign({}, session.message.address.conversation);
      // delete session.message.address;
    }   
]).triggerAction({
    matches: /awesome/i
});