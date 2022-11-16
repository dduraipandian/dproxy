"use strict";
const settings = require('../common/settings');
const redis = require('../common/redis');

const heartBeatInterval = 1000 * settings.HEARTBEAT_INTERVAL;

let heartBeatJob;
const register = () => {
    console.log(`proxy server heartbeat`);
    heartBeatJob = setInterval(
        () => console.log("beats"), 
        heartBeatInterval);
}

module.exports = {
    register
}