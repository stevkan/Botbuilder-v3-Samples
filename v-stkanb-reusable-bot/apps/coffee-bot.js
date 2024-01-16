/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/
var restify = require('restify');
var builder = require('botbuilder');
var azure = require("botbuilder-azure");
var builder_cognitiveservices = require('botbuilder-cognitiveservices');


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
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

/* Legacy table storage connection credentials to be removed at later point */
// var tableName = 'botdata';
// var azureTableClient = new azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
// var tableStorage = new azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Cosmos Db connection credentials
var documentDbOptions = {
    host: 'https://coffeebotdb.documents.azure.com:443/',
    masterKey: 'IDPtb9HYXLKyz76rFmdQo8SyAJ7zzFHEUM61LknY70tDTXAMdsGcnAzz0qFe7PnAAXRU4CzeMunEqdMDHUKsjw==',
    database: 'botdb',
    collection: 'botdata'
};
var docDbClient = new azure.DocumentDbClient(documentDbOptions, {
    masterKey: documentDbOptions.masterKey
});
var cosmosStorage = new azure.AzureBotStorage({ gzipData: false }, docDbClient);

// Creates bot using Cosmos for saving state data
var bot = new builder.UniversalBot(connector).set('storage', cosmosStorage);

// Calls bot upon start up
bot.on('conversationUpdate', function(message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function(identity) {
            if (identity.id === message.address.bot.id) {
                bot.beginDialog(message.address, '/');
            }
        });
    }
});

const logUserConversation = (event) => {
    console.log('message: ' + event.text + ', user: ' + event.address.user.name);
    console.log("Event", JSON.stringify(event, null, 4));
};

// Middleware for logging
bot.use({
    receive: function(event, next) {
        console.log("Received from user:");
        logUserConversation(event);
        next();
    },
    send: function(event, next) {
        console.log("Sent by bot:");
        logUserConversation(event);
        next();
    }
});

// Loads the bots opening message and graphic
bot.dialog('/', [
    function(session) {
        var welcomeCard = new builder.HeroCard(session)
            .title('How can I help you?')
            .images([
                new builder.CardImage(session)
                .url('https://2.bp.blogspot.com/-I0rdxZj_dwk/UFZQs22fSBI/AAAAAAAAAKw/byN1OWiehWI/s1600/ToffeeMocha.JPG')
                .alt('Mocha')
            ])
            .buttons([
                builder.CardAction.imBack(session, "order coffee", "Order a Coffee")
            ]);
        session.send(new builder.Message(session).addAttachment(welcomeCard));
    }
])

// Dialog for ordering coffee(s) and special actions
bot.dialog('orderCoffee', [
        function(session, args) {
            if (!args.continueOrder) {
                session.userData.cart = [];
            }
            session.send("At anytime you can say 'cancel order', 'view cart', or 'checkout'.");
            builder.Prompts.choice(session, "What coffee would you like to order?", "Drip|Espresso|Mocha", { listStyle: builder.ListStyle.button });
        },
        function(session, results) {
            session.dialogData.coffeeType = results.response.entity;
            session.beginDialog('order' + session.dialogData.coffeeType.toString());
        },
        function(session, results) {
            if (results.response) {
                session.userData.cart.push(results.response);
            }
            session.replaceDialog('orderCoffee', { continueOrder: true });
        }
    ]).triggerAction({
        matches: /order.*coffee/i,
        confirmPrompt: "This will cancel the current order. Are you sure?"
    })
    .cancelAction('cancelOrderAction', "Order canceled.", {
        matches: /(cancel.*order|^cancel)/i,
        confirmPrompt: "Are you sure?"
    })
    .beginDialogAction('viewCartAction', 'viewCartDialog', {
        matches: /view.*cart/i
    })
    .beginDialogAction('checkoutAction', 'checkoutDialog', {
        matches: /checkout/i,
        matches: /check.*out/i
    });

// Dialog for ordering drop coffee
bot.dialog('orderDrip', [
    function(session) {
        session.dialogData.coffeeType = 'drip';
        session.send("Drip coffees only come in two sizes.")
        builder.Prompts.choice(session, "Which size would you like?", "12 oz.|16 oz.", { listStyle: builder.ListStyle.button });
    },
    function(session, results) {
        session.dialogData.coffeeSize = results.response.entity;
        builder.Prompts.text(session, "What is your name? I'd like to add it to your order.")
    },
    function(session, results) {
        session.dialogData.customerName = results.response.charAt(0).toUpperCase() + results.response.slice(1).toLowerCase();
        var uuid = (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
        var item = {
            order: session.dialogData.coffeeSize + ' ' + session.dialogData.coffeeType + ' coffee',
            coffee: session.dialogData.coffeeType,
            size: Number(session.dialogData.coffeeSize.substr(0, 2)),
            flavor: null,
            shots: null,
            name: session.dialogData.customerName,
            guid: uuid
        };
        session.send('\n* %s added for %s', item.order, item.name);
        session.endDialogWithResult({ response: item });
    }
]).cancelAction('cancelItemAction', "Item canceled.", {
    matches: /(cancel.*item|^cancel)/i
});

// Dialog for ordering espress coffee
var shotsArray = {};
bot.dialog('orderEspresso', [
    function(session) {
        session.dialogData.coffeeType = 'espresso';
        builder.Prompts.choice(session, "What size?", "12 oz.|16 oz.|24 oz.", { listStyle: builder.ListStyle.button });
    },
    function(session, results) {
        session.dialogData.coffeeSize = results.response.entity;
        builder.Prompts.choice(session, "How many shots would you like?", "One|Two|Three|Four", { listStyle: builder.ListStyle.button });
    },
    function(session, results) {
        setShotsArray(results.response.entity);
        session.dialogData.textShot = results.response.entity.toLowerCase();
        session.dialogData.coffeeShots = shotsArray[results.response.entity];
        builder.Prompts.text(session, "What is your name? I'd like to add it to your order.")
    },
    function(session, results) {
        session.dialogData.customerName = results.response.charAt(0).toUpperCase() + results.response.slice(1).toLowerCase();
        var uuid = (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
        var item = {
            order: session.dialogData.coffeeSize + ' ' + session.dialogData.coffeeType + ' with ' +
                session.dialogData.textShot + ' shot(s)',
            coffee: session.dialogData.coffeeType,
            size: Number(session.dialogData.coffeeSize.substr(0, 2)),
            flavor: null,
            shots: Number(session.dialogData.coffeeShots),
            name: session.dialogData.customerName,
            guid: uuid
        };
        session.send('\n* %s added for %s', item.order, item.name);
        session.endDialogWithResult({ response: item });
    }
]).cancelAction('cancelItemAction', "Item canceled.", {
    matches: /(cancel.*item|^cancel)/i
});

// Dialog for ordering a mocha coffee
bot.dialog('orderMocha', [
    function(session) {
        session.dialogData.coffeeType = 'mocha';
        builder.Prompts.choice(session, "What size?", "12 oz.|16 oz.|24 oz.", { listStyle: builder.ListStyle.button });
    },
    function(session, results) {
        session.dialogData.coffeeSize = results.response.entity;
        builder.Prompts.choice(session, "Would you like to add a flavor?", "Vanilla|Hazelnut|Raspberry|None", { listStyle: builder.ListStyle.button });
    },
    function(session, results) {
        session.dialogData.coffeeFlavor = results.response.entity.toLowerCase();
        builder.Prompts.choice(session, "How many shots would you like?", "One|Two|Three|Four", { listStyle: builder.ListStyle.button });
    },
    function(session, results) {
        setShotsArray(results.response.entity);
        session.dialogData.textShot = results.response.entity.toLowerCase();
        session.dialogData.coffeeShots = shotsArray[results.response.entity];
        builder.Prompts.text(session, "What is your name? I'd like to add it to your order.")
    },
    function(session, results) {
        session.dialogData.customerName = results.response.charAt(0).toUpperCase() + results.response.slice(1).toLowerCase();
        var uuid = (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
        if (session.dialogData.coffeeFlavor == 'none') {
            var item = {
                order: session.dialogData.coffeeSize + ' ' + session.dialogData.coffeeType + ' with ' +
                    'no flavor added and ' +
                    session.dialogData.textShot + ' shot(s)',
                coffee: session.dialogData.coffeeType,
                size: Number(session.dialogData.coffeeSize.substr(0, 2)),
                flavor: 'none',
                shots: Number(session.dialogData.coffeeShots),
                name: session.dialogData.customerName,
                guid: uuid
            };
        } else {
            var item = {
                order: session.dialogData.coffeeSize + ' ' + session.dialogData.coffeeType + ' with ' +
                    session.dialogData.coffeeFlavor + ' flavor and ' +
                    session.dialogData.textShot + ' shot(s)',
                coffee: session.dialogData.coffeeType,
                size: Number(session.dialogData.coffeeSize.substr(0, 2)),
                flavor: session.dialogData.coffeeFlavor,
                shots: Number(session.dialogData.coffeeShots),
                name: session.dialogData.customerName,
                guid: uuid
            };
        }
        session.send('\n* %s added for %s', item.order, item.name);
        session.endDialogWithResult({ response: item });
    }
]).cancelAction('cancelItemAction', "Item canceled.", {
    matches: /(cancel.*item|^cancel)/i
});

// Dialog for showing the users cart
bot.dialog('viewCartDialog', [
    function(session) {
        var msg;
        var cart = session.userData.cart;
        if (cart.length > 0) {
            msg = "Items in your cart:";
            for (var i = 0; i < cart.length; i++) {
                msg += "\n* " + cart[i].order + " for " + cart[i].name;
            }
        } else {
            msg = "Your cart is empty.";
        }
        session.endDialog(msg);
    }
]);

// Dialog for checking out
bot.dialog('checkoutDialog', [
    function(session) {
        var cart = session.userData.cart;
        if (cart.length > 0) {
            session.send('Order confirmed.')
            for (i = 0; i < cart.length; i++) {
                session.send(`
                Coffee: ${cart[i].order}
                Customer name: ${cart[i].name}`)
            }
        } else {
            msg = "Your cart is empty.";
        }
        delete session.userData.cart;
        session.endConversation('Thank you for your order!');
    }
]);

// Function for creating a guid
function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
};

// Function to set shotsArray
function setShotsArray(sArray) {
    switch (sArray) {
        case "One":
            shotsArray = { "One": 1 };
            break;
        case "Two":
            shotsArray = { "Two": 2 };
            break;
        case "Three":
            shotsArray = { "Three": 3 };
            break;
        case "Four":
            shotsArray = { "Four": 4 };
    };
    return (shotsArray);
};