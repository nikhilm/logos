require('proto');
var net = require("net");
var sys = require("sys");
var xml = require("libxmljs");
var events = require('events');
var Stanza = require('../utils/stanza').Stanza;
var log = require('../utils/logging').log;

var buildAttrs = function( attrs ) {
    var a = {};
    attrs.forEach( function(attr) {
        a[attr[0]] = attr[3];
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
    tag = new Stanza(elem, buildAttrs(attrs));
    
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
        last.appendChild(tag);
    }
},

exports.Parser.prototype.onCharacters = function(chars) {
    if( this._tagStack.length == 0 ) {
        return;
    }

    var top = this._tagStack[this._tagStack.length-1];
    if( !top.t() )
        top.t("");
    top.t( top.t() + chars );
},

exports.Parser.prototype.parse = function( data ) {
    this.parser.push( data );
}
