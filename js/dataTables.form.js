/**
 * Created by xiaoyao9184 on 2016/1/19.
 */

(function( factory ){
    if ( typeof define === 'function' && define.amd ) {
        // AMD
        define( ['jquery', 'datatables.net'], function ( $ ) {
            return factory( $, window, document );
        } );
    }
    else if ( typeof exports === 'object' ) {
        // CommonJS
        module.exports = function (root, $) {
            if ( ! root ) {
                root = window;
            }

            if ( ! $ || ! $.fn.dataTable ) {
                $ = require('datatables.net')(root, $).$;
            }

            return factory( $, root, root.document );
        };
    }
    else {
        // Browser
        factory( jQuery, window, document );
    }
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;


// Used for namespacing events added to the document by each instance, so they
// can be removed on destroy
var _instCounter = 0;

// Button namespacing counter for namespacing events on individual buttons
var _buttonCounter = 0;

var _dtForm = DataTable.ext.form;

/**
 * [Buttons description]
 * @param {[type]}
 * @param {[type]}
 */
var Form = function( dt, config )
{
    // Allow a boolean true for defaults
    if ( config === true ) {
        config = {};
    }

    if( typeof config == "string"){
        config = { jSelect: [config] };
    }

    // For easy configuration of buttons an array can be given
    if ( $.isArray( config ) ) {
        config = { jSelect: config };
    }

    this.c = $.extend( true, {}, Form.defaults, config );

    // Don't want a deep copy for the buttons
    if ( config.jSelect ) {
        this.c.jSelect = config.jSelect;
    }

    this.s = {
        dt: new DataTable.Api( dt ),

        //just i use
        useForm: false,
        form: null,
        widgetCount: 0,
        widgets: {},
        buttons: [],
        subButtons: [],
        listenKeys: '',
        namespace: 'dtf'+(_instCounter++)
    };

    //XY:no support dom
    //this.dom = {
    //    container: $('<'+this.c.dom.container.tag+'/>')
    //        .addClass( this.c.dom.container.className )
    //};

    this._constructor();
};

$.extend( Form.prototype, {



    /**
     * Destroy the instance, cleaning up event handlers and removing DOM
     * elements
     * @return {Buttons} Self for chaining
     */
    destroy: function ()
    {
        // Key event listener
        $('body').off( 'keyup.'+this.s.namespace );

        // Individual button destroy (so they can remove their own events if
        // needed
        var form = this.s.form;
        var widgets = this.s.widgets;
        //var i, ien, j, jen;
        //
        //for ( i=0, ien=widgets.length ; i<ien ; i++ ) {
        //    //this.removePrep( i );
        //
        //    for ( j=0, jen=widgets[i].length ; j<jen ; j++ ) {
        //        //this.removePrep( i+'-'+j );
        //    }
        //}
        //
        //this.removeCommit();
        //
        //// Container
        //this.dom.container.remove();
        //
        //// Remove form the settings object collection
        //var buttonInsts = this.s.dt.settings()[0];
        //
        //for ( i=0, ien=buttonInsts.length ; i<ien ; i++ ) {
        //    if ( buttonInsts.inst === this ) {
        //        buttonInsts.splice( i, 1 );
        //        break;
        //    }
        //}

        return this;
    },

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * Constructor
     */

    /**
     * Form constructor
     * @private
     */
    _constructor: function ()
    {
        var that = this;
        var dt = this.s.dt;
        var dtSettings = dt.settings()[0];

        if ( ! dtSettings._form ) {
            dtSettings._form = [];
        }

        dtSettings._form.push( {
            inst: this,
            name: this.c.name
        } );

        this._buildFormWidget( this.c.jSelect );

        dt.on( 'destroy', function () {
            that.destroy();
        } );

        dt.on( 'preXhr.dt', function( e, settings, data ) {
            //create data form form or widgets
            var formData = that._createData();
            //push form data to datatables postback data
            if( that.c.dataInForm ){
                data.form = formData;
            }else{
                $.extend( true, data, formData );
            }
        });

        //XY:no need
        //// Global key event binding to listen for button keys
        //$('body').on( 'keyup.'+this.s.namespace, function ( e ) {
        //    if ( ! document.activeElement || document.activeElement === document.body ) {
        //        // SUse a string of characters for fast lookup of if we need to
        //        // handle this
        //        var character = String.fromCharCode(e.keyCode).toLowerCase();
        //
        //        if ( that.s.listenKeys.toLowerCase().indexOf( character ) !== -1 ) {
        //            that._keypress( character, e );
        //        }
        //    }
        //} );
    },

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * Private methods
     */

    /**
     * add Form or Widget form Jquery Select
     * @param jqSelect {string}{array} Jquery Select Widget Array
     * @returns {id: widget,id:[widget]}:object
     * @private
     */
    _buildFormWidget: function( jqSelect ){
        var that = this;
        if( this.s.form === null && this.s.widgetCount != 0 ){
            this.s.useForm = false;
        }else if( this.s.form != null && this.s.widgetCount === 0 ){
            this.s.useForm = true;
        }else if( this.s.form === null && this.s.widgetCount === 0 ){
            var jSelectArray = [];
            if( !$.isArray( jqSelect ) ){
                jSelectArray.push( jqSelect );
            }else{
                jSelectArray = jqSelect;
            }

            $.each( jSelectArray, function( index,jSelectOne ) {
                if( typeof jSelectOne == "string" ){
                    //dont named data key
                    var widget = $( jSelectOne );
                    if(widget.prop("tagName") == 'FORM'){
                        that._addForm( widget );
                    }else{
                        that._addWidget( null,widget );
                    }
                }else if( typeof jSelectOne == "object" ){
                    //named data key
                    $.each(jSelectOne, function( name,jSelect ){
                        //get name and widget
                        var widget = $( jSelect );
                        that._addWidget( name,widget );
                    });
                }
            });
        }
    },

    /**
     * add From
     * @param form
     * @private
     */
    _addForm: function( form ){
        var that = this;
        that.s.form = form;
        //fuck Action
        form.on("submit",function(ev){
            //use datatables ajax data
            that.s.dt.ajax.reload();

            //not use fuck form action
            ev.preventDefault();
        });
        if(this.c.useFromAction){
            //get form action&method and set to dt.setting
            var s = this.s.dt.settings()[0];
            var a = form.prop('action');
            var m = form.prop('method');
            var op = {
                ajax:{}
            };
            var flag = false;
            if( typeof a != 'undefined' ){
                op.ajax.url = a;
                flag = true;
            }
            if( typeof m != 'undefined' ){
                op.ajax.type = m;
                flag = true;
            }
            if( flag ){
                $.extend( true,s,op );
            }
        }
    },

    /**
     * add Widget to widget list
     * @param name
     * @param widget
     * @private
     */
    _addWidget: function( name, widget ){
        if( name === null){
            if( this.c.dataKeyUseId ){
                name = widget.prop( 'id' );
            }else{
                name = widget.prop( 'name' );
            }
        }
        if( name === null ){
            //no name widget no postback
        }else{
            var a = {};
            a[name] = widget;
            this.s.widgetCount ++;
            $.extend(true,
                this.s.widgets,
                a
            );
        }
    },

    /**
     * serialize Form or Widget data and to JsonObject
     * @returns {*}
     * @private
     */
    _createData: function() {
        var that = this;
        //just want to validation

        if( that.s.form == null && that.s.widgetCount == 0 ){

        }else if( that.s.form != null && that.s.widgetCount == 0 ){
            return this._createFormData();
        }else if( that.s.form == null && that.s.widgetCount != 0 ){
            return this._createWidgetData();
        }else if( that.s.form != null && that.s.widgetCount != 0 ){
            return this._createWidgetData();
        }
    },

    /**
     * serialize Form data and to JsonObject
     * @returns {*}
     * @private
     */
    _createFormData: function() {
        var that = this;
        var data = {};
        var str = this.s.form.serialize();

        var strArray = str.split( '&' );

        $.each( strArray,function( index,value ){
            var p = value.indexOf( '=' );
            var k = value.substring( 0,p );
            var v = value.substring( p + 1 );
            if( v === '' && that.c.dataIgnoreEmpty ){
                //Ignore empty data
            }else{
                if( typeof data[k] == "undefined" ){
                    var one = {};
                    one[k] = v;
                    $.extend( true,
                        data,
                        one
                    );
                }else{
                    data[k] = data[k] + ',' + v;
                }
            }
        } );

        return data;
    },

    /**
     * serialize Widget data and to JsonObject
     * @returns {*}
     * @private
     */
    _createWidgetData: function() {
        var that = this;
        var result = {};

        $.each( that.s.widgets, function( key, widgets ) {
            var fun = that.c.widgetFun[that.c.widgetType];
            if( widgets.length > 0 ){
                var v = '';
                $.each( widgets, function( index,widget ) {
                    var value = fun( widget );
                    if(value == null || typeof value == 'undefined'){
                        //No value in this widget
                    }else{
                        v = v + ' ' + value;
                    }
                } );
                v = v.replace(/(^\s*)|(\s*$)/g, '').replace(/ /g, ',');
                if( v === '' && that.c.dataIgnoreEmpty ){
                    //Ignore empty data
                }else{
                    var group = {};
                    group[key] = v;
                    $.extend( true,result,group );
                }
            }
        } );

        return result;
    }

});

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Statics
 */

/**
 * get value form widget
 * @param id {string}{object} id或jq对象
 * @returns {null} if not exist; {id: value} INPUT:checkbox/radio no value will return {id: id}
 * @private
 */
Form.getHtmlWidget = function(domWidget){
    var widget = $(domWidget);
    var tagName = widget.prop("tagName");
    var value = null;
    if(tagName == 'INPUT'){
        var t = widget.prop("type");
        if(t == 'checkbox' || t == 'radio'){
            if(widget.is(":checked")){
                if(widget.val() == 'on'){
                    //no value use id replace value
                    value =  id;
                }else{
                    value = widget.val();
                }
            }else{
                return undefined;
            }
        }else{
            value = widget.val();
        }
    }else if(tagName == 'SELECT'){
        value = widget.val();
    }else{
        value = widget.val();
    }

    return value;
};

/**
 * add function to funcion mapping for process get widget value
 * @param keyValue {object} like this {key{string},value{function}}
 */
Form.addWidgetHander = function( keyValue ){
    var check = {
        widgetFun: {}
    };
    if( typeof keyValue === "object" ){
        $.each( keyValue,function( index,value ){
            if( $.isFunction(value) ){
                $.extend( true,Form.check.widgetFun,{
                    index: value
                } );
            }
        } );
    }
    $.extend( true,Form.defaults,check );
};



/**
 * Form defaults.
 * @type {Object}
 * @static
 */
Form.defaults = {
    name: 'main',
    tabIndex: 0,
    //setting
    jSelect: 'form:first',
    useFromAction: true,
    dataKeyUseId: false,
    dataIgnoreEmpty: true,
    dataInForm: false,
    //funcion mapping
    widgetType: 'Html',
    widgetFun: {
        Html: Form.getHtmlWidget
    },
    //event
    //onCreateForm: null
};


/**
 * Version information
 * @type {string}
 * @static
 */
Form.version = '0.0.1-dev';



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables interface
 */

// Attach to DataTables objects for global access
$.fn.dataTable.Form = Form;
$.fn.DataTable.Form = Form;



// DataTables creation - check if the buttons have been defined for this table,
// they will have been if the `B` option was used in `dom`, otherwise we should
// create the buttons instance here so they can be inserted into the document
// using the API. Listen for `init` for compatibility with pre 1.10.10, but to
// be removed in future.
//$(document).on( 'init.dt plugin-init.dt', function (e, settings, json) {
//    if ( e.namespace !== 'dt' ) {
//        return;
//    }
//
//    var opts = settings.oInit.form || DataTable.defaults.form;
//
//    if ( opts && ! settings._form ) {
//        new Form( settings, opts );//.container();
//    }
//} );

$(document).on( 'preInit.dt', function (e, settings, json) {
    if ( e.namespace !== 'dt' ) {
        return;
    }

    var opts = settings.oInit.form || DataTable.defaults.form;

    if ( opts && ! settings._form ) {
        new Form( settings, opts );//.container();
    }
} );


// DataTables `dom` feature option
//DataTable.ext.feature.push( {
//    fnInit: function( settings ) {
//        var api = new DataTable.Api( settings );
//        var opts = api.init().buttons || DataTable.defaults.buttons;
//
//        return new Buttons( api, opts ).container();
//    },
//    cFeature: "B"
//} );


return Form;
}));