var sys = require('sys');
var events = require('events');

var c_parser = require('core/xmppparser');
var c_eventbus = require('core/eventbus');
var Stanza = require('utils/stanza').Stanza;

var log = require('utils/logging').log;
var eventbus = require('core/eventbus').instance;

exports.Session = Session = function(connection) {
    this.connection = connection;
    this.ready = false;
    this.authenticated = false;
    this.eventbus = new c_eventbus.EventBus();
    // TODO: When server-to-server supported
    this.type = "c2s";

    this.initParser();
    eventbus.emit("session-created", this);
}

Session.prototype.initParser = function() {
    this.connection.pause();
    if( this.parser ) {
	// cleanup callbacks and so on
	this.connection.removeAllListeners("data");
	this.parser = null;
    }
    this.parser = new c_parser.Parser();

    var self = this;
    this.parser.addListener( "streamOpen", function(stream) {
        log( "debug", "stream opened");

        if( stream.a('version') != '1.0' ) {
            log("debug", "Unsupported stream version", self.connection.remoteAddress);
            self.streamError('unsupported-version', "Requires 1.0");
            self.endConnection();
        }

        // TODO completely validate the stream header
        // var ok = self.validateStream(attrs);
        // Including major minor version checks

        self.eventbus.emit('stream-open', self);
        // TODO plugin hostname
        // TODO generate random id
        var doc = new Stanza("stream:stream", {from: 'localhost'
                                              ,id: 'xyzzy'
                                              ,xmlns: 'jabber:client'
                                              ,'xmlns:stream': 'http://etherx.jabber.org/streams'
                                              ,version: '1.0'});
        // remove stream ending
        log("debug", "Opening reply stream");
        self.connection.write(doc.toString().replace('</stream:stream>', ''));
        self.writeStreamFeatures();
        self.ready = true;
    });

    this.parser.addListener("streamClose", function() {
        log("debug", "stream closed");
        self.ready = false;
    });

    this.parser.addListener("stanza", this.handleStanza.bind(this));

    this.connection.addListener('data', this.parser.parse.bind(this.parser));
    this.connection.addListener('end', this.endConnection.bind(this));
    this.connection.addListener('timeout', this.connectionError.bind(this));
    this.connection.addListener('error', this.connectionError.bind(this));
    this.connection.resume();
}

// just to abstract stuff from other components
// like plugins
Session.prototype.write = function(data) {
    this.connection.write(data);
}

Session.prototype.writeStreamFeatures = function() {
    // we register our function as a listener
    // for stream features
    // then we emit the event
    // since event listeners are ordered
    // ours is executed last, so we know
    // that everyone has inserted their
    // stream features by now
    // then we can return
    // modules should append
    // to the end of features with
    // a string containing the xml response
    // contained within
    // TODO register on the global event bus
    var wait = true;
    this.eventbus.addListener('stream-features', function() {
        wait = false;
    });

    features = [];
    // it might need more arguments other than
    // session and session should probably contain
    // more information about the connection
    this.eventbus.emit('stream-features', this, features);
    while(wait) {
    }

    log("debug", "Stream features are", features);
    //TODO remove our fake listener
    this.connection.write("<stream:features>"+features.join('\n')+"</stream:features>");
};

Session.prototype.handleStanza = function(stanza) {
    this.eventbus.emit("stanza", this, stanza);
}

Session.prototype.endConnection = function() {
    this.connection.end();
}

Session.prototype.connectionError = function() {
    var message = arguments[0] || "Unknown error";
    log("debug", "Connection error", message);
    this.endConnection();
}

/*
 * streamError(error[, reason])
 */
Session.prototype.streamError = function(error) {
    var doc = new Stanza("stream:error");
    doc.tag(error, {xmlns: 'urn:ietf:params:xml:ns:xmpp-streams'})
          .parent()
      .tag('text', {xmlns: 'urn:ietf:params:xml:ns:xmpp-streams', 'xml:lang': 'en'}, arguments[0] || error );

    log("debug", "Stream error", error, doc.toString());
    this.connection.write(doc.toString());
}

Session.prototype.setAuthenticated = function(jid) {
    this.type += '_auth';
    this.jid = jid;
    this.authenticated = true;
    this.initParser();
}
