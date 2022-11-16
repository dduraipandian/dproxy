"use strict"

class LogStage {
    constructor({ stage, message, user_response = "" }) {
        this.message = message;
        this.stage = stage;
        this.user_response = user_response;
    }

    getLogMessage() {
        return `${prefix} ${message}`;
    }
}

function getStageInstance({ ...params }) {
    return new LogStage({ ...params })
}

const UserStage = (message) => getStageInstance({
    stage: "user",
    user_response: null,
    message: message
})

const ClientRequestStage = (message) => getStageInstance({
    stage: "client_request",
    user_response: "Request error from client",
    message: message
})

const ClientResponseStage = (message) => getStageInstance({
    stage: "client_response",
    user_response: "Response error from client",
    message: message
})

const ClientSocketStage = (message) => getStageInstance({
    stage: "client_socket",
    user_response: "Socket error from client",
    message: message
})

const ProxyConnStage = (message) => getStageInstance({
    stage: "proxy_connection",
    user_response: "Request error from proxy",
    message: message
})
const ProxySocketStage = (message) => getStageInstance({
    stage: "proxy_socket",
    user_response: "Response error from target",
    message: message
})
const ProxyCommunicationStage = (message) => getStageInstance({
    stage: "proxy_connection",
    message: message,
    user_response: "Connection to the url is idle for long time without any data transfer. Check if the given url is functioning in the browser and reach out to suppot@scraperant.com for further assistance."
})

const ProxyConnEndStage = (message) => getStageInstance({
    stage: "proxy_done",
    message: message
})

const TargetConnStage = (message) => getStageInstance({
    stage: "target_connection", 
    user_response: "Request error from proxy", 
    message: message
})

const TargetSocketStage = (message) => getStageInstance({
    stage: "target_socket",
    user_response: "Response error from target",
    message: message
})
const TargetCommunicationStage = (message) => getStageInstance({
    stage: "target_connection",
    message: message,
    user_response: "Connection to the url is idle for long time without any data transfer. Check if the given url is functioning in the browser and reach out to suppot@scraperant.com for further assistance."
})

const TargetConnEndStage = (message) => getStageInstance({
    stage: "target_done",
    message: message
})

const ProxyAuthorizationStage = (message) => getStageInstance({
    stage: "proxy_authorization",
    message: message
})

const ProxyClientStage = (message) => getStageInstance({
    stage: "proxy_client_socket_conn",
    message: message
})

const PayloadParsingStage = (message) => getStageInstance({
    stage: "payload_validation",
    message: message,
    user_response: "Invalid Payload to the request."
})

const URLValidationStage = (message) => getStageInstance({
    stage: "url_validation",
    message: message,
    user_response: "Invalid URL."
})

const BeginStage = (message) => getStageInstance({
    stage: "start",
    message: message
})
const FinishStage = (message) => getStageInstance({
    stage: "completion",
    message: message
})
const ResponseAnalysisStage = (message) => getStageInstance({
    stage: "response_analysis",
    message: message
})


module.exports = {
    UserStage,

    PayloadParsingStage,
    URLValidationStage,

    ClientRequestStage,
    ClientSocketStage,
    ClientResponseStage,

    ProxyConnStage,
    ProxySocketStage,
    ProxyCommunicationStage,
    ProxyConnEndStage,

    TargetConnStage,
    TargetSocketStage,
    TargetCommunicationStage,
    TargetConnEndStage,

    ProxyAuthorizationStage,
    ProxyClientStage,

    BeginStage,
    FinishStage,
    ResponseAnalysisStage
}