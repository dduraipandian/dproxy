"use strict"

function getCleanHeaders(rawHeaders) {
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

function getProxyServiceCredential() {
    let user = "durai";
    let password = "dura1p@ndiantest$123";
    return { user, password }
}

function getBasicAuth() {
    const proxyCredential = this.getProxyServiceCredential();
    const userPass = `${proxyCredential.user}:${proxyCredential.password}`
    const usernamePasswordB64 = Buffer.from(userPass).toString('base64');
    return `Basic ${usernamePasswordB64}`
}

module.exports = {
    getCleanHeaders,
    getProxyServiceCredential,
    getBasicAuth
}