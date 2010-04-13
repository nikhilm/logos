var sys = require('sys');

var levels = [ "info", "error", "debug" ];

global.LOG_LEVEL = global.LOG_LEVEL || "info";

var makeLogger = function(initLevel) {
    return function() {
        if( levels.indexOf(global.LOG_LEVEL) >= initLevel )
            sys.debug( levels[initLevel] + ": " + [].join.call( arguments, ' ' ) );
    }
}

var loggers = {};
levels.forEach( function(elt, i) {
    loggers[elt] = makeLogger(i);
});
/*
 * Log to stderr
 * log( level, ... )
 */
exports.log = function( level ) {
    if( loggers[level] )
        loggers[level]( [].splice.call( arguments, 1 ) );
}
