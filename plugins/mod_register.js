var module = require('../core/modulemanager');

module.hook('stream-features', function(session, features) {
    features.push("<register xmlns='http://jabber.org/features/iq-register'/>");
});
