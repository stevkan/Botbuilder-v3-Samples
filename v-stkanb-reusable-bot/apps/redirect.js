var rerestify = require('restify');
var builder = require('botbuilder');

module.exports = function redirect(session, t) {
    var server = rerestify.createServer();

    var connector = new builder.ChatConnector({
        appId: "b55ae686-29ab-430c-8b3b-5effc3005241",
        appPassword: "H^*HEMM)I#ik(}_5",
        openIdMetadata: ""
    });

    server.post('/api/messages', connector.listen());

    server.get('mainDialog', function (req, res, next) {
        res.redirect('http://www.bing.com', next);
    });


    // CLIENT.get(join(LOCALHOST, '/'), function (err, _, res) {
    //     t.ifError(err);
    //     t.equal(res.statusCode, 302);
    //     t.equal(res.headers.location, '/');
    //     t.end();
    // });
};