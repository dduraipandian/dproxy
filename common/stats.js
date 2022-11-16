"use strict"

const Logger = require('logplease');
const stages = require("./stages");

const systemSettings = require("./system_settings");

let criticalRunTime = systemSettings.getCriticalRunTime() || 0;
const criticalRunTimeMS = criticalRunTime * 1000;

let logger = null;

Logger.setLogLevel(Logger.LogLevels.DEBUG);

let requestStatistics = {
    success: 0,
    failure: 0,
    total: 0
};

function setAppLogger(app){
    if(!logger) logger = Logger.create(app);
}


function getLog(rid, url, user, app){    
    if(!logger)
        logger = Logger.create(app);
        
    let verbose = user.getProxyClientVerboseSetting()
    let log = new ProxyLog({url, user, rid, verbose});
    return log
}


class ProxyLog{
    constructor({...params}) {
        this.user = params.user;        
        this.url = params.url;
        this.rid = params.rid;
        this.verbose = params.verbose || false;
        this.mode = params.mode;
        this.started = false;
        this.finished = false;
        this.start_time = null;
        this.end_time = null;
        this.start()
    }
    getMessage(stage){     
        let data = {
            user: this.user.name || this.user.id,
            rid: this.rid,                         
            stage: stage.stage.toUpperCase(), 
            url: this.url,
            message: stage.message,
        }
        return JSON.stringify(data);
    }
    getRunTime(){
        return this.end_time - this.start_time;
    }
    error(stage){
        logger.error(this.getMessage(stage));
    }
    warn(stage){
        logger.warn(this.getMessage(stage));
    }
    info(stage){        
        if(this.verbose) 
            logger.info(this.getMessage(stage));
    }
    debug(stage){
        if(this.verbose) 
            logger.debug(this.getMessage(stage));
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
    start(){
        if(!this.started) requestStatistics.total += 1;
        this.start_time = new Date();
        let stage = stages.BeginStage(this.start_time);   
        this.info(stage);   
    }
}


module.exports = {
    requestStatistics,
    setAppLogger,
    ProxyLog,
    getLog
}