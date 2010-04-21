var sys = require("sys");
var assert = require("assert");

// uncomment this when you add new tests and want to see more information
// global.LOG_LEVEL = "debug";

var Stanza = require("../../utils/stanza").Stanza;
require("../../utils/validation");
var parser = require("../../core/xmppparser");

// manual test
var stanza = new Stanza("message", { to: "romeo@example.net"
				    ,from: "juliet@example.com/balcony"
				     ,type: "chat" });
stanza
    .tag("body", {}, "Wherefore art thou, Romeo?");

assert.ok(stanza.valid({ name: "message" }));
assert.ok(stanza.valid({ name: "message"
			 ,attrs: { to: /[a-z]*@example.net/
				   ,type: "chat" }
			 ,children: [
			     { name: "body"
			       ,text: /.*art thou.*/}
			 ] }));

assert.notEqual(stanza.c("body").valid({text: "bazinga"}), true);

var p = new parser.Parser();
p.addListener("streamOpen", function(stream) {
    assert.ok(stream.valid({ name: "stream"
			     ,attrs: { "xmlns:stream" : /streams$/ }
			   }));
});
p.addListener("stanza", function(stanza) {
    assert.ok(stanza.valid({ name: /sence$/
			     ,attrs: { xmlns:"jabber:client" }
			     ,children: [
				 { name: "status" }
				 ,{ name: "show" }
			     ]}));
    assert.ok(stanza.c("status").valid({text: /Juliet/}));
    assert.ok(stanza.cs("status")[1].valid({text: /^Ja dvo/}));

    assert.notEqual(stanza.valid( { children: [
	{ name: "status", attrs: { lang: "en" } } ]}), true);

    assert.ok(stanza.valid( { children: [
	{ name: "status", attrs: { lang: "cz" } } ]}));
});

p.parse( "<?xml version='1.0'?><stream:stream to='example.com' xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'><presence xml:lang='en'><show>dnd</show><status>Wooing Juliet</status><status xml:lang='cz'>Ja dvo&#x0159;&#x00ED;m Juliet</status></presence></stream:stream>" );
