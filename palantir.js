var sys = require('sys');
var net = require('net');

var log = require('utils/logging').log;
var c_session = require('core/session');

// TODO fix log level on release
global.LOG_LEVEL = "debug";

// TODO load config
// TODO load plugins

var handleConnection = function(stream) {
    stream.setEncoding('utf8');
    log("debug", "Received new connection", stream.remoteAddress);
    stream.addListener('connect', function() {
        new c_session.Session(stream);
    });
}

var server = net.createServer(handleConnection);
log("info", "Server Now listening on port 5222");
// TODO bind on various hosts etc.
server.listen(5222, 'localhost');
