"use strict"


function writeEndRequest(r, code, message, opts) {
    r.writeHead(code, opts);
    return r.end(message);
}

function writeSocket(socket, code, message, opts){
    let text = `HTTP/1.1 ${code}`;

    if (message && message.length >= 0) {
        text += ` ${message}`;
    }

    if (opts) {
        _.forEach(opts, (val, key) => {
            text += `\r\n${key}: ${val}`;
        });
    }
    text += '\r\n\r\n';
    socket.write(text);    
}

function writeEndSocket(socket, code, message, opts) {    
    writeSocket(socket, code, message, opts)
    return socket.end();
}


module.exports = {
    writeEndRequest,
    writeSocket,
    writeEndSocket
}