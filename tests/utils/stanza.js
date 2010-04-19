var sys = require('sys');
var assert = require('assert');

var Stanza = require('../../utils/stanza').Stanza;

st = (new Stanza("iq"))
        .tag("message", {xmlns: "Hi there", from: "nsm.nikhil"}, "What's up?")
        .parent()
        .tag("error", {repeated: "2"})
        .parent()
        .tag("error", {xmlns: "djfaldfj", reason: "failed"})
        .root();

assert.equal(st.name, "iq");
assert.equal(st.c("message").a("from"), "nsm.nikhil");
assert.ok( Array.isArray(st.cs("error")));
assert.equal(st.c("message").t(), "What's up?");
assert.notEqual(typeof(st.c("message").setText("simple")), "string");
assert.equal(st.c("message").t(), "simple");
assert.equal(st.cs("error").length, 2);

st = new Stanza("bling");

st
.tag("shiny", {brightness: "0.4"}, "Text")
 .tag("nested", {hue: "45"}, "Sat")
  .parent()
 .parent()
.tag("binary", {}, "soul");
assert.equal(st.c("shiny").t(), "TextSat");
assert.equal(st.c("shiny").content(), 'Text<nested hue="45">Sat</nested>');

