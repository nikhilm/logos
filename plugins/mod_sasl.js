var sys = require('sys');

var sasl = require('sasl');
var Stanza = require('../utils/stanza').Stanza;
require('../utils/validation');

var c_module = require('../core/modulemanager');
var log = require('../utils/logging').log;

var SASL_NS = 'urn:ietf:params:xml:ns:xmpp-sasl';
// TODO read from Logos config file
var MAX_TRIES = 2;

var saslCallback = function(session, property, saslSession) {
    // TODO Fix sasljs to set realm in creation
    if( property == sasl.GSASL_REALM ) {
        saslSession.setProperty("realm", "xmpp");
        return sasl.GSASL_OK;
    }
    else if( property == sasl.GSASL_PASSWORD ) {
        log("debug", "Password requested for user", saslSession.property("authid"));
        saslSession.setProperty("password", "1234");
        return sasl.GSASL_OK;
    }
}

// TODO hook into session start event
c_module.hookSession('stream-features', function(session, features) {
    if( session.authenticated )
	return;
    var handler = sasl.createServerSession("xmpp", function(property, saslSession) {
        return saslCallback(session, property, saslSession);
    });

    if( typeof(session.saslHandler) == "undefined" ) {
        session.saslHandler = handler;
        session.saslHandler.tries = 0;
    }
    else {
        //TODO are we supposed to abort?
    }
    var mechs = "<mechanisms xmlns='urn:ietf:params:xml:ns:xmpp-sasl'>\n";

    handler.mechanisms.forEach(function(mech) {
        mechs += "<mechanism>" + mech + "</mechanism>\n";
    });

    mechs += "</mechanisms>\n";

    features.push(mechs);
});

var success = function(payload) {
    return new Stanza("success", {xmlns: SASL_NS}, payload ? payload : "" ).toString();
}

var failure = function(error) {
    return (new Stanza("failure", {xmlns: SASL_NS}).tag(error)).root().toString();
}

var challenge = function(payload) {
    return (new Stanza("challenge", {xmlns: SASL_NS}, payload)).toString();
}

var performSaslStep = function(session, response) {
    var reply = session.saslHandler.step( response );
    if( reply.status == sasl.GSASL_OK ) {
        log("debug", "SASL Authentication succeeded");
        //TODO set hostname also
        log("debug", "user", session.saslHandler.property("authid"));
	session.setAuthenticated(session.saslHandler.property("authid") + "@localhost");
        session.write(success());
    }
    else if( reply.status == sasl.GSASL_NEEDS_MORE ) {
        session.write(challenge(reply.data));
    }
    else {
        log("debug", "SASL Authentication error", reply.data);
        // TODO handle individual error
        // codes for all SASL errors defined
        // in XMPP SASL errors
        session.saslHandler.tries++;
        session.write(failure('temporary-auth-failure'));
        if( session.saslHandler.tries > MAX_TRIES ) {
            session.connection.end();
        }
    }
}

c_module.handleStanza('auth', function(session, auth) {
    if( typeof(session.saslHandler) == "undefined" ) {
        session.connection.end();
    }

    if( !auth.valid( {
	attrs: {
	    xmlns: SASL_NS
	    ,mechanism: function(mech) {
		return session.saslHandler.mechanisms.indexOf(mech) != -1;
	    }
	} }) ) {
	log("debug", "<auth/> reply did not conform");
	session.connection.end();
    }

    if( auth.a('xmlns') != SASL_NS ) {
        session.connection.end();
    }

    var initialResponse = (typeof(auth.t()) == "undefined" ? "" : auth.t());

    session.saslHandler.start(auth.a("mechanism"));

    performSaslStep(session, initialResponse);
});

c_module.handleStanza('response', function(session, resp) {
    //TODO Again move namespace checking upwards
    if( !resp.valid({ attrs: { xmlns: SASL_NS } }) ) {
	log("debug", "Invalid <response/>");
    }

    if( !resp.t() )
        resp.t("");

    performSaslStep(session, resp.t());
});
