//TODO Improve text tag handling, preserve sequence
require('proto');

var sys = require('sys');
var assert = require('assert');
var xml = require('libxmljs');
var log = require('./logging').log;

exports.Stanza = Stanza = function(name, attrs, text) {
    assert.ok(name);
    this.name = name;
    
    this.children = {};
    this.attrs = attrs || {};
    this.text = text || "";
    return this;
}

// public API
Stanza.prototype.appendChild = function(stanza) {
    stanza._parent = this;
    if( typeof(this.children[stanza.name]) == 'undefined' ) {
        this.children[stanza.name] = stanza;
    }
    else if( Array.isArray(this.children[stanza.name]) ) {
        this.children[stanza.name].push(stanza);
    }
    else {
        this.children[stanza.name] = [ this.children[stanza.name] ];
        this.children[stanza.name].push(stanza);
    }
}
Stanza.prototype.tag = function(name, attrs, text) {
    var stanza = new Stanza(name, attrs, text);
    this.appendChild(stanza);
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
    return this.children[name];
}

// attribute
Stanza.prototype.a = function(name) {
    return this.attrs[name];
}

// set or get text
// set -> t("new text") -> returns the Stanza to allow
// chaining
// get -> t() -> returns the text
Stanza.prototype.t = function() {
    if( typeof(arguments[0]) == "string" ) {
        this.text = arguments[0];
        return this;
    }
    else {
        return this.text;
    }
}

/*
 * Returns a simple XML representation
 * with no <?xml ?>
 */
Stanza.prototype.toString = function() {
    var str = '<' + this.name;

    var attrs = this.attrs;
    Object.keys(attrs).forEach(function(attr) {
        str += ' ' + attr + '="' + attrs[attr] + '"';
    });

    str += '>' + this.text;

    var childKeys = Object.keys(this.children);

    var stanza = this;
    childKeys.forEach(function(tag) {
        if( Array.isArray(stanza.children[tag]) ) {
            stanza.children[tag].forEach( function(elt) {
                str += elt.toString();
            });
        }
        else {
            str += stanza.children[tag].toString();
        }
    });

    str += '</' + this.name + '>';
    return str;
}
