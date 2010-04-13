var sys = require('sys');
var assert = require('assert');
var parser = require('../../core/parser');

var p = new parser.Parser();

p.addListener( "error", function(msg) {
    sys.log( "TEST ERROR "+ msg );
} );

p.addListener( "stanza", function(stanza) {
    assert.equal( stanza.name, 'message', "Wrong stanza name, expected message" );
    assert.equal( Object.keys(stanza.attrs).length, 4, "wrong no. of attributes" );
    assert.ok( stanza.children['body'] );
    assert.equal( stanza.attrs['from'].value, 'juliet@example.com/balcony' );
});

p.parse( "<message to='romeo@example.net' from='juliet@example.com/balcony' type='chat' xml:lang='en'> <body>Wherefore art thou, Romeo?</body> </message>");

// --------------

var p2 = new parser.Parser();
p2.addListener( "stanza", function(stanza) {
    assert.equal( stanza.name, 'presence', "Wrong stanza name, expected presence" );
    assert.equal( Object.keys(stanza.attrs).length, 1, "wrong no. of attributes" );
});

p2.parse( "<presence xml:lang='en'><show>dnd</show><status>Wooing Juliet</status><status xml:lang='cz'>Ja dvo&#x0159;&#x00ED;m Juliet</status></presence>" );
