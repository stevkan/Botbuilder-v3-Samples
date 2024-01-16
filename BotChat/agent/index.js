var chats = document.getElementById("chats");
var messages = document.getElementById("messages");
setInterval(function () {
    return fetch("https://xferbot.azurewebsites.net/api/agent/1")
        .then(function (response) { return response.text(); })
        .then(function (text) {
        var conversationId = text.replace(/"/g, '');
        console.log("conversationId", conversationId);
        if (conversationId !== 'None') {
            createIframe(conversationId);
        }
    });
}, 3 * 1000);
var sendToBot = function (id, conversationId) {
    var iframe = document.getElementById(id).contentWindow;
    console.log("iframe", id);
    iframe.postMessage({ conversationId: conversationId }, window.location.origin);
};
var createIframe = function (conversationId) {
    var id = "botchat_" + conversationId;
    var iframe = document.createElement('iframe');
    iframe.id = id;
    iframe.src = 'botchat?s=';
    iframe.width = "320";
    iframe.height = "500";
    iframe.onload = function (event) {
        sendToBot(id, conversationId);
    };
    chats.appendChild(iframe);
    return id;
};
