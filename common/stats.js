"use strict"

const crypto = require('crypto');

const stages = require("./stages");
const settings = require("../common/settings");

const systemSettings = require("./system_settings");

let criticalRunTime = systemSettings.getCriticalRunTime() || 0;
const criticalRunTimeMS = criticalRunTime * 1000;

const logger = require('./logger');
let appLogger = null;

let appTraceID = crypto.randomUUID();


function getRequestLog(rid, url, user, module, protocol){        
    let verbose = user.getProxyClientVerboseSetting()
    let log = new ProxyRequestLog({app: settings.APP_NAME, module, protocol, url, user, rid, verbose});
    return log
}

function getLog(module){        
    if(!appLogger || appLogger.module != module)
        appLogger = new ProxyLog({app: settings.APP_NAME, module: module});
    return appLogger
}

class ProxyLog{
    constructor({...params}) {
        this.app = params.app;
        this.module = params.module
    }
    getMessage(stage){     
        let data = {
            type: "log",
            app_trace_id: appTraceID,
            app: this.app,
            module: this.module,
            user: "system",            
            rid: null,                                     
            url: null,
            stage: stage.stage.toUpperCase(), 
            message: stage.message,
        }
        return JSON.stringify(data);
    }
    getMetricMessage(metric){     
        let data = {
            type: "metric",            
            unit: metric.unit,
            app_trace_id: appTraceID,
            protocol: this.protocol,
            app: this.app,
            user: this.user.name || this.user.id,
            rid: this.rid,            
            url: this.url
        }
        const metricMessage = metric.getMessage();
        data = { ...data, ...metricMessage}
        return JSON.stringify(data);
    }
    error(stage){
        logger.error(this.getMessage(stage));
    }
    warn(stage){
        logger.warn(this.getMessage(stage));
    }
    info(stage){
        logger.info(this.getMessage(stage));
    }
    debug(stage){
        if(this.verbose) 
            logger.debug(this.getMessage(stage));
    }
    metric(metric){
        logger.info(this.getMetricMessage(metric));
    }
}

class ProxyRequestLog extends ProxyLog{
    constructor({...params}) {
        super({app: params.app});
        this.user = params.user;        
        this.url = params.url;
        this.rid = params.rid;
        this.verbose = params.verbose || false;
        this.mode = params.mode;
        this.protocol = params.protocol        
    }
    getMessage(stage, type="log"){     
        let data = {
            type: type,
            app_trace_id: appTraceID,
            app: this.app,
            module: this.module,
            user: this.user.name || this.user.id,
            rid: this.rid,                         
            stage: stage.stage.toUpperCase(), 
            protocol: this.protocol,
            url: this.url,
            message: stage.message,
        }
        return JSON.stringify(data);
    }          
}


module.exports = {    
    getRequestLog,
    getLog
}