var sys = require('sys');
var assert = require('assert');
var parser = require('../../core/xmppparser');

var p = new parser.Parser();

p.addListener( "error", function(msg) {
    sys.log( "TEST ERROR "+ msg );
    assert.fail();
} );

p.addListener( "stanza", function(stanza) {
    assert.equal( stanza.name, 'message', "Wrong stanza name, expected message" );
    assert.equal( Object.keys(stanza.attrs).length, 4, "wrong no. of attributes" );
    assert.ok( stanza.children['body'] );
    assert.equal( stanza.attrs['from'].value, 'juliet@example.com/balcony' );
    assert.equal( stanza.xmlns, null );
});

p.parse( "<?xml version='1.0'?><stream:stream to='example.com' xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'><message to='romeo@example.net' from='juliet@example.com/balcony' type='chat' xml:lang='en'> <body>Wherefore art thou, Romeo?</body> </message></stream:stream>");

// --------------

var p2 = new parser.Parser();
var p2_error = false;
var p2_stream_opened = false;
var p2_stream_closed = false;
p2.addListener( "error", function(msg) {
    p2_error = true;
});
p2.addListener( "streamOpen", function(attrs) {
    p2_stream_opened = true;
});
p2.addListener( "streamClosed", function() {
    p2_stream_closed = true;
});
p2.addListener( "stanza", function(stanza) {
    assert.equal( stanza.name, 'presence', "Wrong stanza name, expected presence" );
    assert.equal( Object.keys(stanza.attrs).length, 1, "wrong no. of attributes" );
});

process.addListener('exit', function() {
    assert.ok( !p2_error );
    assert.ok( p2_stream_opened );
    assert.ok( p2_stream_closed );
});

p2.parse( "<?xml version='1.0'?><stream:stream to='example.com' xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'><presence xml:lang='en'><show>dnd</show><status>Wooing Juliet</status><status xml:lang='cz'>Ja dvo&#x0159;&#x00ED;m Juliet</status></presence></stream:stream>" );

// --------------
// we want errors

var p3 = new parser.Parser();
var p3_error = false;
p3.addListener( "error", function(msg) {
    p3_error = true;
});
process.addListener('exit', function() {
    assert.ok( p3_error );
});

p3.parse( "<?xml version='1.0'?><stream to='example.com' xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'><presence xml:lang='en'><show>dnd</show><status>Wooing Juliet</status><status xml:lang='cz'>Ja dvo&#x0159;&#x00ED;m Juliet</status></presence>" );
