var sys = require('sys');

var eventbus = require('core/eventbus').instance;

// -----------------------
// API exposed to modules

exports.hook = function(evt, f) {
    eventbus.addListener(evt, f);
}
