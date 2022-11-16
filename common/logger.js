
'use strict';

const winston = require('winston');
const settings = require('./settings');

// define the custom settings for each transport (file, console)
const options = {
    file: {
        level: settings.LOGLEVEL,
        filename: `${settings.APP_ROOT}/../logs/${settings.APP_NAME}.log`,
        handleExceptions: true,
        json: false,
        maxsize: 10240000, // 10MB
        maxFiles: 200, // keep latest 200 files
        colorize: false,
        rotationFormat: () => `-${new Date().toISOString()}`,
    },
    console: {
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true,
    },
};


// instantiate a new Winston Logger with the settings defined above
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.splat(),
        winston.format.prettyPrint(),
        winston.format.printf(i => {
            return `${i.timestamp} - ${i.level.toUpperCase()}: ${i.message}`
        }),
      ),
    transports: [
        new winston.transports.Console(options.console),
        new (winston.transports.File)(options.file)
    ],
    exitOnError: false, // do not exit on handled exceptions
});


// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
    write: function(message, encoding) {
        // use the 'info' log level so the output will be picked up by both transports (file and console)
        logger.info(message.trim());
    },
};

module.exports = logger