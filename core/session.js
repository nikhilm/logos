var sys = require('sys');

var c_parser = require('core/xmppparser');
var log = require('utils/logging').log;
var xml = require('libxmljs');

exports.Session = Session = function(connection) {
    this.connection = connection;
    this.ready = false;
    this.authenticated = false;

    this.parser = new c_parser.Parser();

    var self = this;
    this.parser.addListener( "streamOpen", function(attrs) {
        log( "debug", "stream opened", sys.inspect(attrs) );

        if( !attrs['version'] || attrs['version'].value != '1.0' ) {
            log("debug", "Unsupported stream version", self.connection.remoteAddress);
            self.streamError('unsupported-version', "Requires 1.0");
            self.endConnection();
        }

        // TODO completely validate the stream header
        // var ok = self.validateStream(attrs);
        // Including major minor version checks
        //
        function streamFeatures() {
        }

        var doc = new xml.Document();
        // TODO plugin hostname
        // TODO generate random id
        doc.node('stream:stream', {from: 'localhost', id: 'xyzzy', xmlns: 'jabber:client', 'xmlns:stream': 'http://etherx.jabber.org/streams', version: '1.0'});
        // remove stream ending
        log("debug", "Opening reply stream", doc.toString().replace('/>', '>'));
        self.connection.write(doc.toString().replace('/>', '>'));
        self.connection.write(streamFeatures());
        self.ready = true;
    });

    this.parser.addListener("streamClose", function() {
        log("debug", "stream closed");
        self.ready = false;
    });

    this.parser.addListener("stanza", this.handleStanza.bind(this));

    connection.addListener('data', sys.debug);
    connection.addListener('data', this.parser.parse.bind(this.parser));
    connection.addListener('end', this.endConnection.bind(this));
    connection.addListener('timeout', this.connectionError.bind(this));
    connection.addListener('error', this.connectionError.bind(this));
}

Session.prototype.handleStanza = function(stanza) {
    log("debug", "Received stanza", sys.inspect(stanza));
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
    var doc = new xml.Document();
    doc.node('stream:error')
      .node(error, {xmlns: 'urn:ietf:params:xml:ns:xmpp-streams'})
      .parent()
      .node('text', {xmlns: 'urn:ietf:params:xml:ns:xmpp-streams', 'xml:lang': 'en'}, arguments[0] || error );

    log("debug", "Stream error", error, doc.toString());
    this.connection.write(doc.toString());
}
