var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var request = require('request');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 3001;        // set our port

// Express only serves static React client assets in production, in development the Webpack proxy is used
if (process.env.NODE_ENV === "production") {
    app.use(express.static("client/build"));
}

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// Configuration
var secret = 'ksVw5jQo-Jk.cwA.obM.wiPUdJXfwggPjK7X7Sc7wuiIxcCvPc1uX-a_QuGoc_0';
var domain = 'https://directline.botframework.com/v3/directline';

// Get a directline configuration (accessed at GET http://localhost:3001/api/config)
router.get('/config', function (req, res) {
    const options = {
        method: 'POST',
        uri: domain + '/tokens/generate',
        headers: {
            'Authorization': 'Bearer ' + secret
        },
        json: {
            // TrustedOrigins: ['http://localhost:3002']
            TrustedOrigins: ['http://v-stkanb-oauth-connect.azurewebsites.net:3002']
        }
    };

    request.post(options, (error, response, body) => {
        console.log("response good");
        if (!error && response.statusCode < 300) {
            res.json({
                token: body.token,
                conversationId: body.conversationId,
                domain: domain
            });
            console.log(body);
        }
        else {
            res.status(500).send('Call to retrieve token from DirectLine failed');
        }
    });
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
// console.log('Client Host is on: http://localhost:' + port);
console.log('Client Host is on: http://v-stkanb-oauth-connect.azurewebsites.net:' + port);


module.exports = app;
