"use strict"
const http = require('http');
const crypto = require('crypto');
const url = require('url');

const _ = require('lodash');

const User = require("../common/user");
const stages = require("../common/stages");
const ProxyRequest = require("../common/proxy_request");

const ProxyAgent = require('./proxy_agent');
const utils = require('./utils');


function getUser(request) {
    return new User("dummy");
}

class ProxyClientRequest extends ProxyRequest {
    constructor(request, response, app="proxy-client") {
        let rid = crypto.randomUUID()
        let user = getUser(request);
        super(request, response, rid, user, app);
        this.validateUrl();
    }

    getProxyHost() {
        let proxtHost = 'localhost:3048';
        let [host, port] = proxtHost.split(":")
        return { host, port }
    }
    getProxyInfoHeaders() {
        let proxyInfoHeaders = {
            "Proxy-Request-Timeout": 10,
            "Proxy-Request-ID": this.rid
        }
        return proxyInfoHeaders
    }
    writeEndSocket(socket, code, message, opts) {
        return utils.writeEndSocket(socket, code, message, opts)
    }
    writeEndRequest(request, code, message, opts) {
        return utils.writeEndRequest(request, code, message, opts)
    }
    validateUrl() {
        try {
            url.parse(this.url, true);
            this.debug(stages.URLValidationStage, "URL validation is completed.");
        } catch (err) {
            let stage = this.handlerError(stages.URLValidationStage, err)
            return this.writeEndClient(400, stage.user_response);
        }
    }
}
class HTTPSProxyRequest extends ProxyClientRequest {
    constructor(request, response) {
        super(request, response);
        this.validateUrl();
    }
    writeEndClient(code, message) {
        return utils.writeEndSocket(this.response, code, message, opts)
    }
    getAgent() {
        return new http.Agent()
    }
    getProxyOptions() {
        const usernamePasswordB64 = this.getBasicAuthToken();
        const proxyInfoHeaders = this.getProxyInfoHeaders();
        const proxyServer = this.getProxyHost();
        const proxyAgent = this.getAgent();

        const httpsHeaders = {
            "authority": this.request.url.split(":")[0],
            "connection": "keep-alive",
            "upgrade-insecure-requests": "1",
            "accept-encoding": "gzip, deflate",
            "accept": "*/*",
            "user-agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36",
            "proxy-authorization": usernamePasswordB64,
            ...proxyInfoHeaders
        }
        const proxyOpts = {
            host: proxyServer.host,
            port: proxyServer.port,
            method: 'CONNECT',
            path: this.request.url,
            agent: proxyAgent, // Don't use the proxy agent
            headers: httpsHeaders,
        };
        return proxyOpts
    }
}

class HTTPProxyRequest extends HTTPSProxyRequest {    
    writeEndClient(code, message) {
        return utils.writeEndRequest(this.response, code, message, opts)
    }
    sanitizeHeaders(rawHeaders) {
        const reRemove = new RegExp('[^A-Za-z0-9\-]+', 'g');

        if (!rawHeaders) return {}

        const headers = {};
        _.forEach(rawHeaders, (val, key) => {
            if (!key)
                return;

            key = key.replace(reRemove, '');
            if (key.length <= 0)
                return;

            headers[key] = val;
        });

        this.debug(stages.TargetCommunicationStage, { rawHeaders, headers });
        this.debug(stages.TargetCommunicationStage, "SanitizeHeaders completed.");
        return headers;
    }

    createRequestProxyOpts(target) {
        const opts = _.pick(
            url.parse(target),
            'protocol', 'hostname', 'port', 'path'
        );

        if (opts.protocol && opts.protocol === 'https:') {
            opts.ssl = true; // HTTPS over HTTP
        }
        else {
            opts.ssl = false; // HTTP
        }
        delete opts.protocol;

        if (!opts.port) {
            opts.port = opts.ssl ? 443 : 80;
        }

        return opts;
    }
    getAgent() {
        let _agent = new http.Agent();
        let _proxyAgent = new ProxyAgent({ agent: _agent });
        return _proxyAgent
    }
    getProxyOptions() {
        const proxyServer = this.getProxyHost();
        const proxyCredential = this.getProxyServiceCredential();
        const proxyHeaders = this.getProxyInfoHeaders();
        const proxyAgent = this.getAgent();
        const proxyParameters = {
            'hostname': proxyServer.host,
            'port': proxyServer.port,
            'username': proxyCredential.user,
            'password': proxyCredential.password,
            "headers": proxyHeaders
        }
        const requestProxyOpts_ = {
            method: this.request.method,
            headers: this.request.headers,
            agent: proxyAgent,
            proxy: proxyParameters,
        }
        const requestProxyOpts = this.createRequestProxyOpts(this.request.url)
        const proxyOpts = _.merge(requestProxyOpts, requestProxyOpts_);
        return proxyOpts
    }
}

module.exports = {
    HTTPSProxyRequest,
    HTTPProxyRequest
}