"use strict";

const path = require('path');

const APP_ROOT = require.main.path;

const APP_PORT = process.env.PORT;
const APP_NAME = path.basename(APP_ROOT);
const LOGLEVEL = process.env.LOGLEVEL || "debug";

const REDIS_URL = process.env.REDIS_URL || null;
const EMAIL_SERVER = process.env.EMAIL_SERVER || null;

const HEARTBEAT_INTERVAL = process.env.HEARTBEAT_INTERVAL || 10;
let MAILER_CONFIG;

if(EMAIL_SERVER){
    const EMAIL_PORT = process.env.EMAIL_PORT || 587;
    const EMAIL_HOST_USER = process.env.EMAIL_HOST_USER;
    const EMAIL_HOST_PASSWORD = process.env.EMAIL_HOST_PASSWORD;
    let EMAIL_SUBJECT_PREFIX = process.env.EMAIL_SUBJECT_PREFIX ? `[${EMAIL_SUBJECT_PREFIX}] `: '';
    EMAIL_SUBJECT_PREFIX = `[${APP_NAME.toUpperCase()}] ${EMAIL_SUBJECT_PREFIX}`;
    MAILER_CONFIG = {EMAIL_SERVER, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, EMAIL_SUBJECT_PREFIX}
}

const PROXY_IP_REDIS_DB = 2;

module.exports = {
    APP_ROOT,
    APP_PORT,
    APP_NAME,
    LOGLEVEL,
    REDIS_URL,
    HEARTBEAT_INTERVAL,
    PROXY_IP_REDIS_DB
}

if(MAILER_CONFIG) 
    module.exports['MAILER_CONFIG'] = MAILER_CONFIG