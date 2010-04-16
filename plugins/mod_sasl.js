var module = require('../core/modulemanager');

var sasl = require('sasl');

// TODO hook into session start event
module.hook('stream-features', function(session, features) {
    var handler = sasl.createServerSession("xmpp", function(){});
    var mechs = "<mechanisms xmlns='urn:ietf:params:xml:ns:xmpp-sasl'>\n";

    handler.mechanisms.forEach(function(mech) {
        mechs += "<mechanism>" + mech + "</mechanism>\n";
    });

    mechs += "</mechanisms>\n";

    features.push(mechs);
});
