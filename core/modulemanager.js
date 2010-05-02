var sys = require('sys');

var eventbus = require('core/eventbus').instance;

stanzaHandlers = {};
sessionHooks = {};

var stanzaHandler = function(session, stanza) {
    if( stanzaHandlers[stanza.name] ) {
        stanzaHandlers[stanza.name].forEach(function(func) {
            func(session, stanza);
        });
    }
}

var registerWithSession = function(session) {
    session.eventbus.addListener("stanza", stanzaHandler);
    Object.keys(sessionHooks).forEach(function(key) {
	sessionHooks[key].forEach(function(func) {
	    session.eventbus.addListener(key, func);
	});
    });
}

// -----------------------
// API exposed to modules
// TODO: documentation

exports.load = function(name) {
    require('../plugins/' + name);
}

exports.hook = function(evt, f) {
    eventbus.addListener(evt, f);
}

exports.hookSession = function(evt, f) {
    if(!sessionHooks[evt])
	sessionHooks[evt] = [];
    sessionHooks[evt].push(f);
}

exports.handleStanza = function(stanza_name, func) {
    if( !stanzaHandlers[stanza_name] )
        stanzaHandlers[stanza_name] = [];

    stanzaHandlers[stanza_name].push(func);
}


// ----------------------
// setup
eventbus.addListener("stanza", stanzaHandler);
eventbus.addListener("session-created", registerWithSession);
