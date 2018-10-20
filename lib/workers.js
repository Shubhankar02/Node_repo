/*
 * Worker Related task
 *
 */

 // Dependencies
 const path = require('path');
 const fs = require('fs');
 const _data = require('./data');
 const https = require('https');
 const http = require('http');
 const helpers = require('./helpers');
 const url = require('url');

 // Instantiate the worker object
const workers = {};

// Lookup all the checks, get their data, send to validator
workers.gatherAllChecks = ()=>{
    // Get the all of the checks exist in the system
    _data.list('checks', (err, checks)=>{
        if(!err && checks && checks.length > 0) {
            checks.forEach((check)=>{
                // Read the check data
                _data.read('checks', check, (err, originalCheckData)=>{
                    if(!err && originalCheckData) {
                        // Pass the data to the check validator and let that function continue or log error as needed
                        workers.validateCheckData(originalCheckData);
                    } else {
                        console.log('Error reading one of the check data');
                    }
                });
            });
        } else {
            console.log('Error: Could not find any checks to process');
            
        }
    });
}

// Sanity check the check data
workers.validateCheckData = (originalCheckData) =>{
    originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData !== null ? originalCheckData : {};
    originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false;
    originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone.trim() : false;
    originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1  ? originalCheckData.protocol : false;
    originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
    originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1  ? originalCheckData.method : false;
    originalCheckData.successCode = typeof(originalCheckData.successCode) == 'object' && originalCheckData.successCode instanceof Array && originalCheckData.successCode.length > 0 ? originalCheckData.successCode : false;
    originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >=1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.successCode : false;

};

// Timer to execute the worker-process once per minute
workers.loop = ()=>{
    setInterval(()=>{
        workers.gatherAllChecks();
    }, 1000 * 60)
}
// Init script
workers.init = ()=>{
    // Execute  all the checks immediately
    workers.gatherAllChecks();
    // Call a loop so that the checks will execute later on
    workers.loop()
};


// Export the module
module.exports = workers;

