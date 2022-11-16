"use strict"

const stats = require("../common/stats");

function getServerHealth() {
    /*
    Gets server health data for monitoring.
    */
    const data = {
        uptime: process.uptime(),
        request: stats.requestStatistics,
        message: 'Ok',
        date: new Date()
    }
    return data
}

module.exports = {
    getServerHealth
}