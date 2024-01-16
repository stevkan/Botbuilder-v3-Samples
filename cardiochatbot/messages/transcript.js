var PDFDocument, doc;
var fs = require('fs');
PDFDocument = require('pdfkit');

const base64 = require('base64-stream');

var nodemailer = require('nodemailer');
//const sendmail = require('sendmail')();

var conversations = {};

const logConversations = function(action, id){
    if(!conversations.hasOwnProperty(id)){
        var newConv = {};
        newConv[id] = [];
        conversations = Object.assign({}, conversations, newConv);
    }
    //console.log("Created conversations before concating so far is "+JSON.stringify(conversations, null, 5));
    conversations[id] = conversations[id].concat(action);
    //console.log("Created conversations so far is "+JSON.stringify(conversations, null, 5));
}

/*setInterval(function(){
  console.log("timeout function called");
  console.log("Current conversations length before deletion is "+Object.keys(conversations).length);
  for(var id in conversations){
    if(Date.now() - conversations[id][conversations[id].length-1]["time"] > 180000){
      delete conversations[id]
    }
  }
  console.log("Current conversations length after deletion is "+Object.keys(conversations).length);
}, 60000)*/

const resetConversations = function(){
    conversations = [];
}

const createPDFAndSendEmail = function(email, session){
    //console.log("Conversations Array is "+JSON.stringify(conversations));
    var finalString = ''; // contains the base64 string
    var conversation = conversations[session.message.address.conversation.id].slice(1);
    doc = new PDFDocument;
    var stream = doc.pipe(base64.encode());
    //doc.pipe(fs.createWriteStream("output.pdf"));
    doc.fontSize(18).text("Matters of the Heart Interactive Chat Service", {align : "center"});
    doc.fontSize(12).text("Working together for health...because it matters", {align : "center"});
    doc.text("\n");
    for(var i=0; i<conversation.length; i++){
        var match = conversation[i].text.match(/\[((.)*?)\]\(((.)*?)\)/ig);
        if(!match){
            if(conversation[i].action === "Receive_Message"){
                //console.log("Writing the "+JSON.stringify(conversations[i].text)+" to the output file");
                doc.text(conversation[i].text.replace(/\r?\n|\r/g, " ").replace(/\s\s+/g,' ').trim(), {
                        width: 480,
                        align: 'right'
                    });
                doc.text("\n");
            }else if(conversation[i].action === "Send_Message"){
                //console.log("Writing the "+JSON.stringify(conversations[i].text)+" to the output file");
                doc.text(conversation[i].text.replace(/\r?\n|\r/g, " ").replace(/\s\s+/g,' ').trim(), {
                        width: 480,
                        align: "left"
                    });
                if(conversation[i].attachments){
                    for(var j=0; j<conversation[i].attachments.length; j++){
                        for(var k=0; k<conversation[i].attachments[j].content.buttons.length; k++){
                            doc.text((k+1)+". "+conversation[i].attachments[j].content.buttons[k].value.replace(/\r?\n|\r/g, " ").replace(/\s\s+/g,' ').trim(), {
                                    width: 480,
                                    align: "left"
                            });
                        }
                    }
                }
                doc.text("\n");
            }
        }else{
            var foundMatch = match[0];
            var foundMatchArr = foundMatch.split("](");
            var label = foundMatchArr[0].slice(1,foundMatchArr[0].length);
            var link = foundMatchArr[1].slice(0,foundMatchArr[1].length-1);
            var labelWidth = doc.widthOfString(label);
            var labelHeight = doc.currentLineHeight();
            var x = doc.x;
            var y = doc.y;

            var text = conversation[i].text.replace(/\r?\n|\r/g, " ")
                                                          .replace(/\s\s+/g,' ')
                                                          .trim()
                                                          .replace(foundMatch, "");
            doc.fillColor("blue").text(label, {
                    width: 480,
                    align: "left",
                    underline: true,
                    link: link
                })/*.underline(x, y, labelWidth, labelHeight, {color: 'blue'})
                   .link(x, y, labelWidth, labelHeight, link)*/.fillColor("black").text(text.replace(". ",""));
            doc.text("\n");
        }
    }

    conversations[session.message.address.conversation.id] = [];
    doc.end();

    stream.on('data', function(chunk) {
        //console.log("Stream On Data Called");
        finalString += chunk;
    });

    stream.on('end', function() {
        var transporter = nodemailer.createTransport({
              host: 'smtp.office365.com',
              port: 587,
              //secure:true,
              auth: {
                  user: 'nurd@patientadvocate.org',
                  pass: 'dpYToEB1'
              }
              //requireTLS: false
        });

        var mailOptions = {
          from: 'chatbot@patientadvocate.org',
          to: email,
          subject: 'PDF Attachment: Transcript',
          text: 'Attached is the Transcript of conversations you had with Matters of the heart chatbot',
          attachments: [{   // encoded string as an attachment
            filename: 'Transcript.pdf',
            content: finalString,
            encoding: 'base64'
        }]
        };

        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
            session.send("Sorry, there was an error while sending the email");
          } else {
            console.log('Email sent: ' + info.response);
            session.send("Email sent successfully");
          }
      });
  });
}

module.exports = {
    "logConversations" : logConversations,
    "createPDFAndSendEmail" : createPDFAndSendEmail,
    "resetConversations" : resetConversations
}
