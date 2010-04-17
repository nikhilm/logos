var sys = require('sys');

var sasl = require('sasl');
var xml = require('libxmljs');

var c_module = require('../core/modulemanager');
var log = require('../utils/logging').log;

var SASL_NS = 'urn:ietf:params:xml:ns:xmpp-sasl';
// TODO read from palantir config file
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
c_module.hook('stream-features', function(session, features) {
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

// TODO move this to utils and rename
var xmlClean = function(doc) {
    log("debug", "Clean and write", doc.toString());
    return doc.toString().replace(/^<\?xml.*\?>/, "");
}

var success = function(payload) {
    return xmlClean(
        (new xml.Document())
        .node("success", {xmlns: SASL_NS}, payload ? payload : "" )
    );
}

var failure = function(error) {
    return xmlClean(
        (new xml.Document())
        .node("failure", {xmlns: SASL_NS})
         .node(error)
    );
}

var challenge = function(payload) {
    return xmlClean(
        (new xml.Document())
        .node("challenge", {xmlns: SASL_NS}, payload)
    );
}

var performSaslStep = function(session, response) {
    var reply = session.saslHandler.step( response );
    if( reply.status == sasl.GSASL_OK ) {
        log("debug", "SASL Authentication succeeded");
        session.write(success());
    }
    else if( reply.status == sasl.GSASL_NEEDS_MORE ) {
        log("debug", "Needs MORE");
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
            session.connection.close();
        }
    }
}

c_module.handleStanza('auth', function(session, auth) {
    if( typeof(session.saslHandler) == "undefined" ) {
        session.connection.close();
    }

    if( auth.xmlns.name != SASL_NS ) {
        session.connection.close();
    }

    var mech = (typeof(auth.attrs['mechanism']) == "undefined" ? null : auth.attrs['mechanism'].value);
    if( !mech ) {
        session.connection.close();
    }

    var initialResponse = (typeof(auth.text) == "undefined" ? "" : auth.text);

    session.saslHandler.start(mech);

    performSaslStep(session, initialResponse);
});

c_module.handleStanza('response', function(session, resp) {
    //TODO Again move namespace checking upwards
    if( resp.xmlns.name != SASL_NS )
        return;

    if( !resp.text )
        resp.text = "";

    performSaslStep(session, resp.text);
});
