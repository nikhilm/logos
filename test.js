var tcp = require("tcp");
var sys = require("sys");
var xml = require("libxmljs");

var hashAttribute = function( attr ) {
    return { name : attr[0]
           , ns : attr[1]
           , nsHref : attr[2]
           , value : attr[3]
           };
}

var hashAttributes = function( attrs ) {
    return attrs.map( hashAttribute );
}

var Session = function() {
    var self = this;
    this.parser = new xml.SaxPushParser(function(cb) {
        cb.onStartElementNS(function(elem, attrs, prefix, uri, namespaces) {
            sys.debug("Namespaces" );
            sys.debug(sys.inspect(namespaces));
            sys.debug("Attributes");
            sys.debug(sys.inspect(hashAttributes(attrs)));
        });
        cb.onEndElementNS(function() {
        });
        cb.onCharacters(function() {
        });
    });
}

Session.prototype = {
    handle: function(data) {
        this.parser.push(data);
    }
}

var server = tcp.createServer(function (socket) {
  socket.setEncoding("utf8");

  var ses;
  socket.addListener("connect", function () {
      ses = new Session();
  });
  socket.addListener("data", function (data) {
      sys.debug(data);
      ses.handle(data);
 
      socket.write( "<stream:stream xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' id='1234' from='localhost' version='1.0' xml:lang='en'>" );
      socket.write( "<stream:features> <bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'/> <session xmlns='urn:ietf:params:xml:ns:xmpp-session'/> </stream:features>");
  });
  socket.addListener("end", function () {
    socket.close();
  });
});
server.listen(5222, "localhost");
