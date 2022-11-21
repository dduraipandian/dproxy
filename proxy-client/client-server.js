'use strict';

const _ = require('lodash');
const http = require('http');

const stages = require("../common/stages");
const stats = require("../common/stats");
const proxy_request = require("./proxy_request");
const connectHandler = require("./connect_handler");
const requestHandler = require("./request_handler");

const config = {
    port: process.env.port || 3127,
};

function handler(request, response, protocol, protocalHandler) {
    let proxyRequest;

    if (protocol === "https")
        proxyRequest = new proxy_request.HTTPSProxyRequest(request, response, "https");
    else
        proxyRequest = new proxy_request.HTTPProxyRequest(request, response, "http");

    protocalHandler(proxyRequest);
}

// Create server
const server = http.createServer();
server.on('connect', (req, res) => handler(req, res, "https", connectHandler));
server.on('request', (req, res) => handler(req, res, "http", requestHandler));

server.listen(config.port, (err) => {
    const logger = stats.getLog("server");
    if (err) {
        return logger.error(stages.AppStartUpStage('cannot start proxy'))
    }    
    logger.info(stages.AppStartUpStage(`proxy listening at port ${config.port}`));
});