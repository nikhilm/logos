var sys = require('sys');
var events = require('events');

var EventBus = function() {
}

EventBus.prototype = Object.create(new events.EventEmitter());
