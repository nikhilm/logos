var sys = require('sys');

var log = require('../utils/logging').log;
var module = require('../core/modulemanager');
var Stanza = require('../utils/stanza').Stanza;
require('../utils/validation');

var BIND_NS = 'urn:ietf:params:xml:ns:xmpp-bind';

module.hookSession('stream-features', function(session, features) {
    features.push('<bind xmlns="' + BIND_NS + '"/>');
});

module.handleStanza('iq', function(session, stanza) {
    log("debug", "mod_bind:", stanza.toString());
    if( session.bound ) {
        return true;
    }

    var schema = {
     attrs: { type: 'set' }
        ,children: [
            { name: 'bind'
              ,attrs: { xmlns: BIND_NS }
            }
        ]
    };

    if( !stanza.valid(schema) ) {
        // if binding was required, and we didn't get a bind request,
        // terminate the stream.
        // TODO: report the right error
        session.connection.close();
    }

    // TODO handle all possible error conditions
    // http://xmpp.org/rfcs/rfc3920.html#bind
    var resourceId = stanza.c("bind").c("resource");
    if( resourceId ) {
        session.jid += '/' + resourceId.t();
        var reply = new Stanza("iq", {type: "result", id: "bind_2"});
        reply.tag("bind", {xmlns: BIND_NS})
            .tag("jid", {}, session.jid);
        session.write(reply.toString());
    }
});
