require('proto');

var sys = require('sys');
var assert = require('assert');
var xml = require('libxmljs');
var log = require('./logging').log;

exports.Stanza = Stanza = function(name, attrs, text) {
    assert.ok(name);
    this.name = name;
    
    this._children = {};
    this._attrs = attrs || {};
    this.text = text || "";
    return this;
}

// private API
Stanza.prototype._appendChild = function(stanza) {
    stanza._parent = this;
    if( typeof(this._children[stanza.name]) == 'undefined' ) {
        this._children[stanza.name] = stanza;
    }
    else if( Array.isArray(this._children[stanza.name]) ) {
        this._children[stanza.name].push(stanza);
    }
    else {
        this._children[stanza.name] = [ this._children[stanza.name] ];
        this._children[stanza.name].push(stanza);
    }
}

// public API
Stanza.prototype.tag = function(name, attrs, text) {
    var stanza = new Stanza(name, attrs, text);
    this._appendChild(stanza);
    return stanza;
}

Stanza.prototype.parent = function() {
    return this._parent;
}

Stanza.prototype.root = function() {
    var r = this;
    while( r._parent ) {
        r = r._parent;
    }
    return r;
}

// child
Stanza.prototype.c = function(name) {
    return this._children[name];
}

// attribute
Stanza.prototype.a = function(name) {
    return this._attrs[name];
}

/*
 * Returns a simple XML representation
 * with no <?xml ?>
 */
Stanza.prototype.toString = function() {
    var str = '<' + this.name;

    var attrs = this._attrs;
    Object.keys(attrs).forEach(function(attr) {
        str += ' ' + attr + '="' + attrs[attr] + '"';
    });

    str += '>' + this.text;

    var childKeys = Object.keys(this._children);

    var stanza = this;
    childKeys.forEach(function(tag) {
        if( Array.isArray(stanza._children[tag]) ) {
            stanza._children[tag].forEach( function(elt) {
                str += elt.toString();
            });
        }
        else {
            str += stanza._children[tag].toString();
        }
    });

    str += '</' + this.name + '>';
    return str;
}
