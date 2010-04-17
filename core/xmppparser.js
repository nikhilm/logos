var net = require("net");
var sys = require("sys");
var xml = require("libxmljs");
var events = require('events');
var log = require('../utils/logging').log;

Function.prototype.bind = (function() {
  var _slice = Array.prototype.slice;
  return function(context) {
    var fn = this,
        args = _slice.call(arguments, 1);
    
    if (args.length) { 
      return function() {
        return arguments.length
          ? fn.apply(context, args.concat(_slice.call(arguments)))
          : fn.apply(context, args);
      }
    } 
    return function() {
      return arguments.length
        ? fn.apply(context, arguments)
        : fn.call(context);
    }; 
  }
})();

var buildAttr = function( attr ) {
    return { name : attr[0]
           , prefix : attr[1]
           , uri : attr[2]
           , value : attr[3]
           };
}

var buildAttrs = function( attrs ) {
    var a = {};
    attrs.forEach( function(i) {
        var attr = buildAttr( i );
        a[attr.name] = attr;
    } );
    return a;
}

var buildNS = function( ns ) {
    return { name: ns[1], prefix: ns[0] };
}

var buildNSes = function( nses ) {
    var a = {};
    nses.forEach( function(i) {
        var ns = buildNS( i );
        a[ns.name] = ns;
    } );
    return a;
}

/**
 * A XMPP parser
 * Assumes SASL handling is done
 *
 * Create an instance and add listeners
 * var p = new parser.Parser();
 * p.addListener( "streamOpen", function(attrs) { ... } )
 * p.addListener( "streamClose", function() { ... } )
 * p.addListener( "stanza", function( stanza ) { ... } );
 * p.addListener( "error", function( errmsg ) { ... } );
 *
 * // use
 * p.parse( data );
 */

exports.Parser = function() {
    this._streamOpen = false;
    this._tagStack = [];
    var self = this;
    this.parser = new xml.SaxPushParser( function(cb) {
        cb.onStartElementNS( self.startElement.bind(self) );
        cb.onEndElementNS( self.endElement.bind(self) );
        cb.onCharacters( self.onCharacters.bind(self) );
        cb.onError( self._errorHandler.bind(self) );
    } );
}

exports.Parser.prototype = Object.create(new events.EventEmitter());

exports.Parser.prototype._errorHandler = function( err ) {
    log( "debug", "Parser: parse error", err );
    this.emit( 'error', err, this._tagStack );
},

exports.Parser.prototype.startElement = function( elem, attrs, prefix, uri, namespaces ) {
    tag = {};
    tag.name = elem;
    tag.attrs = buildAttrs( attrs );
    tag.prefix = prefix;
    tag.uri = uri;
    
    if( namespaces.length == 0 ) {
        tag.xmlns = {};
    }
    else if( namespaces.length == 1 ) {
        tag.xmlns = buildNS(namespaces[0]);
    }
    else {
        tag.xmlns = buildNSes(namespaces);
    }

    if( elem == 'stream' && prefix == 'stream' ) {
        this._streamOpen = true;
        this.emit( 'streamOpen', tag );
        return;
    }

    if( !this._streamOpen ) {
        this.emit( 'error', 'stream-not-open' );
    }

    this._tagStack.push( tag );
},

exports.Parser.prototype.endElement = function( elem, prefix, uri ) {
    if( elem == 'stream' && prefix == 'stream' ) {
        this._streamOpen = false;
        this.emit( 'streamClosed' );
        return;
    }
    var tag = this._tagStack.pop();
    if( !tag ) {
        // big doo doo
        this.emit( 'error', 'invalid-xml' );
    }

    if( this._tagStack.length == 0 ) {
        // time to emit a stanza
        log( "debug", "Received stanza", tag.name );
        this.emit( 'stanza', tag );
    }
    else {
        // put this as the child of parent
        var last = this._tagStack[this._tagStack.length-1];
        if( !last.children )
            last.children = {};
        if( !last.children[tag.name] )
            last.children[tag.name] = tag;
    }
},

exports.Parser.prototype.onCharacters = function(chars) {
    if( this._tagStack.length == 0 ) {
        return;
    }

    var top = this._tagStack[this._tagStack.length-1];
    if( !top.text )
        top.text = "";
    top.text += chars;
},

exports.Parser.prototype.parse = function( data ) {
    this.parser.push( data );
}
