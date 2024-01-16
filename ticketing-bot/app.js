var restify = require("restify");
var builder = require("botbuilder");
var request = require("request");
var playerPurchaseToken;

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 7000, function () {
    console.log("%s listening to %s", server.name, server.url);
});

function sendData(url, payload, method, cb) {
    console.log(url);
    request(
        {
            url: url,
            method: method,
            json: payload
        },
        function (error, response, body) {
            if (error || response.statusCode !== 200) {
                return cb(error || { statusCode: response.statusCode });
            }
            // cb(null, JSON.parse(JSON.stringify(body)));
            cb(null, body);
            // if (!error && response.statusCode == 200) {
            console.log(body);
            //     let d = JSON.stringify(body['headers']['Host']);
            //     //console.log(d);
            //     return d;
        }
    );
}
function sendDataWithHeaders(url, payload, method, cb) {
    console.log(url);
    request(
        {
            url: url,
            method: method,
            headers: {
                username: "xxxxxxxxxxx",
                password: "xxxxxx",
                "Content-Type": "application/json"
            },
            json: payload
        },
        function (error, response, body) {
            if (error || response.statusCode !== 200) {
                return cb(error || { statusCode: response.statusCode });
            }
            // cb(null, JSON.parse(JSON.stringify(body)));
            console.log("sendDataWithHeaders");
            console.log(typeof body);
            console.log("raw body", body);
            cb(null, body);
        }
    );
}

function login(creden) {
    sendDataWithHeaders(
        "http://ip-address/xxxxxxxx",
        creden,
        "POST",
        function (err, body) {
            console.log(body);
            console.log("playerLoginplayerToken", body["playerToken"]);
            playerPurchaseToken = body["playerToken"];
            return playerPurchaseToken;
        }
    );
}

function ticket_purchase(purchase_payload) {
    sendDataWithHeaders(
        "http://ip-address:8081/xxxxxxxxxxxxxxxxxx/xx",
        purchase_payload,
        "POST",
        function (err, body) {
            console.log("Purchase ticket resp body", body);
            return body;
        }
    );
}

// chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: "",
    appPassword: ""
});
// Listen for messages from users
server.post("/api/messages", connector.listen());
// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')

var inMemoryStorage = new builder.MemoryBotStorage();

var bot = new builder.UniversalBot(connector, function (session) {
    session.sendTyping();
    setTimeout(function () {
        console.log(session.message.text);
        var jsonPayload = { query: session.message.text };
        console.log("jsonPayLoad", typeof jsonPayload);
        var creden = {
            userName: "xxxxxxxxxx",
            password: "xxxxxxxxxxxxxxxx",
            userAgent:
                "Mozilla/5.0 (Linux; Android 6.0; Google Nexus 7 2013 - 6.0.0 - API 23 - 1200x1920 Build/MRA58K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/44.0.2403.119 Safari/537.36",
            requestIp: "192.xxx.xx.xxx",
            loginToken: "xxxxxxxxxx",
            imeiNo: "000000000000000",
            domainName: "ussd.xxxxxxxx.co",
            deviceType: "PC",
            deviceId:
                "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
            currAppVer: "2.1.7",
            appType: "ANDROID_APP_CASH"
        };


        // console.log(typeof session.message.text);
        sendData(
            "http://localhost:8000/conversations/default/respond",
            jsonPayload,
            "POST",
            function (err, body) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("raw body", body);
                    console.log("Hello, I am not trained to do that.", body[0]["text"]);
                    session.send(body[0]["text"]);
                    // js_traverse();
                }
            }
        );

        sendData(
            "http://localhost:8000/conversations/default/parse",
            jsonPayload,
            "POST",
            function (err, body) {
                var actionT = body["tracker"]["latest_message"]["intent"]["name"];
                if (actionT == "inform") {
                    // purchase
                    // Login the user to get 'playerToken'

                    var purchaseToken = login(creden);
                    console.log("purchase_payload", purchaseToken);

                    var purchase_payload = {
                        merchantCode: "xxxx",

                        gameCode: "xxxxxxxxxx",
                        isAdvancePlay: false,

                        aliasName: "ussd.xxxxxxxxxxxxx.co",
                        drawData: [{ drawId: "1169" }],
                        sessionId: purchaseToken,
                        deviceCheck: false,
                        macAddress: "123::xxxx",
                        panelData: [
                            {
                                type: "Direct6",
                                no: 6,
                                AmtMul: 1,
                                pickedNumbers: "QP",
                                isQP: true
                            }
                        ],
                        totalPurchaseAmt: "0.50"
                    };

                    var ticketData = ticket_purchase(purchase_payload);

                    // console.log("playerToken1", playerPurchaseToken);
                    console.log("purchase_payload2", ticketData);
                    session.send("wait.!");
                }
            }
        );
    }, 3000);
})
    .set('storage', inMemoryStorage); // Register in memory storage
