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
assert.ok( Array.isArray(st.c("error")));

st = new Stanza("bling");

st
.tag("shiny", {brightness: "0.4"})
 .tag("nested", {hue: "45"}, "Sat")
  .parent()
 .parent()
.tag("binary", {}, "soul");
