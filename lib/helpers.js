/*
 * Helpers for various task
 *
 */

// Dependencies
const crypto = require('crypto');

// Containers for helpers
const helpers = {};

// Create a SHA256 hash
helpers.hash = (str) =>{
    if(typeof(str) == 'string' && str.length > 0){
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};



// Export the helpers
module.exports = helpers;