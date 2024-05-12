var options = {
    // option values
    newMailNotificationEnabled: true,
    moveTopMenuToLeftEnabled: true,
    colorFoldersEnabled: true,
    colorAlertInMsgEnabled: true
}
var settings = {
    folderColors: "[ {\"folderName\":\"Inbox\", \"color\":\"white\", \"background-color\": \"gray\" },\n {\"folderName\":\"From My Boss\", \"color\":\"black\", \"background-color\": \"yellow\" },\n {\"folderName\":\"From My Team\", \"color\":\"white\", \"background-color\": \"blue\" } ]"
}

function initialize() {

    // Options
    var optionsKeyArr = new Array();
    for(var key in options) {
        optionsKeyArr.push(key);
    }

    chrome.storage.sync.get( optionsKeyArr, function( optionValues ) {
        console.log("bg.js:initialize() chrome.storage.sync.get : called");

        for(var key in optionValues ) {
            console.log("bg.js:initialize() Updating local option value from " + options[key] + " to " + key + ": " + optionValues[key] + " typeof " + typeof(optionValues[key]));
            options[ key ] = optionValues[key];
        }

        // Fill missingOptions array with missing data in returned value array.
        var missingOptions = {};
        for(var key in options) {
            if( optionValues[key] == undefined ) {
                missingOptions[key] = options[key];
                console.log("bg.js:initialize() Setting default option value of " + key + " to " + missingOptions[key] + " typeof " + typeof(missingOptions[key]));
            }
        }

        // Update missng values.
        chrome.storage.sync.set( missingOptions, function() {
            console.log("bg.js:initialize() Setting default option values completed.");
        });
    } );


    // Settings
    var settingsKeyArr = new Array();
    for(var key in settings) {
        settingsKeyArr.push(key);
    }

    chrome.storage.sync.get( settingsKeyArr, function( settingValues ) {
        console.log("bg.js:initialize() chrome.storage.sync.get : called");

        for(var key in settingValues ) {
            settings[ key ] = settingValues[key];
        }

        // Fill missingOptions array with missing data in returned value array.
        var missingSettings = {};
        for(var key in settings ) {
            if( settingValues[key] === undefined ) {
               // localStorage[ key ] = settings[ key ];
                missingOptions[key] = settings[ key ];
                console.log("bg.js:initialize() Setting default setting value of " + key + " to " + missingSettings[key] + " typeof " + typeof(missingSettings[key]));
            }
        }

        // Update missng values.
        chrome.storage.sync.set( missingSettings, function() {
            console.log("bg.js:initialize() Setting default option values completed.");
        });
    });

}
// settingValues { key: true, k:false }
function updateOption( optionValues ) {
    console.log("bg.js:updateOption is called." );
    chrome.storage.sync.set( optionValues, function() {
        for(var key in optionValues) {
            options[ key ] = optionValues[ key ];
            console.log("bg.js:updateOption Saving " + key + " with "+ options[key] + " completed." );
        }
    });
}
// settingValues { key: value, k:v }
function updateSetting( settingValues ) {
    console.log("bg.js:updateSetting is called." );
    chrome.storage.sync.set( settingValues, function() {
        for(var key in settingValues) {
            settings[ key ] = settingValues[ key ];
            console.log("bg.js:updateSetting Saving " + key + " with "+ settings[key] + " completed." );
        }
    });
}


///////////////////////////////////////////////
///////////////////////////////////////////////

initialize();


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log("bg.js:chrome.runtime.onMessage is called. ");

        if( request.icon === "show") {
            var myTabId = sender.tab.id;
            chrome.pageAction.show(myTabId);

        } else if( request.method === "getTabId"){
            sendResponse({tabId: sender.tab.id });

        } else if( request.method === "getWindowId"){
            var dfd = $.Deferred();
            var windowId = -1;
            chrome.windows.getCurrent( {populate: false}, function( myWindow ){ 
                console.log("bg.js:chrome.runtime.onMessage getWindowId: windowId = "+myWindow.id);
                windowId = myWindow.id;
                dfd.resolve();
            });
sendResponse({windowId: 519});
            dfd.done( function(){ 
                console.log("dfd.done!! "+windowId);
                sendResponse({windowId: windowId}); 
            });

        } else if( request.method === "notification"){
            var _title = request.title;
            var _message = request.body;
            var _tabId = request.tabId;
            var _windowId = request.windowId;
            var notifIconUrl = chrome.extension.getURL("image/myowa.png");
            var currentTime = (new Date()).getTime();

            console.log("_title:"+_title + " _message:"+_message);

            createNotification( "new-mail", notifIconUrl, _title, _message, _windowId, _tabId);

        }
    }
);


///////////////////////////////////////////////
///////////////////////////////////////////////


//duplicate function of checkMode but this is needed here..
function getMode(__callback) {
    sendRequestToContentScript( {action:"getMode"}, __callback );
}

function sendRequestToContentScript(request, __callback ) {
    chrome.tabs.query({ active: true, currentWindow:true }, function(tabs) {
        if( request.action === "getMode" ) {
            chrome.tabs.sendMessage(tab.id, request, {}, __callback);

        } else {
            chrome.tabs.sendMessage(tab.id, request, {}, function(){});
        }
    });
};

isOnClickActionAdded = false;

function createNotification( _id, _iconUrl, _title, _message, _windowId, _tabId) {
    var options = {
        type: "basic",
        title: _title,
        message: _message,
        iconUrl: _iconUrl
    };
    console.log("bg.js:createNotification() is invoked. "+_id);
    
    chrome.notifications.getAll(function( notifications ){ 
        // Clear notifications that has already been notified in order to show it again.
        for(var key in notifications) { 
            if( key.match(_id)) { 
                chrome.notifications.clear(_id, function(){});
            } 
        } 

        // Creating notificaiton.
        console.log("bg.js: creating a notification ID: "+_id);
        chrome.notifications.create( _id, options, function() {} );
    });

    if( !isOnClickActionAdded ) {
        chrome.notifications.onClicked.addListener( function(notificationId) {
            console.log("notifications.onClicked.addListener: _tabId = "+_tabId + " _windowId = "+_windowId);
            chrome.tabs.update( _tabId, {active: true, highlighted:true}, function(){} );
            chrome.windows.update( _windowId, {focused:true}, function(){});
        });
        isOnClickActionAdded = true;
    }
}

// 

