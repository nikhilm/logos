require('proto');

var sys = require('sys');
var Stanza = require('./stanza').Stanza;
var log = require('./logging').log;

/*
 * This validation framework extends
 * Stanzas to be validated in a declarative
 * manner by defining an object literal
 * with various attributes to which the schema must conform.
 *
 * You can use regular expressions in the validation
 * rules. Validation objects try to use the same
 * names as the Stanza properties. Note that validation
 * is not *restricted* to the schema. If the Stanza has
 * extra children or attributes these will be allowed through.
 *
 * For example:
 *
 * // actually the Stanza will probably come over
 * // the wire and be parsed somehow
 * var s = new Stanza("root", {...}, "text");
 * s.tag("Do more stuff", {...}, "text2");
 *
 * TODO : Finish this
 * if( s.valid({ name: "root"
 * 		,attrs: { "xmlns" :
 */

/*
 * Returns true if the validation matched
 * If it failed, there is currently no
 * way to get an error message. If you really
 * want an error message, try to think of a way
 * to return it while still asserting falseness
 * and not returning an object literal.
 *
 * The error will be logged if debug mode is on though.
 */

// decides what to do based on regex/string/function
Stanza.prototype._equal = function(pat, text) {
    // NOTE order of checking of regex then function
    // is important since a regex is a function.
    if( typeof(pat) == "string" ) {
	return pat == text;
    }
    else if( pat.exec ) {
	return pat.test(text);
    }
    else if( typeof(pat) == "function" ) {
	return pat(text);
    }
}

Stanza.prototype.valid = function(schema) {
    var self = this;
    if( schema.name && !this._equal(schema.name, this.name) ) {
	log("debug", "Tag name error: Actual '" + this.name + "'. Expected '" + schema.name + "'");
	return false;
    }

    if( schema.attrs ) {
	var keys = Object.keys(schema.attrs);
	for( var i = 0; i < keys.length; ++i ) {
	    var attrName = keys[i];
	    var attr = self.a(attrName);

	    if( !attr ) {
		log("debug", "Attribute validation for tag " + self.name + " FAILED: No such attribute '" + attrName +"'");
		return false;
	    }
	    if( !self._equal(schema.attrs[attrName], attr) ) {
		log("debug", "Attribute validation for tag " + self.name + " FAILED: Attribute: '" + attrName + "'. Actual value '" + attr + "'. Expected '" + schema.attrs[attrName] + "'");
		return false;
	    }
	}
    }

    if( schema.children ) {
	for( var i = 0; i < schema.children.length; ++i ) {
	    var cSchema = schema.children[i];
	    var c = self.cs(cSchema.name);
	    if( c.length == 0 ) {
		log("debug", "No such child: Tag '" + self.name + "' has NO child '" + cSchema.name);
		return false;
	    }

	    // we may have multiple children
	    // try to match against each.
	    // If all FAIL, we FAIL
	    // otherwise we pass
	    if( Array.isArray(c) ) {
		var results = [];
		c.forEach(function(child) {
		    results.push( child.valid(cSchema));
		});
		return results.some(function(elt) { return elt; });
	    }
	    else if( !c.valid(cSchema) ) {
		return false;
	    }
	}
    }

    if( schema.text ) {
	if( !this.t() ) {
	    log("debug", "Expected text: Tag '" + this.name + "' expected text " + schema.text);
	    return false;
	}
	if( !this._equal(schema.text, this.t()) ) {
	    log("debug", "Text match failed: Text of tag '" + this.name + "' does not match expected pattern " + schema.text);
	    return false;
	}
    }

    return true;
}

Stanza.prototype.validAttrs = function(schema) {
}

Stanza.prototype.validText = function(schema) {
}
