"use strict"

class Metric {    
    setDataTransferSize(in_bytes){
        this.dataTransferSize = in_bytes;
    }
    setResponseSize(in_bytes){
        this.responseSize = in_bytes;
    }
    setSuccess(in_bool){
        this.success = in_bool;
    }
    setRunTime(in_ms){
        this.runTime = in_ms
    }
    getMessage(){
        return {
            success: this.success,
            runTime: this.runTime,
            responseSize: this.responseSize,
            dataTransferSize: this.dataTransferSize,
        }
    }
}

module.exports = Metric