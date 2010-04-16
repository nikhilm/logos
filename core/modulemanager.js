var sys = require('sys');

var eventbus = require('core/eventbus').instance;

stanzaHandlers = {};

var stanzaHandler = function(session, stanza) {
    if( stanzaHandlers[stanza.name] ) {
        stanzaHandlers[stanza.name].forEach(function(func) {
            func(session, stanza);
        });
    }
}

eventbus.addListener("stanza", stanzaHandler);

exports.load = function(name) {
    require('../plugins/' + name);
}

// -----------------------
// API exposed to modules
// TODO: documentation

exports.hook = function(evt, f) {
    eventbus.addListener(evt, f);
}

exports.handleStanza = function(stanza_name, func) {
    if( !stanzaHandlers[stanza_name] )
        stanzaHandlers[stanza_name] = [];

    stanzaHandlers[stanza_name].push(func);
}
