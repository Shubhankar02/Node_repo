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

// Checking twilio sms
// helpers.sendTwilioSms('9769051872', 'Hello world!', function(err) {
//     console.log('This is the error', err);
// });


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
    originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >=1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false;

    // Set the keys that may not be set (if the workers have never seen this check before)
    originalCheckData.state = typeof (originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
    originalCheckData.lastChecked = typeof (originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked < 0 ? originalCheckData.lastChecked : false;

    // If all the check pass, pass the data along to the next step in the process
    if(originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.successCode &&
    originalCheckData.timeoutSeconds) {
        workers.performCheck(originalCheckData);
    } else {
        console.log('One of the checks is not properly formatted, skipping it')
    }

};

// Perform the ckeck and send the orignalCheckData and outcome of the check process, to the next step in the process.
workers.performCheck = function (originalCheckData) {
    // Perform the initial check outcome
    const checkOutcome = {
        'error' : false,
        'responseCode' : false
    }

    // Mark that the outcome has not been sent yet
    let outcomeSent = false;

    // Parse the hostname and the path out of the original check data
    const parsedUrl = url.parse(originalCheckData.protocol+'://'+originalCheckData.url, true);
    const hostname = parsedUrl.hostname;
    const path = parsedUrl.path; // Using path not pathname because we want the query string


    // Construct the request
    const requestDetails = {
        'protocol' : originalCheckData.protocol + ':',
        'hostname' : hostname,
        'method' : originalCheckData.method.toUpperCase(),
        'path' : path,
        'timeout' : originalCheckData.timeoutSeconds * 1000
    };

    // Instantiate te request object using either http or https module
    const _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
    const req = _moduleToUse.request(requestDetails, (res)=>{
        // Grab the status of the sent request
        const status= res.statusCode;

        // Update the checkOutCome and pass the data along
        checkOutcome.responseCode = status;
        if(!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error', (e)=>{
        // Update the checkOutCome and pass the data along
        checkOutcome.error = {
            'error' : true,
            'value' : e
        };
        if (!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        };
    });

    // Bind to the timeout event
    req.on('timeout', (e) => {
        // Update the checkOutCome and pass the data along
        checkOutcome.error = {
            'error': true,
            'value': timeout
        };
        if (!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        };
    });

    // End the request
    req.end();

};

// Process the check outcome, update the check data as needed, trigger the alert to user if needed
// Special logic for accomodating a check that has never been tested before (don't want to alert on that one)




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
    workers.loop();
};


// Export the module
module.exports = workers;
