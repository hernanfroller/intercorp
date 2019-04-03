'use strict'

const log4js = require("log4js");
const config = require('../bin/config');

log4js.configure({
    appenders: { log: { type: 'file', filename: config.environment.LOG } },
    categories: { default: { appenders: ['log'], level: 'error' } }
});

let logger = log4js.getLogger();
logger.level = 'debug';

function appDbLog(data) {
    if(data.type && data.fn && data.timer && data.db) {
        let seconds = Math.abs((data.timer - new Date().getTime())/1000);
        if(seconds >= 10) {
            let msg = `API FUNCTION: ${data.fn} - `;
            msg += data.support ? `SUPPORT FUNCTION: ${data.support} - ` : "";
            switch(data.type) {
                case "trace":
                    //msg += `TRACE SUCCESS SQL QUERY IN ${seconds} SECONDS - INSPECT DB CONNECTION: \n${util.inspect(data.db, {showHidden: false, depth: null})}`;
                    msg += `TRACE SUCCESS SQL QUERY IN ${seconds} SECONDS`;
                    logger.trace(msg);
                    break;
                case "info":
                    //msg += `SUCCESS SQL QUERY IN ${seconds} SECONDS - INSPECT DB CONNECTION: \n${util.inspect(data.db, {showHidden: false, depth: null})}`;
                    msg += `SUCCESS SQL QUERY IN ${seconds} SECONDS`;
                    logger.info(msg);
                    break;
                case "warn":
                    //msg += `WARNING SQL QUERY IN ${seconds} SECONDS - INSPECT DB CONNECTION: \n${util.inspect(data.db, {showHidden: false, depth: null})}`;
                    msg += `WARNING SQL QUERY IN ${seconds} SECONDS`;
                    logger.warn(msg);
                    break;
                case "error":
                    //msg += `ERROR SQL QUERY IN ${seconds} SECONDS - INSPECT DB CONNECTION: \n${util.inspect(data.db, {showHidden: false, depth: null})}`;
                    msg += `ERROR SQL QUERY IN ${seconds} SECONDS`;
                    logger.error(msg);
                    break;
            }
            console.log(msg);
        }
    }
}

function appLog(data) {
    if(data.type && data.fn && data.msg) {
        let msg = `FUNCTION: ${data.fn} - `;
        switch(data.type) {
            case "trace":
                msg += `[TRACE] ${data.msg}`;
                logger.trace(msg);
                break;
            case "info":
                msg += `[INFO] ${data.msg}`;
                logger.info(msg);
                break;
            case "warn":
                msg += `[WARNING] ${data.msg}`;
                logger.warn(msg);
                break;
            case "error":
                msg += `[ERROR] ${data.msg}`;
                logger.error(msg);
                break;
        }
        console.log(msg);
    }
}

module.exports = {
    appDbLog,
    appLog
}