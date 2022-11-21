"use strict";

const url = require('url');
const stages = require("./stages");
const stats = require("./stats");
const utils = require("./utils");

const basicAuth = utils.getBasicAuth();

class ProxyRequest {
    constructor(request, response, rid, user, protocol) {
        this.success = true;
        this.request = request;
        this.response = response;
        this.url = this.request.url;
        this.rid = rid;
        this.user = user;
        this.protocol = protocol;
        this.log = stats.getRequestLog(this.rid, this.url, this.user, "request", protocol);
        this.debug(stages.UserStage, "Fetched user from DB.");
    }

    debug(stageFunction, message) {
        this.log.debug(stageFunction(message));
    }

    getProxyServiceCredential() {
        return utils.getProxyServiceCredential()
    }

    getBasicAuthToken() {
        return basicAuth
    }

    handlerError(stageFunction, err) {
        this.success = false;
        let stage = stageFunction(err.stack || err);
        this.log.error(stage);
        this.log.finish({ success: this.success });
        return stage
    }

    finish(stageFunction) {
        this.debug(stageFunction, `Proxy completed success=(${this.success}).`);
        this.log.finish({ success: this.success });
    }

    getResponseSize(targetResponse) {
        const headers = utils.getCleanHeaders(targetResponse.rawHeaders);
        let headerLength = 0;
        let contentLength = 0;
        try {
            contentLength = parseInt(headers["Content-Length"])
            var temp = JSON.stringify(targetResponse.rawHeaders).replace(/[\[\]\,\"]/g, ''); //stringify and remove all "stringification" extra data
            headerLength = temp.length
        } catch (err) {
            this.handlerError(stages.ResponseAnalysisStage, err)
        }
        return headerLength + contentLength
    }

    getDataTransferSize(socket, response) {
        this.dataTransferSize = socket ? socket.bytesRead : 0;
        // you can not read response data for https connection as it is tunnelled and secured.
        // socket.bytesRead will be much less than what you see as response size, 
        // because it is compressed using gzip. to request plain text 
        // use header "Accept-Encoding": "identity"
        // https://www.rfc-editor.org/rfc/rfc9110.html#name-accept-encoding 
        this.responseSize = response ? this.getResponseSize(response) : null;        
        this.debug(stages.ResponseAnalysisStage, `dataTransferSize: ${this.dataTransferSize}`);
        this.debug(stages.ResponseAnalysisStage, `responseSize: ${this.responseSize}`);
    }

    getResponseHeaders(rawHeaders) {
        /*
        Request headers will be array in the socket raw headers. 
        This function converts them to object.
        */
        let headers = {}
        for (let i = 0; i < rawHeaders.length; i += 2) {
            headers[rawHeaders[i]] = rawHeaders[i + 1]
        }
        return headers
    }

    validateURL() {
        const url = this.url;
        const valid = true;
        const message = "";
        const returnValidatedData = (valid, message, host) => { return { valid, message, host } };

        if (!url) {
            return returnValidatedData(false, "No URL found");
        }

        const part = url.split(':');
        if (part.length !== 2) {
            return returnValidatedData(false, "Cannot parse url (1)");
        }

        const hostname = part[0];
        const port_ = part[1].split("/")
        const port = parseInt(port_[0]);

        if (!hostname || !port) {
            return returnValidatedData(false, "Cannot parse url (2)");
        }

        return returnValidatedData(valid, message, { hostname, port })
    }

    writeEndClient(code, message) {
        return True
    }
}


module.exports = ProxyRequest
