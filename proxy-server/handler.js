"use strict";

const net = require('net');
const stages = require("../common/stages");

function serverConnect(proxyAppRequest, head, params) {
    proxyAppRequest.debug(stages.ClientRequestStage, "Processing proxy request.");
    
    const clientRequest = proxyAppRequest.request;
    const clientResponseSocket = proxyAppRequest.response;
    const timeoutSecs = params.timeoutSecs;
    const target = params.target;
    const proxyHost = params.proxyHost;

    clientRequest.on('error', err => {
        proxyAppRequest.handlerError(stages.ClientRequestStage, err);
        return clientRequest.end()
    });

    clientResponseSocket.on('error', (err) => {
        proxyAppRequest.handlerError(stages.ClientResponseStage, err);
        return clientResponseSocket.end();
    });

    const targetSocket = net.Socket();
    targetSocket.connect(target.port, target.hostname, () => {
        proxyAppRequest.debug(stages.TargetCommunicationStage, 
            `Listening to target socket via proxy server=(${proxyHost})`);
        targetSocket.setTimeout(timeoutSecs * 1000);
        proxyAppRequest.debug(stages.ProxyConnStage, `Proxy connection timeout set to (${timeoutSecs} secs)`);

        clientResponseSocket.write('HTTP/1.1 200 Connection established\r\n\r\n');
        targetSocket.write(head);

        clientResponseSocket.pipe(targetSocket);
        targetSocket.pipe(clientResponseSocket);
    });

    targetSocket.on('timeout', function () {
        let error_message = `Target Idle connection timeout (${timeoutSecs}s).`;
        proxyAppRequest.handlerError(stages.TargetCommunicationStage, error_message);
        targetSocket.destroy();
        clientResponseSocket.destroy();
    });

    targetSocket.on('error', (err) => {
        proxyAppRequest.handlerError(stages.TargetCommunicationStage, err);
        return clientResponseSocket.destroy();
    });

    targetSocket.on('end', () => {
        proxyAppRequest.getDataTransferSize(targetSocket, null);
        proxyAppRequest.finish(stages.TargetConnEndStage);
        targetSocket.destroy()
    });
}


module.exports = {
    serverConnect
}