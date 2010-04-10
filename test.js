var net = require("net");
var sys = require("sys");
var xml = require("libxmljs");
var sasl = require("sasl");

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

/*
 * If callback returns null
 * assumed that callback doesn't want to return anything
 * otherwise whatever is returned is passed on
 */
var cb = function(  property, sess ) {
    sys.debug("Session obj is " + sys.inspect(sess));
    if( property == sasl.GSASL_PASSWORD
      && sess.property("authid") == "nikhil" ) {
          sys.debug("OK!!");
          sess.setProperty( "password", "1234" );
          return sasl.GSASL_OK;
    }
    if( property == sasl.GSASL_REALM )
        return "localhost";

}

var server = net.createServer(function (socket) {
  socket.setEncoding("utf8");

  var ses;
  var sc;
  var cr = false; // challenge written
  socket.addListener("connect", function () {
      ses = new Session();
      sc = sasl.createServerSession( "localhost", cb );
      socket.write( "<stream:stream xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' id='1234' from='localhost' version='1.0' xml:lang='en'>" );
      socket.write( "<stream:features><mechanisms xmlns='urn:ietf:params:xml:ns:xmpp-sasl'>" );
      sc.mechanisms.forEach(function(i) {
          socket.write( "<mechanism>" + i + "</mechanism>" );
      });
      socket.write( "</mechanisms></stream:features>" );
  });
  socket.addListener("data", function (data) {
      ses.handle(data);
 
      if( !cr ) {
          sc.start("DIGEST-MD5");
          cr = true;
          return;
      }
      var res;
      sys.debug("Data from client " + data);
      var s = /<response xmlns="urn:ietf:params:xml:ns:xmpp-sasl">(.*)<\/response>/.exec(data);
      if ( s == null ) {
          if( /<response .*\/>/.exec(data) ) {
                socket.write( "<success xmlns='urn:ietf:params:xml:ns:xmpp-sasl'/>" );
          }
          else {
              res = sc.step( "" );
          }
      }
      else {
          res = sc.step( s[1] );
      }
      sys.debug(sys.inspect(res));
      if( res.data == undefined )
          process.exit(1);
      if( res.status != sasl.GSASL_OK && res.status != sasl.GSASL_NEEDS_MORE ) {
        process.exit(1);
      }
      socket.write( "<challenge xmlns='urn:ietf:params:xml:ns:xmpp-sasl'>" + res.data + "</challenge>");
      //socket.write( "<stream:features> <bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'/> <session xmlns='urn:ietf:params:xml:ns:xmpp-session'/> </stream:features>");
  });
  socket.addListener("end", function () {
    socket.end();
  });
});
sys.debug(sys.inspect(server));
server.listen(5222, "localhost");
