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

let requestStatistics = {
    success: 0,
    failure: 0,
    total: 0
};


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
            app_trace_id: appTraceID,
            app: this.app,
            module: this.module,
            user: "system",            
            rid: null,                         
            stage: stage.stage.toUpperCase(), 
            url: null,
            text: stage.message,
        }
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
}

class ProxyRequestLog extends ProxyLog{
    constructor({...params}) {
        super({app: params.app});
        this.user = params.user;        
        this.url = params.url;
        this.rid = params.rid;
        this.verbose = params.verbose || false;
        this.mode = params.mode;
        this.started = false;
        this.finished = false;
        this.start_time = null;
        this.end_time = null;
        this.protocol = params.protocol
        this.start()
    }
    getMessage(stage){     
        let data = {
            app_trace_id: appTraceID,
            app: this.app,
            module: this.module,
            user: this.user.name || this.user.id,
            rid: this.rid,                         
            stage: stage.stage.toUpperCase(), 
            protocol: this.protocol,
            url: this.url,
            text: stage.message,
        }
        return JSON.stringify(data);
    }
    getRunTime(){
        return this.end_time - this.start_time;
    }    
    start(){
        if(!this.started) requestStatistics.total += 1;
        this.start_time = new Date();
        let stage = stages.BeginStage(this.start_time);   
        this.info(stage);   
    }
    finish({...status}){
        if(!this.finished){
            if (status.success) requestStatistics.success += 1;
            else if (!status.success) requestStatistics.failure += 1;
            this.finished = true;
        } else {
            let stage = stages.FinishStage("Can not call finish() multiple times in the process.");   
            this.warn(stage);
        }        
        this.end_time = new Date();
        let run_time_ms = this.getRunTime();        
        if(run_time_ms >= criticalRunTimeMS){
            let success = status.success || false;
            let stage = stages.FinishStage({run_time_ms, success});  
            logger.info(this.getMessage(stage));
        }         
    }    
}


module.exports = {
    requestStatistics,
    getRequestLog,
    getLog
}