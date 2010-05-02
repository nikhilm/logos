var sys = require('sys');
var events = require('events');

exports.EventBus = function() {
}

exports.EventBus.prototype = Object.create(new events.EventEmitter());

exports.instance = new exports.EventBus();
