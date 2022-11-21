"use strict";

const http = require('http');

const User = require("../common/user");
const utils = require("../common/utils");
const stages = require("../common/stages");
const stats = require("../common/stats");
const ProxyRequest = require("../common/proxy_request");

const handler = require('./handler');
const monitoring = require('./monitoring');
const job = require("./job");

const config = {
    port: process.env.port || 3048,
};

function getUser(header) {
    let user = header["Proxy-User"];
    return new User("dummy");
}

function proxyHandler(clientRequest, clientResponseSocket, head) {
    const rawHeaders = utils.getCleanHeaders(clientRequest.rawHeaders);

    let rid = rawHeaders["Proxy-Request-ID"];
    let user = getUser(rawHeaders);
    let timeoutSecs = rawHeaders["Proxy-Request-Timeout"] || 180;

    const proxyRequest = new ProxyRequest(clientRequest, clientResponseSocket, rid, user);

    const token = proxyRequest.getBasicAuthToken();

    // authentication from proxy-client for proxy-unit. 
    // This is not the client request authentication.
    if (rawHeaders["proxy-authorization"] != token) {
        let error_message = "Invalid proxy credentials";
        proxyRequest.handlerError(stages.ProxyAuthorizationStage, error_message);
        return clientResponseSocket.end();
    }
    proxyRequest.debug(stages.ProxyAuthorizationStage, "Proxy Client is Authenticated.")

    const validatedMessage = proxyRequest.validateURL();
    const target = validatedMessage.host;

    if (!validatedMessage.valid) {
        proxyRequest.handlerError(stages.ProxyClientStage, validatedMessage.message);
        return clientResponseSocket.end();
    }
    const proxyHost = "localhost";
    const params = {target, timeoutSecs, proxyHost}
    handler.serverConnect(proxyRequest, head, params)
}

function serverHttpCallHandler(req, res) {
    /*
    Handles http request for ping and health check. It does not accepts other requests.
    */
    if (req.method === 'GET' && req.url === '/health') {
        let data = monitoring.getServerHealth();
        res.statusCode = 200;
        res.end(JSON.stringify(data));
    } else {
        res.statusCode = 404;
        res.end();
    }
}

// Create server
const server = http.createServer();
server.on('connect', proxyHandler); // Accept client via CONNECT method
server.on('request', serverHttpCallHandler); // Response to PING on GET /ping

server.listen(config.port, err => {
    const logger = stats.getLog("server");
    if (err) {
        return logger.error(stages.AppStartUpStage('cannot start proxy'))
    }    
    logger.info(stages.AppStartUpStage(`proxy listening at port ${config.port}`));
    // job.register() 

});
