var sys = require('sys');
var xml = require('libxmljs');

var log = require('../utils/logging').log;
var module = require('../core/modulemanager');

var REGISTER_NS = 'jabber:iq:register';

module.hook('stream-features', function(session, features) {
    features.push("<register xmlns='http://jabber.org/features/iq-register'/>");
});

module.handleStanza('iq', function(session, stanza) {
        //TODO check if already authenticated
    if( stanza.children['query'] && stanza.children['query'].xmlns.name == REGISTER_NS ) {
        log("debug", "New registration request");
        var query = stanza.children['query'];
        var doc = new xml.Document();
        doc.node('iq', {type: 'result', id: stanza.attrs.id.value})
            .node('query', {xmlns: REGISTER_NS})
             .node('instructions', {}, 'localhost/palantir registration').parent()
             .node('username').parent()
             .node('password').parent();
        log("debug", "Sending ", doc.toString());
        session.write(doc.toString().replace(/^<?.*?>/, ''));
    }
});
