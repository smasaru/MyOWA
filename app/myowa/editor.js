
var MyOWAFolderColorEditor = (function(){
    ///////////// Private //////////////
    var _isTableEditing = false;
    var _configKey = "folderColors";
    var _bgPage = undefined;

    var _el = {

        clsTblFolderName:       "folderName", 
        clsTblDivFolderName:    "folderNameDiv",
        clsTblInputFolderName:  "folderNameEdit",

        clsTblFolderColor:      "fontColor",
        clsTblDivFolderColor:   "fontColorDiv",
        clsTblInputFolderColor: "fontColorEdit",
        
        clsTblFolderBgColor:    "bgColor",
        clsTblDivFolderBgColor: "bgColorDiv",
        clsTblInputFolderBgColor: "bgColorEdit",

        clsTblCheckboxFolderBold:   "fontBoldCheckbox",
        clsTblCheckboxFolderItalic: "fontItalicCheckbox",


        idTblInSubwindowColorConfig: "simpleFolderColorsConfig",
    };
    // private methods

    /////////// Actions
    ///////////////////
    function _enableInputMode( _parentJQNode ) {
        _parentJQNode.find("."+_el.clsTblDivFolderName).css("display","none");
        _parentJQNode.find("."+_el.clsTblInputFolderName).css("display","inline");
        _isTableEditing = true;
    }
    function _disableInputMode( _parentJQNode ) {
        _parentJQNode.find("."+_el.clsTblDivFolderName).css("display","");
        _parentJQNode.find("."+_el.clsTblInputFolderName).css("display","none");
        _isTableEditing = false;
    }
    function _commitFolderNameChange() {
        console.log("commitFolderNameChange() _isTableEditing = "+ _isTableEditing);
        if( _isTableEditing ) {
            var jQFolderNameEdit = $( "."+_el.clsTblInputFolderName );
            var edit, editP;
            for(var i=0; i<jQFolderNameEdit.length; i++) {
                edit = jQFolderNameEdit.eq(i);

                if( edit.css("display") != "none" ) {
                    editP = edit.parent();
                    editP.find("."+_el.clsTblDivFolderName).text( edit.val() );
                    _disableInputMode(editP);
                    _updateFolderColorTextarea();
                }

            }
        }
    }

    // view related
    function _addColoringConfigTr(_table, _colorConfig, _isDeleteTrue) {
        if( _colorConfig == undefined ) {
            _colorConfig = _getDefaultColoringConfig();
        }
        if( _isDeleteTrue == undefined ) {
            _isDeleteTrue = false;
        }


        var trStr = _getColoringConfigTr( _colorConfig, _isDeleteTrue );
        _table.append( trStr );

        var addedTr = _table.find("tr:last");
        
        addedTr.find("."+_el.clsTblInputFolderColor).colorpicker({ color: _colorConfig.color });
        addedTr.find("."+_el.clsTblInputFolderBgColor).colorpicker({ color: _colorConfig["background-color"] });

        if(_isDeleteTrue) {
            addedTr.find("."+_el.clsTblDivFolderName).on("click", function(e) {
                e.stopPropagation();

                console.log("clicked!" + $( e.target ).text() );
                var jQtarget = $(e.target);
                _enableInputMode(jQtarget.parent() );
            });            
        }

        ///// Color picker //////
        addedTr.find("."+_el.clsTblInputFolderColor).parent().css({"width":"55px"});
        addedTr.find("."+_el.clsTblInputFolderColor).on("change.color", function(event, color){
            console.log("fontColorEdit changed!");
            var parentTr = $(event.target).parents("tr");
            parentTr.find("."+_el.clsTblDivFolderColor).css("color",color).text( color );
            _updateSampleCellColor(parentTr);
        });

        addedTr.find("."+_el.clsTblInputFolderBgColor).parent().css({"width":"55px"});
        addedTr.find("."+_el.clsTblInputFolderBgColor).on("change.color", function(event, color){
            console.log("bgColorEdit changed!");
            var parentTr = $(event.target).parents("tr");
            parentTr.find("."+_el.clsTblDivFolderBgColor).css("color",color).text( color );
            _updateSampleCellColor(parentTr);
        });

        addedTr.find("."+_el.clsTblCheckboxFolderBold).click( function(e){
            var flag = $(e.target).prop("checked");
            console.log("fontBoldCheck changed! " + flag);

            var parentTr = $(event.target).parents("tr");
            _updateSampleCellColor(parentTr);
        });
        addedTr.find("."+_el.clsTblCheckboxFolderItalic).click( function(e){
            var flag = $(e.target).prop("checked");
            console.log("fontItalicCheck changed! " + flag);

            var parentTr = $(event.target).parents("tr");
            _updateSampleCellColor(parentTr);
        });

        if(_isDeleteTrue) {
            addedTr.find(".delete").click( function(e){
                $(this).parent().fadeOut( 500, function() {
                    $(this).remove();
                    _updateFolderColorTextarea();
                });
            });            
        }
    
        _updateSampleCellColor( addedTr );
    }
    function _getDefaultColoringConfig() {
        return {"folderName":"Folder Name", "color":"black", "background-color": "white", "font-weight":"", "font-style":""};
    }


    /////////// Views
    ///////////////////

    function _createColorEditor( __jqElement ) {
        var str = "";
        str+= "<div>";
        str+= "    <div id='simpleFolderColorsConfig'>";
        str+= "        <table id='folderColoringConfigTable' style='float: left'>";
        str+= "        </table>";
        str+= "        <button id='switchToAdvancedConfig' style='float: left'>Advanced view &gt;&gt;</button>";

        str+= "        <div style='clear: both'></div>";
        str+= "        <div id='addFolderColor'>";
        str+= "            <button id='addFolderColorBtn'>Add</button>";
        str+= "        </div>";
        str+= "    </div>";

        str+= "    <div id='advancedFolderColorsConfig' style='display: none'>";
        str+= "        <div>";
        str+= "            <textarea id='folderColors' style='display: inline; height: 150px; width: 90%;'></textarea>";
        str+= "            <button id='switchToSimpleConfig'>&lt;&lt; Close Advanced</button>";
        str+= "        </div>";
        str+= "    </div>";
        str+= "</div>";

        /*
        str+= "<div class='subitem'>";
        str+= "    <div>";
        str+= "        <button id='optionSaveButton'>Save</button>";
        str+= "        <button id='optionCancelButton'>Cancel</button>";
        str+= "    </div>";
        str+= "    <div id='status'></div>";
        str+= "</div>";
        */

        __jqElement.append( str );
    }

    function _buildColoringConfigTable( __folderConfig) {
        var table = $("#folderColoringConfigTable");
        var isDeleteTrue = true;
        var tableHeaderStr = _getColoringConfigTh( isDeleteTrue );

        table.html("");
        table.append( tableHeaderStr );

        var trStr;
        for(var key in __folderConfig) {
            _addColoringConfigTr( table, __folderConfig[key], true);
        }
    }
    function _getColoringConfigTh( __isDeleteTrue) {
        if(__isDeleteTrue == undefined) {
            __isDeleteTrue = false;
        }
        var tableHeaderStr = "<tr>";
        tableHeaderStr += "<th>Folder name</th><th>text</th><th>background</th><th>bold</th><th>italic</th>";
        tableHeaderStr += (__isDeleteTrue)? "<th></th>":"";
        tableHeaderStr += "</tr>";
        return tableHeaderStr;
    }
    function _getColoringConfigTr( _colorConfig, __isDeleteTrue) {
        if(__isDeleteTrue == undefined) {
            __isDeleteTrue = false;
        }
        var trStr = "";
        trStr = "<tr class='folderColor'>";

        trStr += "<td class='folderName'>";
        trStr +=     "<div class='"+_el.clsTblDivFolderName+"'>"+_colorConfig.folderName+"</div>";
        trStr +=     "<input type='text' class='"+_el.clsTblInputFolderName+"' value='"+_colorConfig.folderName+"'/>";
        trStr += "</td>";

        trStr += "<td class='fontColor'>";
        trStr +=     "<div class='"+_el.clsTblDivFolderColor+"'>"+_colorConfig.color+"</div>";
        trStr +=     "<input type='text' class='"+_el.clsTblInputFolderColor+"' />";
        trStr += "</td>";

        trStr += "<td class='bgColor'>";
        trStr +=     "<div class='"+_el.clsTblDivFolderBgColor+"'>"+_colorConfig["background-color"]+"</div>";
        trStr +=     "<input type='text' class='"+_el.clsTblInputFolderBgColor+"' />";
        trStr += "</td>";

        trStr += "<td class='fontBold'>";
        trStr +=     "<input type='checkbox' class='"+_el.clsTblCheckboxFolderBold+" tableCheckbox'";
        trStr += (_colorConfig["font-weight"] != undefined && _colorConfig["font-weight"] == "bold")? "checked='checked'":'';
        trStr += " />";
        trStr += "</td>";

        trStr += "<td class='fontItalic'>";
        trStr +=     "<input type='checkbox' class='"+_el.clsTblCheckboxFolderItalic+" tableCheckbox'";
        trStr += (_colorConfig["font-style"] != undefined && _colorConfig["font-style"] == "italic")? "checked='checked'":'';
        trStr += " />";
        trStr += "</td>";
        trStr += (__isDeleteTrue)? "<td class='delete'>Del</td>":"";
        trStr += "</tr>";

        return trStr;
    }


    function _updateSampleCellColor(_jqTr) {
        var folderNameCell = _jqTr.find("."+_el.clsTblFolderName);
        var myCss = _getColoringCss(_jqTr);

        console.log("_updateSampleCellColor() "+folderNameCell.text() );
        folderNameCell.css( myCss );
    }


    function _saveSimpleFolderColorTable() {
        var dfd = $.Deferred();

        var folderColor = _getCurrentFolderColoringConfig()[0];

        Utils.getInstance().readFromStorage( "folderColors", function( readData ){
            var folderColorsStr = readData["folderColors"];
            var folderColors = JSON.parse( folderColorsStr );

            var fc, isExistingConfig = false;
            for(var key in folderColors) {
                fc = folderColors[key];
                if( (fc.folderId != undefined && fc.folderId == folderColor.folderId)
                    || (fc.folderName == folderColor.folderName) ) {
                    folderColors[key] = folderColor;
                    isExistingConfig = true;
                    break;
                }
            }

            if( !isExistingConfig ) {
                folderColors.push( folderColor );
            }


            var newFolderColors = {"folderColors": JSON.stringify( folderColors ) };
            console.log("_saveSimpleFolderColorTable() saved new folderColors to storage.");

            Utils.getInstance().writeToStorage( newFolderColors, function(){
                dfd.resolve();
                Utils.getInstance().showPopupMessage("Folder color is saved.");
            })

        });

        return dfd.promise();
    }


    // return folderColors[]
    function _getCurrentFolderColoringConfig() {
        var jQTrs = $("#folderColoringConfigTable").find("tr.folderColor");
        var folderColors = new Array();
        var folderColor;
        for(var i=0; i< jQTrs.length; i++) {
            var line = jQTrs.eq(i);
            folderColor = _getColoringCss(line);
            folderColor["folderName"]   = line.find("."+_el.clsTblDivFolderName).text();
            folderColors.push( folderColor );
        }
        return folderColors;
    }
    function _getColoringCss( _jQTr ) {
        var fontColor  = _jQTr.find( "."+_el.clsTblFolderColor ).text();
        var bgColor    = _jQTr.find( "."+_el.clsTblFolderBgColor ).text();
        var fontBold   = _jQTr.find( "."+_el.clsTblCheckboxFolderBold ).prop("checked");
        var fontItalic   = _jQTr.find( "."+_el.clsTblCheckboxFolderItalic ).prop("checked");

        var myCss = {"color":fontColor, "background-color":bgColor};
        if(fontBold) {
            myCss["font-weight"] = "bold";
        } else {
            myCss["font-weight"] = "";
        }
        if(fontItalic) {
            myCss["font-style"] = "italic";
        } else {
            myCss["font-style"] = "";
        }

        return myCss;
    }

    function _updateFolderColorTextarea() {
        console.log("_updateFolderColorTextarea() is called.");

        var folderColors = _getCurrentFolderColoringConfig();
        var folderColorsStr = JSON.stringify( folderColors ).replace(/},/g, "},\n");

        $("#folderColors").val(folderColorsStr);
    }



    //////////////////////////////////////////
    ////////////////// Public ////////////////

    // Constructor
    var Klass = function( __bgPage ) {
        _bgPage = __bgPage;
    };

    // public methods

    Klass.prototype.addActionListeners = function() {

        $("body").click( function(e){
            e.stopPropagation();
            if( $(e.target).hasClass("folderNameEdit") ) {
                console.log("folderNameEdit!!");
                return;
            }

            _commitFolderNameChange();
        });

        $("#addFolderColorBtn").click( function() {
            var table = $("#folderColoringConfigTable");
            _addColoringConfigTr(table, undefined, true);
        });

        $("#switchToSimpleConfig").click( function() {
            $( "#"+_el.idTblInSubwindowColorConfig ).css("display","block");
            $("#advancedFolderColorsConfig").css("display","none");
        });
        $("#switchToAdvancedConfig").click( function() {
            $( "#"+_el.idTblInSubwindowColorConfig ).css("display","none");
            $("#advancedFolderColorsConfig").css("display","block");
        });
    }

    Klass.prototype.createColorEditor = function( __jqElement ) {
        _createColorEditor( __jqElement );
    };

    Klass.prototype.buildColoringConfigTable = function( __folderConfig) {
        _buildColoringConfigTable( __folderConfig );
    };
    Klass.prototype.buildSimpleColoringConfigTable = function( __folderName, __folderId, __folderConfig ) {
        if(__folderConfig == undefined) {
            __folderConfig = _getDefaultColoringConfig();
        }
        var table = $( "#"+_el.idTblInSubwindowColorConfig );
        var isDeleteTrue = false;
        var tableHeaderStr = _getColoringConfigTh( isDeleteTrue );

        __folderConfig["folderName"] = __folderName;

        table.html("");
        table.append( tableHeaderStr );
        _addColoringConfigTr( table, __folderConfig );
    };

    Klass.prototype.saveFolderColorConfig = function(){
        var settings = {};

        // First save value from textarea

        // Then, overwrite it with table configuration if the table is displayed.
        if( $( "#"+_el.idTblInSubwindowColorConfig ).css("display") == "none" ) {
            var textConfig = $("#"+"folderColors").val();
            if( textConfig != ""){
                settings[ "folderColors" ] = textConfig;
                console.log("saveFolderColorConfig() new folderColors from textarea "+ textConfig );  
            } 

            _buildColoringConfigTable( JSON.parse(textConfig) );
        } else {
            _commitFolderNameChange();

            var folderColors = _getCurrentFolderColoringConfig();
            var newFolderColors = JSON.stringify( folderColors );
            console.log("saveFolderColorConfig() new folderColors from config table = " + newFolderColors );
            settings[ "folderColors" ] = newFolderColors;
        }

        Utils.getInstance().writeToStorage( settings );

        _updateFolderColorTextarea();

        Utils.getInstance().showPopupMessage("Changes are saved.");
    }

    Klass.prototype.saveSingleFolderColorConfig = function(){
        return _saveSimpleFolderColorTable();
    }


    return Klass;
})();
