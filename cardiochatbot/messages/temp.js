"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var fileReader = require("fs");
var path = require('path');
var fs = require('fs');

var responseDelayInSeconds = 3;

var choice3 = '';
var choice4 = '';
const finalNote = 'Wonderful!  I went ahead and pulled some additional resources on this topic that you may want to reference for the future.';
var customMessage = '';

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword']
    //stateEndpoint: process.env['BotStateEndpoint'],
    //openIdMetadata: process.env['BotOpenIdMetadata']
});

/**var bot = new builder.UniversalBot(connector);**/
var bot = new builder.UniversalBot(connector);

var welcomeMessages = [];

var createTimeoutCallbacks = function(array, finalStatement){
    var functionBody = "||"
    for(var i=0; i<array.length; i++){
        if( i !== array.length-1 ){
            functionBody = functionBody.replace("||",
                "session.sendTyping();setTimeout(function(){session.send(\""+array[i]+"\");||}, "+(responseDelayInSeconds * 1000)+");");
        }else{
             functionBody = functionBody.replace("||", finalStatement );
        }
    }
    functionBody = functionBody.replace("||", "");
    return new Function('session', functionBody);
}

var welcomeMessageFunction = null;

fileReader.readFile('bot-config/welcome.json', 'utf8', function(err, data) {
    if (err) throw err;

    welcomeMessages =JSON.parse(data);

    welcomeMessageFunction = createTimeoutCallbacks(welcomeMessages, "session.beginDialog('/');");
    //console.log("WelcomeMessageFunction arguments are : "+JSON.stringify(welcomeMessageFunction.toString()));
    bot.dialog('Welcome Message', [welcomeMessageFunction]);

    bot.dialog('/',  [function (session, results, next) {
           if(session.message.text !== '' && !session.conversationData.visited){
               session.conversationData.nameGiven = session.message.text;
           }
           if(!session.conversationData.nameGiven){
               session.sendTyping();
               setTimeout(function(){
                    builder.Prompts.text(session, welcomeMessages[welcomeMessages.length-1]);
                },  responseDelayInSeconds * 1000);
            } else {
               next();
    		}
        },
        function(session, results){
            if(!session.conversationData.nameGiven){
                session.conversationData.nameGiven = session.message.text;
            }

            if(session.conversationData.visited){
               session.send('Welcome back '+session.conversationData.nameGiven);
            }else{
                session.sendTyping();
                setTimeout(function () {
                    session.send('It is nice to chat with you today, '+session.conversationData.nameGiven);
                    session.sendTyping();
                        setTimeout(function () {
                        session.send('My name is Mattie Hart, and its my job to help you get started.');
                        session.sendTyping();
                            setTimeout(function() {
                                  builder.Prompts.choice(session,
                                  'I understand you have had a denial with your insurance company. Have you received a denial letter yet or spoken to your insurance verbally about the denial?',
                                  'Yes|No',
                                  { listStyle: builder.ListStyle.button }
                                );
                                session.conversationData.welcomeMessageFinished = true;
                            }, responseDelayInSeconds * 1000);
                    }, responseDelayInSeconds * 1000);
                }, responseDelayInSeconds * 1000);
            }
        },
        function (session, results) {
            //console.log('Hitting the second function in root dialog');
            var appendMessage = '';
            session.sendTyping();
            if(session.message.text === 'Yes'){
            appendMessage = 'Ok, that helps.';
            session.beginDialog('User Situation', appendMessage);
            }else if(session.message.text === 'No'){
                setTimeout(function(){
                    session.send('Sometimes when you see that insurance isn’t paying any of the costs, it seems like a denial, but there might be other things going on. It’s worth it to investigate these items before we rush to an appeal that may not be needed.');
                    session.beginDialog('User Situation', appendMessage);
                }, responseDelayInSeconds * 1000);
            }
         },
        function (session, results){
            //console.log('Hitting the third function in root dialog');
            if(results.response.entity === 'No payment towards a service I already received'){
                choice3 = 'No payment towards a service I already received';
                session.sendTyping();
                setTimeout(function(){
                    session.send('I’m happy to hear that your care has not been delayed, and that you were able to receive the service your doctor prescribed. Let’s keep going to see if we can identify why it is not being paid by your insurance.');
                    session.beginDialog('Received EOB or a Bill');
                }, responseDelayInSeconds * 1000);
            }else if(results.response.entity === 'No coverage for medication I need'){
                choice3 = 'No coverage for medication I need';
                session.beginDialog('Reason for Denial');
            }else{
                session.sendTyping();
                setTimeout(function(){
                    session.send('You clicked an unconfigured option');
                    session.endDialog();
                }, responseDelayInSeconds * 1000);
                session.conversationData.visited = true;
            }
        },
        function (session, results){

            if(choice3 === 'No coverage for medication I need'){
                if(results.response.entity === 'Medication requires me to use another medication first, called step therapy'){
                    choice4 = 'Medication requires me to use another medication first, called step therapy';
                    session.sendTyping();
                    setTimeout(function(){
                        session.send('Thank you, that gives me an idea of what we can do next');
                        session.sendTyping();
                        setTimeout(function(){
                            session.send('Insurance plans reference a large list of medications called a formulary when they make decisions on medications. The formulary lists all the drugs they will cover, and the special rules they require before covering some drugs.');
                            session.sendTyping();
                            setTimeout(function(){
                               session.send('It sounds like for your medication, your plan’s drug list requires you to have tried other similar medications first that are considered medically equivalent before they will pay for this one.  The good news is that your doctor can help you in the next steps.');
                               session.beginDialog('Ready for steps to take');
                            }, responseDelayInSeconds * 1000);
                        }, responseDelayInSeconds * 1000);
                    }, responseDelayInSeconds * 1000);
                }else{
                    session.sendTyping();
                    setTimeout(function(){
                        session.send('You clicked an unconfigured option');
                        session.endDialog();
                    }, responseDelayInSeconds * 1000);
                session.conversationData.visited = true;
            }
            }else if(choice3 === 'No payment towards a service I already received'){
                if(results.response.entity === 'I only have a bill from the doctor'){
                    choice4 = 'I only have a bill from the doctor';
                    session.sendTyping();
                    setTimeout(function(){
                        session.send('Thank you, that helps a lot. Since you only have a bill from the doctor and no matching EOB, it sounds like your provider has not submitted the service to your insurance company.  If you insurance doesn’t know you had the procedure, it will not be able to help pay for it');
                        session.sendTyping();
                        setTimeout(function(){
                            session.send('To fix this, the first step is to call the provider who you saw. You’ll want to alert them to what you’ve noticed and make sure that they have all the necessary information about your insurance to submit in the format that the insurer requires.  Once they have this info, request they resubmit the claim.');
                            session.sendTyping();
                            setTimeout(function(){
                                session.send('If you visited an out of network provider, they may not have the system to submit to your insurer, so you should call your insurance and ask how you can submit the claim yourself.');
                                session.sendTyping();
                                setTimeout(function(){
                                   session.send('In both instances, you’ll want to inform the office that you received the bill but ask for the due date to be adjusted to allow you time to fix the issue. Do not make payment on the bill until you know for sure that you owe that amount.');
                                   session.beginDialog('Did that help');
                               }, responseDelayInSeconds * 1000);
                            }, responseDelayInSeconds * 1000);
                        }, responseDelayInSeconds * 1000);
                    }, responseDelayInSeconds * 1000);
                }else{
                    session.sendTyping();
                    setTimeout(function(){
                        session.send('You clicked an unconfigured option');
                        session.endDialog();
                    }, responseDelayInSeconds * 1000);
                session.conversationData.visited = true;
            }
            }
        },
        function (session, results){
            if(choice4 === 'Medication requires me to use another medication first, called step therapy'){
                if(results.response){
                    session.sendTyping();
                    setTimeout(function(){
                        session.send('Either your doctor or you can call your plan and get a list of the medications they want you to try first. If you haven’t tried these and your doctor thinks they may work for you, the prescription can adjusted and sent to the pharmacy. These drugs will almost always be cheaper too!');
                        session.sendTyping();
                        setTimeout(function(){
                            session.send('If you have already tried the medications on the list and they have not worked, your should ask your doctor to send documentation of this to the insurer, and ask that they reconsider with the new information.');
                            session.sendTyping();
                            setTimeout(function(){
                                session.send('If your doctor believes there is a reason why this drug is the best one for you and there is a medical reason to skip the others, they will need to provide their reasoning based on your medical files along with any research that supports the case.');
                                session.beginDialog('Did that help');
                            }, responseDelayInSeconds * 1000);
                        }, responseDelayInSeconds * 1000);
                    }, responseDelayInSeconds * 1000);
                }else{
                    session.sendTyping();
                    setTimeout(function(){
                        session.send('You have given an unconfigured option');
                        session.endDialog();
                    }, responseDelayInSeconds * 1000);
                    session.conversationData.visited = true;
                }
            }else if(choice4 === 'I only have a bill from the doctor'){
                if(results.response.entity === "Yes"){
                    session.sendTyping();
                    setTimeout(function(){
                        session.send(finalNote);
                        customMessage = new builder.Message(session)
                                            .text('[Shopping Around - Even Within Your Network](http://www.patientadvocate.org/) \n\n Comparing costs between network providers can save you money.')
                                            .textFormat('markdown')
                                            .textLocale("en-us");
                         session.sendTyping();
                         setTimeout(function(){
                             session.send(customMessage);
                             customMessage = new builder.Message(session)
                                            .text('[Tips for Negotiating Bills with Out of Network Providers](http://www.patientadvocate.org/) \n\n Sometimes using an out-of-network provider is unavoidable, but there are ways you can lower your costs.')
                                            .textFormat('markdown')
                                            .textLocale("en-us");
                              session.sendTyping();
                              setTimeout(function(){
                                  session.send(customMessage);
                                  customMessage = new builder.Message(session)
                                            .text('[My Insurance Inst Paying, Now What](http://www.patientadvocate.org/) \n\n Tip sheet for dealing with most common reasons your insurance is not paying and what to do')
                                            .textFormat('markdown')
                                            .textLocale("en-us");
                                  session.sendTyping();
                                  setTimeout(function(){
                                      session.send(customMessage);
                                      session.endDialog();
                                  }, responseDelayInSeconds * 1000);
                              }, responseDelayInSeconds * 1000);
                         }, responseDelayInSeconds * 1000);
                    }, responseDelayInSeconds * 1000);
                    session.conversationData.visited = true;
                }else{
                    session.sendTyping();
                    setTimeout(function(){
                    session.send('You clicked an unconfigured option');
                    session.endDialog();
                    }, responseDelayInSeconds * 1000);
                    session.conversationData.visited = true;
                }
            }else{
                session.sendTyping();
                setTimeout(function(){
                    session.send('You clicked an unconfigured option');
                    session.endDialog();
                }, responseDelayInSeconds * 1000);
                session.conversationData.visited = true;
            }
        },
        function(session, results){
            if(choice4 === 'Medication requires me to use another medication first, called step therapy'){
                if(results.response.entity === "Yes"){
                    session.sendTyping();
                    setTimeout(function(){
                        session.send(finalNote);
                        customMessage = new builder.Message(session)
                                            .text('[Reading a Drug Formulary](http://www.patientadvocate.org/) \n\n Insurer’s drug lists contain lots of important information, these examples show you how to understand your medication coverage')
                                            .textFormat('markdown')
                                            .textLocale("en-us");
                        session.sendTyping();
                        setTimeout(function(){
                            session.send(customMessage);
                            customMessage = new builder.Message(session)
                                            .text('[Appealing Mediation Formulary Decisions](http://www.patientadvocate.org/) \n\n This guide can help you when requesting access to specific medications outside of your formulary')
                                            .textFormat('markdown')
                                            .textLocale("en-us");
                            session.sendTyping();
                            setTimeout(function(){
                                session.send(customMessage);
                                session.endDialog();
                            }, responseDelayInSeconds * 1000);
                        }, responseDelayInSeconds * 1000);
                    }, responseDelayInSeconds * 1000);
                 }else{
                    session.sendTyping();
                    setTimeout(function(){
                    session.send('You clicked an unconfigured option');
                    session.endDialog();
                    }, responseDelayInSeconds * 1000);
                    session.conversationData.visited = true;
                }
            }
            session.conversationData.visited = true;
        }
    ])
});
//var initializeBot = function(){



//var welcomeMessageFunction = createTimeoutCallbacks(welcomeMessages, "session.beginDialog('/');");
/**bot.dialog('Welcome Message', [welcomeMessageFunction
    function (session) {
          session.send(welcomeMessages[0]);
          //session.conversationData.welcomeMessageFinished = false;
          createTimeoutCallbacks(session, welcomeMessages);
		  session.beginDialog('/');
          //session.conversationData.welcomeMessageFinished = false;

          //session.beginDialog('Main Dialog');
          //session.endDialog();
      }
  ]);**/

bot.dialog('Ask Name', [
    function(session, args){
        builder.Prompts.text(session, 'Can I know your name?');
    },
    function(session, results){
        //console.log('Got the username : '+session.message.text);
        session.conversationData.nameGiven = session.message.text;
        session.endDialogWithResult(results);
    }
]);

bot.dialog('User Situation' , [
    function(session, args){
        //console.log('Hitting the User Situation dialog');
        session.sendTyping();
            setTimeout(function(){
             builder.Prompts.choice(session,
              args+' Which of these best matches the situation you have?',
             'No payment towards a service I already received|No coverage for medication I need|Denial of pre-authorization request for a service my doctor prescribed',
             { listStyle: builder.ListStyle.button }
             );
        },responseDelayInSeconds * 1000);

        //console.log('Hitting the end of User Situation dialog');
    },
    function(session, results){
        //console.log('Hitting the second function of User Situation dialog');
        session.endDialogWithResult(results);
    }
]);

bot.dialog('Received EOB or a Bill', [
    function(session){
        session.sendTyping();
        setTimeout(function(){
            builder.Prompts.choice(session,
            'Have you received an Explanation of Benefits, known as an EOB from your plan yet or a bill from the doctor?',
            'I have my EOB|I only have a bill from the doctor|I have both the EOB and the bill from the doctor',
            { listStyle: builder.ListStyle.button }
          );
        }, responseDelayInSeconds * 1000);
    },
    function(session, results){
       session.endDialogWithResult(results);
    }
])

bot.dialog('Reason for Denial', [
    function(session){
        //console.log('Reason for denial first function')
        session.sendTyping();
        setTimeout(function(){
            builder.Prompts.choice(session,
            'Can you tell me which of these best matches the reason provided on the denial letter?',
            'Medication not on approved drug list or formulary|Approved prior-authorization not received|Medication requires me to use another medication first, called step therapy|Medication limit has already been met (dose or quantity)|Requires a different pharmacy or mail-order pharmacy|Other reason',
            { listStyle: builder.ListStyle.button }
           );
        }, responseDelayInSeconds * 1000);
    },
    function(session, results){
        //console.log('Reason for denial second function');
        session.endDialogWithResult(results);
    }
])

bot.dialog('Ready for steps to take', [
    function(session){
       session.sendTyping();
       setTimeout(function(){
          builder.Prompts.confirm(session,
           'Are you ready for some steps you can take?');
       }, responseDelayInSeconds * 1000);
    },
    function(session, results){
        session.endDialogWithResult(results);
    }
]);

bot.dialog('Did that help', [
    function(session){
       session.sendTyping();
       setTimeout(function(){
           builder.Prompts.choice(session,
            'Did that help?',
             'Yes|No',
             { listStyle: builder.ListStyle.button }
         );
       }, responseDelayInSeconds * 1000);
    },
    function(session, results){
        session.endDialogWithResult(results);
    }
]);


bot.on('conversationUpdate', function (message) {
    //console.log('Conversation Update called')
	if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                //if(!convStartedAddress.has(message.address)){
                   // convStartedAddress.add(message.address);
                    //console.log('Starting the root dialog');
                    bot.beginDialog(message.address, 'Welcome Message');
                //}
            }
        });
    }
});

bot.localePath(path.join(__dirname, './locale'));

/**bot.dialog('/', function (session) {
    session.send('You said ' + session.message.text);
});**/
console.log("Before Initializing the bot");


if (useEmulator) {
    console.log("Initializing the bot inside if condition");
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());
} else {
    console.log("Initializing the bot inside else condition");
    module.exports = { default : connector.listen() }
}
