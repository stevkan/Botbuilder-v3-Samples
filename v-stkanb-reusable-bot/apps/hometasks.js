'use strict';
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var storage = require('azure-storage');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});

// Sets environment for connecting to Azure Storage Tables
var tableSvc = storage.createTableService('vstkanb', 'oaZ7svb2YuR210vpk8GVaGLBscT9Zy7DtYJjbVBWADg4zhKugAfrqjXyjs4h1BeEqcLOgkJTr2AthDqGVC91lg==');

// Creates table, if not exists
tableSvc.createTableIfNotExists('testtable', function(error, result, response){
if(!error){
  // Table exists or created
}
});

// Creates task to insert into table
var task = {
PartitionKey: {'_':'hometasks'},
RowKey: {'_': '1'},
description: {'_':'take out the trash'},
dueDate: {'_':new Date(2015, 6, 20), '$':'Edm.DateTime'}
};

// Inserts task into table
tableSvc.insertEntity('testtable', task, {echoContent: true}, function (error, result, response) {
  if(!error){
    // Entity inserted
  }
});