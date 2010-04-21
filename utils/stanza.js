//TODO Improve text tag handling, preserve sequence
require('proto');

var sys = require('sys');
var assert = require('assert');
var xml = require('libxmljs');
var log = require('./logging').log;

exports.Stanza = Stanza = function(name, attrs, text) {
    assert.ok(name);
    this.name = name;
    
    this.children = [];
    this.attrs = attrs || {};

    if( typeof(text) == "string" )
        this.appendChild(text);
    return this;
}

// public API
Stanza.prototype.appendChild = function(stanza) {
    if( typeof(stanza) != "string" ) {
        stanza._parent = this;
    }
    this.children.push(stanza);
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

// first child
Stanza.prototype.c = function(name) {
    for( var i = 0; i < this.children.length; ++i ) {
        var elt = this.children[i];
        if( typeof(elt) != "string" && name == elt.name ) {
            return elt;
        }
    }
    return null;
}

// all children
Stanza.prototype.cs = function(name) {
    return this.children.filter(function(elt) {
        return typeof(elt) != "string" && name == elt.name;
    });
}

// attribute
Stanza.prototype.a = function(name) {
    return this.attrs[name];
}

/* add or get text
 * add a new text node -> t("new text") -> returns the Stanza to allow
 * chaining
 * get -> t() -> returns all the text concatenated together
 * if there are XML children, there text is also taken
 * if you want the elements themselves too, use
 * content()
 */
Stanza.prototype.t = function() {
    if( typeof(arguments[0]) == "string" ) {
        this.appendChild(arguments[0]);
        return this;
    }
    else {
        var text = [];
        this.children.forEach(function(child) {
            if( typeof(child) == "string" )
                text.push(child);
            else
                text.push(child.t());
        });
        return text.join('');
    }
}

// clear all text nodes and set this one as the first child
Stanza.prototype.setText = function(text) {
    this.children = this.children.filter(function(elt) {
        return typeof(elt) != "string";
    });

    this.children.push(text);
}

Stanza.prototype.content = function() {
    return this.children.map(function(elt) {
        if( typeof(elt) == "string" )
            return elt;
        return elt.toString();
    }).join('');
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

    str += '>';

    var stanza = this;
    this.children.forEach(function(child) {
        if( typeof(child) == "string" ) {
            str += child;
        }
        else {
            str += child.toString();
        }
    });

    str += '</' + this.name + '>';
    return str;
}
