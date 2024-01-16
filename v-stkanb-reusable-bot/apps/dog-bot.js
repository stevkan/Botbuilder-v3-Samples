/*-----------------------------------------------------------------------------
A simple Language Understanding (LUIS) bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

const restify = require('restify');
const builder = require('botbuilder'); 
const cognitiveservices = require('botbuilder-cognitiveservices');
const botbuilder_azure = require("botbuilder-azure");

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    // openIdMetadata: process.env.BotOpenIdMetadata 
});

var bot = new builder.UniversalBot(connector);
bot.set('storage', new builder.MemoryBotStorage());

server.post('/api/messages', connector.listen());

// LUIS
// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey;

// Create a recognizer that gets intents from LUIS, and add it to the bot
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
bot.recognizer(recognizer);

// QnA
// Create recognizer that gets responses from QnA, and add it to the bot
var recognizer = new cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: process.env.QnAKnowledgebaseId,
    authKey: process.env.QnAAuthKey || process.env.QnASubscriptionKey, // Backward compatibility with QnAMaker (Preview)
    endpointHostName: process.env.QnAEndpointHostName
});

const basicQnAMakerDialog = new cognitiveservices.QnAMakerDialog({
    recognizers: [recognizer],
    defaultMessage: 'No match on QnA!',
    qnaThreshold: 0.3
});

// Calls bot upon start up
bot.on('conversationUpdate', 
(message, session) => {
    if (message.membersAdded) {
        message.membersAdded.forEach(
            (identity) => {
            if (identity.id === message.address.bot.id) {
                bot.beginDialog(message.address, '/');
            }
        });
    }
});


bot.dialog('basicQnAMakerDialog', basicQnAMakerDialog);

let check = null;
bot.dialog('/',
    (session) => {
        if (check == null || check == "" ||check == false) {
            var welcomeCard = new builder.HeroCard(session)
            .title("I'm a dog!")
            .images([
                new builder.CardImage(session)
                .url('https://78.media.tumblr.com/791ab40ab2f16ca69e818e8c37db3d22/tumblr_mwvw2pipTS1suyqwko1_500.gif')
                .alt("I'm a dog!")
            ])

            session.send(new builder.Message(session).addAttachment(welcomeCard));
            // session.send('Woof!');

            var qnaKnowledgebaseId = process.env.QnAKnowledgebaseId;
            var qnaSubscriptionKey = process.env.QnASubscriptionKey;
            
            // QnA Subscription Key and KnowledgeBase Id null verification
            if((qnaSubscriptionKey == null || qnaSubscriptionKey == '') || (qnaKnowledgebaseId == null || qnaKnowledgebaseId == ''))
                session.send('Please set QnAKnowledgebaseId and QnASubscriptionKey in App Settings. Get them at https://qnamaker.ai.');
            else
                session.replaceDialog('basicQnAMakerDialog');
                check = true;
        }
        else if (check == true) {
            var qnaKnowledgebaseId = process.env.QnAKnowledgebaseId;
            var qnaSubscriptionKey = process.env.QnASubscriptionKey;
            
            // QnA Subscription Key and KnowledgeBase Id null verification
            if((qnaSubscriptionKey == null || qnaSubscriptionKey == '') || (qnaKnowledgebaseId == null || qnaKnowledgebaseId == ''))
                session.send('Please set QnAKnowledgebaseId and QnASubscriptionKey in App Settings. Get them at https://qnamaker.ai.');
            else
                session.replaceDialog('basicQnAMakerDialog');
                check = true;
        }
    }
);

bot.dialog('WoofDialog',
(session) => {
        session.send("Good human! You just learned to speak dog! I heard you say \'%s\' which to me is 'Hi!'.", session.message.text);
        session.endDialog();
    }
).triggerAction({
    matches: 'Wag'
})

bot.dialog('AngryDialog',
(session) => {
        session.send("Now you're just being rude... Don't make me come after you!");
        session.endDialog();
    }
).triggerAction({
    matches: 'Angry'
})

bot.dialog('GreetingDialog',
    (session) => {
        let bCount = 0;
        while(bCount == 0) {
            session.send(barking(0));
            bCount++;
        }
        session.send("(Maybe you need some 'help'.)");
        session.endDialog();
    }
).triggerAction({
    matches: 'Greeting'
})

bot.dialog('CancelDialog',
    (session) => {
        session.send("You can leave, but I'll keep barking...just so you know.");
        let bCount = 0;
        while(bCount <= 3) {
            session.send(barking(0));
            bCount++;
        }
        session.endDialog();
        check = false;
    }
).triggerAction({
    matches: 'Cancel'
})

bot.dialog('HelpDialog',
    (session) => {
        session.send('Say something a dog might say. A good place to start is "woof".');
        session.endDialog;
    }
).triggerAction({
    matches: /Help/i,
    matches: /help/i
})

// Provides random barking
function barking(count, barkText) {
    let barks = Array('bark', 'bark...bark', 'bark...bark...bark')
    for (var i = 0; i <= count; i++) {
        barkText = barks[Math.floor(Math.random()*barks.length)];
    }
    return (barkText);    
};