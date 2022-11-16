'use strict';

const http = require('http');
const stages = require("../common/stages");


function request(proxyAppRequest) {
    proxyAppRequest.debug(stages.ClientRequestStage, "Processing client request.");

    const clientRequest = proxyAppRequest.request;
    const clientResponse = proxyAppRequest.response;

    let timeoutSecs = proxyAppRequest.timeoutSecs || 10;

    clientRequest.on('error', (err) => {
        proxyAppRequest.handlerError(stages.ClientRequestStage, err);
        return clientRequest.end()
    });

    clientResponse.on('error', (err) => {
        proxyAppRequest.handlerError(stages.ClientResponseStage, err);
        return clientResponse.end()
    });

    const proxyOpts = proxyAppRequest.getProxyOptions()
    const proxyRequest = http.request(proxyOpts);
    let errorHandlerAlready = false;

    let socket;
    let finished = false;

    proxyRequest.on('socket', proxyConnectionSocket => {
        socket = proxyConnectionSocket;
        proxyAppRequest.debug(stages.ProxySocketStage, "Connected to proxy.");
        proxyConnectionSocket.setTimeout(timeoutSecs * 1000);
        clientRequest.pipe(proxyRequest, { end: true });
        proxyConnectionSocket.on('timeout', function () {
            let error_message = `Target Idle connection timeout (${timeoutSecs}s).`;
            let stage = proxyAppRequest.handlerError(stages.ProxyCommunicationStage, error_message);            
            errorHandlerAlready = true;
            proxyRequest.destroy();
            return proxyAppRequest.writeEndSocket(clientResponse, 504, stage.user_response);
        });
        proxyConnectionSocket.on("end", () => {
            if(!finished){
                proxyAppRequest.getDataTransferSize(proxyConnectionSocket, proxyResponse);
                proxyAppRequest.finish(stages.ProxyConnEndStage);
                finished = true;
            }                
        })
    });

    proxyRequest.on('error', (err) => {
        if (!errorHandlerAlready) {
            let stage = proxyAppRequest.handlerError(stages.ProxyConnStage, err);
            return proxyAppRequest.writeEndRequest(clientResponse, 500, stage.user_response);
        }
        return clientResponse.destroy();
    });

    proxyRequest.on('response', (proxyResponse) => {
        proxyResponse.on('error', (err) => {
            let stage = proxyAppRequest.handlerError(stages.ProxySocketStage, err);
            return proxyAppRequest.writeEndRequest(clientResponse, 500, stage.user_response);
        });

        proxyResponse.on('end', () => {    
            if(!finished){
                proxyAppRequest.getDataTransferSize(socket, proxyResponse);
                proxyAppRequest.finish(stages.ProxyConnEndStage);
                finished = true;
            }
        });

        const cleanHeaders = proxyAppRequest.sanitizeHeaders(proxyResponse.headers);
        clientResponse.writeHead(proxyResponse.statusCode, cleanHeaders);
        proxyResponse.pipe(clientResponse);
    });

    // clientRequest.pipe(targetRequest);
}

module.exports = request
