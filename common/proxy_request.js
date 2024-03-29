"use strict";

const url = require('url');
const stages = require("./stages");
const Metric = require("./metrics");
const stats = require("./stats");
const utils = require("./utils");

const basicAuth = utils.getBasicAuth();

let requestStatistics = {
    success: 0,
    failure: 0,
    total: 0
};

class ProxyRequest {
    constructor(request, response, rid, user, protocol) {
        this.success = true;
        this.request = request;
        this.response = response;
        this.url = this.request.url;
        this.rid = rid;
        this.user = user;
        this.protocol = protocol;
        this.metric = new Metric();
        this.log = stats.getRequestLog(this.rid, this.url, this.user, "request", protocol);
        this.debug(stages.UserStage, "Fetched user from DB.");
        this.start_time = null;
        this.end_time = null;
        this.finished = false;
        this.start()
    }
    getRunTime(){
        return this.end_time - this.start_time;
    }  
    start(){
        requestStatistics.total += 1;
        this.start_time = new Date();
        let stage = stages.BeginStage(`Starting the request`);   
        this.log.info(stage);   
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
        this.finish(stageFunction);
        return stage
    }

    finish(stageFunction) {         
        if(this.finished){
            let stage = stages.FinishStage("Can not call finish() multiple times in the process.");   
            this.log.warn(stage);
            return;
        }            
        
        if (this.success) requestStatistics.success += 1;
        else if (!this.success) requestStatistics.failure += 1;
        
        this.debug(stageFunction, `Proxy completed success=(${this.success}).`);
        this.metric.setSuccess(this.success);
        this.end_time = new Date();
        let run_time_ms = this.getRunTime();                
        this.metric.setRunTime(run_time_ms);
        this.finished = true;                
        this.log.metric(this.metric);      
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
        let dataTransferSize = socket ? socket.bytesRead : 0;
        // you can not read response data for https connection as it is tunnelled and secured.
        // socket.bytesRead will be much less than what you see as response size, 
        // because it is compressed using gzip. to request plain text 
        // use header "Accept-Encoding": "identity"
        // https://www.rfc-editor.org/rfc/rfc9110.html#name-accept-encoding 
        let responseSize = response ? this.getResponseSize(response) : null;  
        this.metric.setDataTransferSize(dataTransferSize);
        this.metric.setResponseSize(responseSize);

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


module.exports = {
    ProxyRequest,
    requestStatistics,
}
