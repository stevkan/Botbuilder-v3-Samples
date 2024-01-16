var restify = require('restify');
var builder = require('botbuilder');

var connector = new builder.ChatConnector();
var bot = new builder.UniversalBot(
    connector,
    [
        (session) => {
            session.send('Hello bots!');
        }
    ]
)
    .set('storage', new builder.MemoryBotStorage());

var server = restify.createServer();
server.post('/api/messages', connector.listen());
server.listen(
    process.env.PORT || 3978,
    () => console.log('Server up!!')
);