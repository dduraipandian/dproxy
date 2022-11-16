"use strict";

const util = require('util');
const redis_ = require("redis");
const winston = require('./logger');
const settings = require('./settings');

const PROXY_IP_REDIS_DB = settings.PROXY_IP_REDIS_DB;

winston.info(`${settings.REDIS_URL}/${PROXY_IP_REDIS_DB}`);

const redis = redis_.createClient({
  url: `${settings.REDIS_URL}/${PROXY_IP_REDIS_DB}`,
  retry_strategy: function (options) {
    if (options.error && options.error.code === "ECONNREFUSED") {
      // End reconnecting on a specific error and flush all commands with
      // a individual error
      const error = "Not able to connect to redis server. The redis server refused the connection.";
      winston.error(error);
      return new Error(error);
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      // End reconnecting after a specific timeout and flush all commands
      // with a individual error
      const error = "Not able to connect to redis server. Retry time exhausted.";
      winston.error(error);
      return new Error(error);
    }
    if (options.attempt > 3) {
      // End reconnecting with built in error
      return undefined;
    }
    // reconnect after
    return Math.min(options.attempt * 100, 3000);
  },
});

redis.connect();

redis.on("error", (error) => {
  winston.error(error.stack);
});

redis.on("connect", (error) => {
  winston.info("Connected to redis server.");
});

const sPop = util.promisify(redis.sPop).bind(redis);
const sAdd = util.promisify(redis.sAdd).bind(redis);

module.exports = { redis, sPop, sAdd };