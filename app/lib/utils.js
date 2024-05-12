var Utils = (function() {
    // Singleton
    var _instance;

    function _constructor() {

    // Private things
    var debug = true;
    
    var _cardTopMargin = 5;
    var _cardOffset = 12;

    var _cardNumber = 0;
    var _cardHeights = {};
    var _cardPrefix = "popupCard";
    var _cardMsgPrefix = "popupCardMsg";
    var _cardWidth = 400;
    var _cardHeight = 27;
    var _timeout = 1800;

    var _card_z_index = 500;

    function _getTopPosition( __marginTop ) {
        var topPosi = __marginTop;
        for(var index in _cardHeights ) {
            topPosi += _cardOffset + _cardHeights[index];
        }
        return topPosi;
    };

    function _saveCardHeight( __cardNumber, __cardHeight ) {
        console.log("[Utils] _saveCardHeight() _cardNumber:"+__cardNumber + " _cardHeight:"+__cardHeight);
        _cardHeights[ __cardNumber ] = __cardHeight;
        for(var key in _cardHeights) {
            console.log("[Utils] _saveCardHeight() key = " + key +" Height = " + _cardHeights[key]);
        }
    }

    function _getAndIncCardNumber() {
        console.log("getCardNumber  _cardNumber = " + _cardNumber);
        return _cardNumber++;
    }
    function _deleteCardHeight( __cardNumber ) {
        delete _cardHeights[ __cardNumber ];
    }
    function _getCardHeights( __callback ) {
        __callback( _cardHeights );
    }
    function _fadeOutCard(__cardNumber, __timeout) {
        $(document).ready( function(){
            setTimeout( function(){
                var cardId = "#"+_cardPrefix+__cardNumber;

                $( cardId ).fadeOut( 200, function() {
                    console.log("[Utils] _fadeOutCard() THE ELEMENT IS DELETED :" + __cardNumber);
                    _deleteCardHeight( __cardNumber );
                    $(this).remove();

                    var sumOfHeights = _cardTopMargin;
                    
                    _getCardHeights( function( heights ) {
                        for(var key in heights ) {
                            $( "#"+_cardPrefix+key ).animate({"top":sumOfHeights+"px" }, "fast");
                            sumOfHeights += _cardOffset + heights[ key ];
                        }

                    });
                });

            }, __timeout);
        });
    }
    // End of Private things.


    // Public things
    return {

        showPopupMessage: function( __message, __styles, __timeout ) {
            console.log("[Utils] showPopupMessage() called "+ __message);
            var timeout = (__timeout === undefined)? _timeout: __timeout;

            var cardWidth = _cardWidth;
            var cardHeight = _cardHeight;
            var cardNumber = _getAndIncCardNumber();
            if(debug) console.log("[Utils] showPopupMessage() cardNumber = "+ cardNumber);

            if( __styles != undefined && __styles.height != undefined ) { 
                if(debug) console.log("[Utils] showPopupMessage()  _styles.height = "+  __styles.height);
                cardHeight = parseInt( __styles.height );
            } else {
                if(debug) console.log("[Utils] showPopupMessage() height is not set in the argument.");
            }

            var topPosi = _cardTopMargin;
            topPosi = _getTopPosition(topPosi);
            if(debug) console.log("[Utils] showPopupMessage() topPosi = "+ topPosi);

            _saveCardHeight( cardNumber, cardHeight); 

            var cardId = _cardPrefix + cardNumber;
            var cardMsgId = _cardMsgPrefix + cardNumber;
            var cardStr = "<p id='"+cardId+"'><span><a><span id='"+cardMsgId+"'>"+__message+"</span></a></span></p>";
            if( $("body").size() > 0 ) {
                $("body").append( cardStr );
            } else {
                $("head").next().before( cardStr );
            }

            $("#"+cardId).css({
                "position":"fixed", 
                "top":topPosi+"px", 
                "margin-left": ($(window).width()/2 - cardWidth/2) + "px",
                "z-index": _card_z_index});
            $("#"+cardId+" a").css({
                "display":"block",
                "font":"12px/100% Verdana, Arial, Helvetica, sans-serif",
                "text-decoration":"none",
                "color":"white"});
            $("span#"+cardMsgId).css({
                "width": cardWidth+"px",
                "height": cardHeight+"px",
                "display": "block",
                "padding-top": "10px",
                "padding-left": "15px",
                "border-radius": "5px",
                "background-color": "darkgreen"});
            if( __styles ) $("span#"+cardMsgId).css( __styles );

            _fadeOutCard( cardNumber, timeout );

        },

        readFromStorage: function( __keyArray, __callback ) {
            chrome.storage.sync.get( __keyArray, function( readData ) {
                for(var key in readData) {
                    console.log("[Utils] readFromStorage() Got data: " + key + " with "+ readData[key] + " completed." );
                }
                __callback( readData );
            });
        },
        writeToStorage: function( __keyValueObject, __callback ) {
            chrome.storage.sync.set( __keyValueObject, function() {
                for(var key in __keyValueObject) {
                    console.log("[Utils] writeToStorage() Saving " + key + " with "+ __keyValueObject[key] + " completed." );
                }
                __callback();
            });
        }

    };
    // End of Public things.


    } // End of return;

    // To use this, call getInstance to get singleton
    return { 
        getInstance: function(_debug) {
            if( !_instance ) {
                _instance = _constructor();
            }
            if( !_debug ) {
                _instance.debug = _debug;
            }
            return _instance;
        }
    };

})();
