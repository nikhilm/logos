var log = require('../../utils/logging').log;

// current level is info
log( "info", "SHOULD be shown" );
log( "error", "SHOULD NOT be shown" );
log( "debug", "SHOULD NOT be shown" );

global.LOG_LEVEL = "debug";

log( "info", "SHOULD be shown" );
log( "error", "SHOULD be shown" );
log( "debug", "SHOULD be shown" );

global.LOG_LEVEL = "info";

log( "info", "SHOULD be shown" );
log( "error", "SHOULD be shown" );
log( "debug", "SHOULD NOT be shown" );

// invalid global level, nothing shown
global.LOG_LEVEL = "invalid";

log( "info", "SHOULD NOT be shown" );
log( "error", "SHOULD NOT be shown" );
log( "debug", "SHOULD NOT be shown" );

// invalid log level, nothing shown
global.LOG_LEVEL = "debug";

log( "invalid", "SHOULD NOT be shown" );
