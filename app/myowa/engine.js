// Requirement:
//  utils.js
//  editor.js

var MyOWA = (function(){
    //////////// Private 
    var _mode = "";
    var MODE_OWA_Common = "Outlook_common";
    var MODE_OWA_Mail = "Outlook_mail";
    var MODE_OWA_Mail_ReadMessageItem = "Outlook_mail_ReadMsgItem";

    var _myowaIcon = chrome.extension.getURL("image/myowa.png");

    var _editor = null;


    var _myWindowId = -1;
    var _myTabId = -1;

    var _folderTreeRightClick = false;
    var _isFolderTreeAdded = false;

    var _options = {
        // option values : these should be synched up with chrome.storage.
        newMailNotificationEnabled: true,
        moveTopMenuToLeftEnabled: true,
        colorFoldersEnabled: true,
        colorAlertInMsgEnabled: true
    };

    var _settings = {
        folderColors: null, // This should be filled at the start up.
    };

    function _startup( __editor ) {
        _mode = _checkMode();
        _editor = __editor;

        if(_mode !== null) {
            chrome.runtime.sendMessage({"icon":"show"}, function(){});
            _getTabId();
            _getWindowId();
        } else {
            console.log("[MyOWA] startup() mode is not set. Exiting.  mode = " + _mode);
            return;
        }

        _updateOptionsFromSettings( function() {
            console.log("[MyOWA] startup() mode = " + _mode); 
            
            if( _mode == MODE_OWA_Mail || _mode == MODE_OWA_Common ) {

                // folder coloring and move top menu
                setTimeout(function() {
                    if( _options.moveTopMenuToLeftEnabled ) {
                        _moveTopMenuToLeft();
                    } else {
                        console.log("[MyOWA] startup() Move to Top Menu is not enaled.");
                    }
                }, 1000);


                _syncAdd_TreeNodeRowContainer().then( function(){

                    setTimeout( function(){
                        _colorFolders();
                        _configureSimpleColorConfigDialog();                    
                    }, 500);

                });

                _configureNotificationWatcher();

                // For context menu
                _configureContextMenuWatcher();

                // decorating mail body
                _configureHighlightAlertWatcher();

            } else if( _mode == MODE_OWA_Mail_ReadMessageItem ) {  
                cpmsole.log("nothing defined for MODE_OWA_Mail_ReadMessageItem");

            } 

        }); // end updateOptionsFromSettings
    };



    function _checkMode() {
        var mode = null;
        var currentUrl = location.href;
        
        if ( currentUrl.match(/.*\/owa\/#.*path=\/mail/) ) {
            mode = MODE_OWA_Mail;
        } else if( currentUrl.match(/.*\/owa\/#.*viewmodel=ReadMessageItem/) ) {
            mode = MODE_OWA_Mail_ReadMessageItem;
        } else if ( currentUrl.match(/.*\/owa\//) ) {
            mode = MODE_OWA_Common;
        } 

        console.log("[MyOWA] checkMode() mode = " + mode + " //// currentUrl = " + currentUrl);

        return mode;
    }

    function _getMode() {
        if( _mode === "" ) {
            _mode = _checkMode();
        }
        console.log("[MyOWA] getMod() mode = " + _mode);
        return _mode;
    }

    function _getTabId() {
        chrome.runtime.sendMessage( {"method":"getTabId"}, function( response ){
            _myTabId = response.tabId;
            console.log("[MyOWA] _getTabId() tabId = "+ _myTabId);
        });
    }
    function _getWindowId() {
        chrome.runtime.sendMessage( {"method":"getWindowId"}, function( response ) {
            _myWindowId = response.windowId;
            console.log("[MyOWA] _getWindowId() windowId = "+ _myWindowId);
        });
    }

    //////////////////////////////////////
    ////// Create desktop notification when a new mail comes or event reminder is shown.

    function _configureNotificationWatcher() {
        document.addEventListener("DOMNodeInserted", function(event) {
            hasClass = $(event.target).find(".headerMenuDropShadow");

            // Action should be taken when .headerMenuDropShadow element is added.
            if( hasClass.size() > 0) {
                if( ! _options.newMailNotificationEnabled ) {
                    console.log("[MyOWA] configureNotificationWatcher() New Mail Notification is not enabled.");
                    return;
                }

                console.log("[MyOWA] configureNotificationWatcher() a new notification found : "+ $(event.target).text() );

               if( $(event.target).find(".headerMenuDropShadow").find("div[aria-label='Reminders']").size() > 0 ) { // Should be a reminder

                    setTimeout(function(){
                        var reminder="Reminder", overdue = "", schedule = "", loc = "", time = "";
                        var reminderContent = $(".headerMenuDropShadow").find("div[aria-label='Reminders'] div[role='option']").children().children();

                        overdue = reminderContent.eq(2).children().eq(0).text();
                        schedule = reminderContent.eq(1).children().eq(2).text();
                        time = reminderContent.eq(2).children().eq(2).children().eq(0).text();
                        loc = reminderContent.eq(2).children().eq(2).children().eq(1).text();

                        console.log("[MyOWA] configureNotificationWatcher() New Reminder - title:"+reminder+ " | "+overdue+" schedule:"+schedule + " will start @ " + time +" at "+ loc );
                        _createNotification(reminder, overdue+ " Schedule:"+schedule + " start @ " + time +" at "+ loc );

                    }, 200);
                } else if( $(event.target).find(".headerMenuDropShadow").find("span:contains('IM')").size() > 0 ) { // Should be an IM notification

                    setTimeout(function(){
                        var imRequestHeader = $(event.target).find(".headerMenuDropShadow").find("span:contains('IM')").eq(0).text();

                        var imFrom = $(event.target).find("span[role='button']").text();
                        var imContent = $(event.target).find(".headerMenuDropShadow").find("span[role='button']").parent().parent().parent().siblings().text();

                        console.log("[MyOWA] configureNotificationWatcher() New IM Request - from:"+imFrom+ " | content:"+ imContent );
                        _createNotification(imRequestHeader, "From: "+imFrom + " | " + imContent );

                    }, 200);
                } else { // Maybe a new mail

                    setTimeout(function(){
                        var title = "", sender = "", body = "";
                        var headerMenuDropShadowSpans = $(event.target).find(".headerMenuDropShadow span");

                        sender = headerMenuDropShadowSpans.eq(1).text();
                        title = headerMenuDropShadowSpans.eq(2).text();
                        body = headerMenuDropShadowSpans.eq(3).text();

                        console.log("[MyOWA] configureNotificationWatcher() New Mail - title:"+title+ " from:"+sender +" body:"+body);
                        _createNotification(title, "From: "+sender+" | " + body);


                    }, 200);
                }
            }
        });
    }

    function _configureHighlightAlertWatcher() {
        document.addEventListener("DOMNodeInserted", function(event) {
            var isAlertMsgAdded = $(event.target).find(".InfobarImmediateTextContainer").size() > 0;

            if( isAlertMsgAdded ) {
                if( ! _options.colorAlertInMsgEnabled ) {
                    console.log("[MyOWA] configureHighlightAlertWatcher() Color Alert Msg is not enabled.");
                    return;
                }

                console.log("[MyOWA] configureHighlightAlertWatcher() isAlertMsgAdded = true");

                // show Image? -- InfobarImmediateTextContainer
                $(".InfobarImmediateTextContainer").parent().parent().css({"background-color":"lightyellow", "padding-left":"4px"});
                $(".InfobarImmediateTextContainer a").css({"background-color":"white"});

            } else {
        //        console.log("[MyOWA] configureHighlightAlertWatcher() mail content iframe was NOT found. Exiting"); // + $(event.target).html());
            }

        });
    }

    //////////////////////////////////////
    ////// Move top menu to left

    function _moveTopMenuToLeft() {
        // Move the top menu to left
        $("div[role='navigation']").parent().parent().css( {"float": "left" });
        $("span.image-owa_brand-png").css( {"float":"left"});
        $("div[role='banner']").parent().parent().css( {"position": "fixed", "top": "0", "right": "0"} );
    }


    //////////////////////////////////////
    ////// ColorConfigEditor from context menu in OWA Mail

    function _configureContextMenuWatcher() {
        console.log("[MyOWA] configureContextMenuWatcher() is added.");

        document.addEventListener("DOMNodeInserted", function(event) {
            if( !_folderTreeRightClick ) return;

            hasClass = $(event.target).parent().find(".contextMenuPopup");

            if( hasClass.size() > 0) {
                var jqMenuitem = $(".contextMenuPopup").find("div[role='menuitem']").eq(0).parent().clone();
                jqMenuitem.find(".owaimg").siblings().html("<img src='"+ _myowaIcon +"' style='width: 10px'>" + " Change color");
                $(".contextMenuPopup").find("div[role='menuitem']:last").parent().after( jqMenuitem );

                console.log("[MyOWA] configureContextMenuWatcher() context menu appeared!!");


                jqMenuitem.click(function(e){
                    console.log("[MyOWA] configureContextMenuWatcher() change color is clicked!!");
                    $("#folderColoringConfigTable").dialog("open");
                    $("#folderColoringConfigTable").click();
                });
                jqMenuitem.mouseenter( function(){
                    console.log("[MyOWA] configureContextMenuWatcher() mouse entered!");

                    $(".contextMenuPopup").find("div[role='menuitem']").removeClass("_o365c_m");
                    $(this).addClass("_o365c_m");

                    // maybe since version 15.0.1076.11 @20151001
                    $(".contextMenuPopup").find("div[role='menuitem']").removeClass("ms-bg-color-themeLight");
                    $(this).children().eq(0).addClass("ms-bg-color-themeLight");

                }).mouseleave( function(){
                    console.log("[MyOWA] configureContextMenuWatcher() mouse leave!");
                    $(this).removeClass("_o365c_m");

                    // maybe since version 15.0.1076.11 @20151001
                    $(this).children().eq(0).removeClass("ms-bg-color-themeLight");
                });

                _folderTreeRightClick = false;
            }
        });
    }

    function _configureSimpleColorConfigDialog() {
        
        var folderColorEditDialog = _getSimpleColorConfigDialogStr();
        $("body").append( folderColorEditDialog );

        $("#folderColoringConfigTable").dialog({
            autoOpen: false,
            modal: true,
            width: 630,
            height: 550,
            buttons: {
                "Save": function() {
                    _editor.saveSingleFolderColorConfig().then( function(){
                        Utils.getInstance().readFromStorage("folderColors", function( readData ){
                            _settings.folderColors = JSON.parse( readData["folderColors"] );
                            _colorFolders();
                        });
                    });

                    $(this).dialog("close");
                },
                "Cancel": function() {

                    $(this).dialog("close");
                }
            }
        });

        _updateSimpleColoringConfigTableInBackground();
    }
    function _getSimpleColorConfigDialogStr() {
        var folderColorEditDialog = "";
        folderColorEditDialog += "<div id='folderColoringConfigTable' title='folder coloring configuration'>";
        folderColorEditDialog += "  <p>Let's change mail folder visual!</p>";
        folderColorEditDialog += "  <table id='simpleFolderColorsConfig'></table>";
        folderColorEditDialog += "  <div id=''></div>";
        folderColorEditDialog += "</div>";

        return folderColorEditDialog;
    }
    function _updateSimpleColoringConfigTableInBackground() {
        $(".treeNodeRowContainer").mousedown( function(e) {
            if( e.which == 3 ) { // This capture only right click
                _folderTreeRightClick = true;

                // Get the folder name and id
                var jqTreeNodeRowContainer = $(e.target).parents(".treeNodeRowContainer");
                var folderName = jqTreeNodeRowContainer.find("span[role='heading']").eq(0).text();
                var folderId = jqTreeNodeRowContainer.find("span[role='heading']").attr("id");
                console.log("[MyOWA] _updateSimpleColoringConfigTableInBackground() folderName = "+folderName + " folderId = "+folderId);
                
                //
                chrome.storage.sync.get( "folderColors", function( optionValues ) {
                    console.log("[MyOWA] _updateSimpleColoringConfigTableInBackground() chrome.storage.sync.get : called");
                    var folderColors = JSON.parse( optionValues["folderColors"] );

                    var folderColor, isConfigAvailable = false;
                    for (var key in folderColors) {
                        folderColor = folderColors[ key ];

                        if( folderColor["folderName"] == folderName ) {
                            console.log("[MyOWA] _updateSimpleColoringConfigTableInBackground() found folder config for "+folderName+".");
                            isConfigAvailable = true;
                            break;
                        }
                    };

                    if( isConfigAvailable ) {
                        console.log("[MyOWA] _updateSimpleColoringConfigTableInBackground() buiding simple ConfigTable with "+folderName+"'s config.");
                        _editor.buildSimpleColoringConfigTable( folderName, folderId, folderColor);
                    } else {
                        console.log("[MyOWA] _updateSimpleColoringConfigTableInBackground() buiding simple ConfigTable without config.");
                        _editor.buildSimpleColoringConfigTable( folderName, folderId);
                    }

                });

            }
        });
    }


    // return dfd.promise()
    function _syncAdd_TreeNodeRowContainer() {
        var dfd = $.Deferred();

        if( $(".treeNodeRowContainer").size() > 0 ) {

            console.log("[MyOWA] syncAdd_TreeNodeRowContainer() The element .treeNodeRowContainer has already existed.");
            _isFolderTreeAdded = true;
            dfd.resolve();

        } else {

            var treeNodeRowContainerWatcher = function() {
                var isTreeNodeRowContainerAdded = $(event.target).find(".treeNodeRowContainer").size() > 0;

                if( isTreeNodeRowContainerAdded &&  ! _isFolderTreeAdded ) {
                    _isFolderTreeAdded = true;
                    console.log("[MyOWA] syncAdd_TreeNodeRowContainer() Detected the element .treeNodeRowContainer being added to the page." );
                    console.log("[MyOWA] syncAdd_TreeNodeRowContainer() Removing EventListener for the element .treeNodeRowContainer." );
                    document.removeEventListener("DOMNodeInserted", this );
                    dfd.resolve();
                }
            };

            console.log("[MyOWA] syncAdd_TreeNodeRowContainer() Adding EventListener because the element isTreeNodeRowContainerAdded hasn't existed yet.");
            document.addEventListener("DOMNodeInserted", treeNodeRowContainerWatcher );
        }

        return dfd.promise();
    }

    function _colorFolders() {
        console.log("[MyOWA] _colorFolders() is invoked.");

        var folder = null, cssArr, cssStr;
        for(var key in _settings.folderColors) {
            cssArr = {}, cssStr = "";
            folder = _settings.folderColors[ key ];

            for(var element in folder) {
                if( element === "folderName" ) continue;
                cssArr[ element ] = folder[ element ];
                cssStr += element+":"+folder[element]+" ";
            }
            console.log("[MyOWA] _colorFolders() css for "+folder.folderName + " = "+cssStr);

            cssArr["padding-left"] = "3px";
            cssArr["padding-right"] = "4px";
            $(".treeNodeRowContainer").find("span[title='"+folder.folderName+"']").css(cssArr);
        }
    }



    function _createNotification(_title, _body) {
        
        console.log("[MyOWA] createNotification() is called. title : "+_title + " body : "+_body + " tabId : "+_myTabId);
        chrome.runtime.sendMessage( {
            "method":   "notification", 
            "title": _title,
            "body": _body,
            "windowId": _myWindowId,
            "tabId": _myTabId
        });
    }

    //////////////////////////////////////////////////////
    //////////////////////////////////////////////////////
    //////////////////////////////////////////////////////

    function _updateOptionsFromSettings( __callback ) {
        var optionsKeys = new Array();

        for(var key in _options) {
            optionsKeys.push(key);
        }
        for(var key in _settings) {
            optionsKeys.push(key);
        }

        chrome.storage.sync.get( optionsKeys, function( optionValues ) {
            console.log("[MyOWA] updateOptionsFromSettings() chrome.storage.sync.get : called");

            for(var key in optionValues ) {
                if( key !== "folderColors" ) {
                    console.log("[MyOWA] updateOptionsFromSettings() Updating local option value from " + _options[key] + " to " + key + ": " + optionValues[key] + " typeof " + typeof(optionValues[key]));
                    _options[ key ] = optionValues[key];
                } else {
                    console.log("[MyOWA] updateOptionsFromSettings() Updating local option value from " + _settings[key] + " to " + key + ": " + optionValues[key] + " typeof " + typeof(optionValues[key]));
                    _settings[ key ] = JSON.parse( optionValues[ key ] );
                }
            }

            __callback();
        } );
    } 


    //////////// Public
    var Klass = function() {
    };

    Klass.prototype.startup = function( __editor ) {
        _startup( __editor );

        chrome.extension.onRequest.addListener(
            function(request, sender, sendResponse) {
                console.log("[MyOWA] onRequest() got a request : request.action = " + request.action );
                
                 if( request.action == "getMode" ) {
                    var mode = _getMode();
                    sendResponse( {"mode": mode });

                } else if( request.action == "markSR" ) {

                } 

            }
        );

        chrome.storage.onChanged.addListener(function(changes, namespace) {

            for(var key in changes) {
                _options[ key ] = changes[ key ].newValue;
                console.log("[MyOWA] onChanged:: "+　key+" is updated to "+ _options[ key ] );
            }

        });
    }

    return Klass;
})();
