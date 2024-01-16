/*-----------------------------------------------------------------------------
A simple OAuthCard bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Bot Storage: Here we register the state storage for your bot. 
// Default store: volatile in-memory store - Only for prototyping!
// We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
// For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
var inMemoryStorage = new builder.MemoryBotStorage();

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
    // appId: "03113ae6-4141-4adc-b3b6-6a38910b8aa0",
    // appPassword: "$Qn$=&zd.3YmDL5l"
});

var connectionName = "oauthconnection";
// var connectionName = "ms-appx-web:///assets/errorpages/navcancl.htm%23https://token.botframework.com/api/oauth/PostTestConnectionCallback?state=ew0KICAiY29ubmVjdGlvbk5hbWUiOiAib2F1dGhjb25uZWN0aW9uIiwNCiAgImNvbnZlcnNhdGlvbiI6IHsNCiAgICAiYm90Ijogew0KICAgICAgIm5hbWUiOiAidi1zdGthbmItb2F1dGgtY2FyZCINCiAgICB9DQogIH0NCn0%3d&userId=2213615e-cf2c-b204-b038-0bc948df9e44&code=d8d95ce690e447cdb77f7c3bc01e1f45";

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector, function (session) {
    if (session.message.text == 'signout') {
        // It is important to have a SignOut intent
        connector.signOutUser(session.message.address, connectionName, (err, result) => {
            if (!err) {
                session.send('You are signed out.');
            } else {
                session.send('There was a problem signing you out.');
            }
        });
    } else {
        // First check whether the Azure Bot Service already has a token for this user
        connector.getUserToken(session.message.address, connectionName, undefined, (err, result) => {
            if (result) {
                // If there is already a token, the bot can use it directly
                session.send('You are already signed in with token: ' + result.token);
            } else {
                // If there not is already a token, the bot can send an OAuthCard to have the user log in
                if (!session.userData.activeSignIn) {
                    session.send("Hello! Let's get you signed in!");
                    builder.OAuthCard.create(connector, session, connectionName, "Please sign in", "Sign in", (createSignInErr, signInMessage) => {
                        if (signInMessage) {
                            session.send(signInMessage);
                            session.userData.activeSignIn = true;
                        } else {
                            session.send("Something went wrong trying to sign you in.");
                        }
                    });
                } else {
                    // Some clients require a 6 digit code validation so we can check that here
                    session.send("Let's see if that code works...");
                    connector.getUserToken(session.message.address, connectionName, session.message.text, (err2, tokenResponse) => {
                        if (tokenResponse) {
                            console.log(tokenResponse);
                            session.send('It worked! You are now signed in with token: ' + tokenResponse.token);
                            session.userData.activeSignIn = false;
                        } else {
                            session.send("Hmm, that code wasn't right");
                        }
                    });
                }
            }
        });
    }
})
    .set('storage', inMemoryStorage) // Register in memory storage
    .on("event", (event) => {         // Handle 'event' activities
        if (event.name == 'tokens/response') {
            // received a TokenResponse, which is how the Azure Bot Service responds with the user token after an OAuthCard
            bot.loadSession(event.address, (err, session) => {
                let tokenResponse = event.value;
                session.send('1: You are now signed in with token: ' + tokenResponse);
                session.userData.activeSignIn = false;
            });
        }
    });

connector.onInvoke((event, cb) => {
    if (event.name == 'signin/verifyState') {
        // received a MS Team's code verification Invoke Activity
        bot.loadSession(event.address, (err, session) => {
            let verificationCode = event.value.state;
            // Get the user token using the verification code sent by MS Teams
            connector.getUserToken(session.message.address, connectionName, verificationCode, (err, result) => {
                session.send('2: You are now signed in with token: ' + result.token);
                session.userData.activeSignIn = false;
                cb(undefined, {}, 200);
            });
        });
    } else {
        cb(undefined, {}, 200);
    }
});