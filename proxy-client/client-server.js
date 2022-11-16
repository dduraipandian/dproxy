'use strict';

const _ = require('lodash');
const http = require('http');
const proxy_request = require("./proxy_request");
const connectHandler = require("./connect_handler");
const requestHandler = require("./request_handler");

const config = {
    port: process.env.port || 3127,
};

function handler(request, response, protocol, protocalHandler){
    let proxyRequest;

    if(protocol === "https")
        proxyRequest = new proxy_request.HTTPSProxyRequest(request, response);
    else
        proxyRequest = new proxy_request.HTTPProxyRequest(request, response);
        
    protocalHandler(proxyRequest);
}

// Create server
const server = http.createServer();
server.on('connect', (req, res) => handler(req, res, "https", connectHandler));
server.on('request', (req, res) => handler(req, res, "http", requestHandler));

server.listen(config.port, (err) => {
    if (err) {
        return console.error('cannot start proxy');
    }

    console.log('proxy listening at port %d', config.port);
});