'use strict';

const http = require('http');
const stages = require("../common/stages");


function connect(proxyAppRequest) {
    proxyAppRequest.debug(stages.ClientRequestStage, "Processing client request.");
    const clientRequest = proxyAppRequest.request;
    const clientResponseSocket = proxyAppRequest.response;

    let timeoutSecs = proxyAppRequest.timeoutSecs || 10;

    clientRequest.on('error', err => {
        proxyAppRequest.handlerError(stages.ClientRequestStage, err);
        return clientRequest.end()
    });

    clientResponseSocket.on('error', err => {
        proxyAppRequest.handlerError(stages.ClientResponseStage, err);
        return clientResponseSocket.end()
    });

    const proxyOpts = proxyAppRequest.getProxyOptions();
    const proxyRequest = http.request(proxyOpts);

    proxyRequest.on('error', (err) => {
        let stage = proxyAppRequest.handlerError(stages.ProxyConnStage, err);
        return proxyAppRequest.writeEndSocket(clientResponseSocket, 500, stage.user_response);
    });

    proxyRequest.on('connect', (_proxy_req, proxyConnectionSocket) => {
        proxyAppRequest.debug(stages.ProxyCommunicationStage, `Listening to target socket via proxy server=(${proxyOpts.host})`);
        proxyConnectionSocket.setTimeout(timeoutSecs * 1000);
        proxyAppRequest.debug(stages.ProxyConnStage, `Proxy connection timeout set to (${timeoutSecs} secs)`);

        proxyConnectionSocket.on('error', (err) => {
            proxyAppRequest.handlerError(stages.ProxySocketStage, err);
            proxyConnectionSocket.destroy();
            clientResponseSocket.destroy();
        });

        proxyConnectionSocket.on('timeout', () => {
            let error_message = `Target Idle connection timeout (${timeoutSecs}s).`;
            proxyAppRequest.handlerError(stages.ProxyCommunicationStage, error_message);
            // you  can't write response from proxy as it is tunneled and secure
            proxyConnectionSocket.destroy();
            proxyRequest.end();
            clientResponseSocket.destroy();
        });

        proxyConnectionSocket.on('end', () => {
            proxyAppRequest.getDataTransferSize(proxyConnectionSocket, null);
            proxyAppRequest.finish(stages.ProxyConnEndStage);
            return proxyRequest.destroy();
        });

        clientResponseSocket.write('HTTP/1.1 200 Connection established\r\n\r\n');
        proxyConnectionSocket.pipe(clientResponseSocket).pipe(proxyConnectionSocket);
    });

    proxyRequest.end();
}

module.exports = connect