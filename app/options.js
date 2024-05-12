
var bgPage = chrome.extension.getBackgroundPage();
var editor = new MyOWAFolderColorEditor( bgPage );

$(document).ready( function() {

    $( 'input:checkbox[name^="switch_"]' ).change( function() {  
        _saveCheckboxOption( this );
    });

    $("#optionSaveButton").click( function(){
        editor.saveFolderColorConfig();
    });
    $("#optionCancelButton").click( function() {
        restore_settings();
    });

    editor.createColorEditor( $("#ColorEditor") );
    editor.addActionListeners();

    init_settings();
});


function init_settings(){
    restore_settings();
}
function restore_settings(){
    for(var key in bgPage.options ) {
        _restoreCheckboxOption( key );    
    }
    for(var key in bgPage.settings) {
        _restoreSettings( key );
    }
}
function _restoreCheckboxOption( _itemName ) {
    var option = bgPage.options[ _itemName ];

    console.log("_restoreCheckboxOption() Restoring option for " + _itemName + " : " + option + " - default: " + bgPage.options[ _itemName ] + " : typeof " + typeof(bgPage.options[ _itemName ]) );
    if( option ) {
        $('#'+_itemName).attr('checked', true);
    }
}
function _restoreSettings( _itemName ) {
    // First, fill values with default value.
    var setting = bgPage.settings[ _itemName ];

    $("#"+_itemName).val( setting );
    if( _itemName == "folderColors") {
        $("#"+_itemName).val( setting.replace(/\}\,/g, "},\n") );
        editor.buildColoringConfigTable( JSON.parse( setting ) );
    }

    // Then, overrite saved values from storage.
    Utils.getInstance().readFromStorage( _itemName, function( returnData ) {

        for(var key in returnData) {
            console.log("_restoreSettings() Restoring setting for " + key + " : " + returnData[key] + " : typeof " + typeof returnData[key] );
            $("#"+_itemName).val( returnData[key] );
            if( key == "folderColors") {
                $("#"+_itemName).val( returnData[key].replace(/\}\,/g, "},\n") );
                editor.buildColoringConfigTable( JSON.parse( returnData[key] ) );
            }    
        }
    });

}

// Whether Dispalying Operationa Records
function _saveCheckboxOption( _target ) {
    var itemName = $(_target).attr("id");
    var flag = $(_target).prop("checked");
    console.log( "_saveCheckboxOption() Saving checkbox info: item name = " + itemName + " val = " + flag );

    var value = {};
    value[ itemName ] = flag;
    bgPage.updateOption( value );
}

