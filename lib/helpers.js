/*
 * Helpers for various task
 *
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');

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

// Parse the JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = (str)=>{
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch (e) {
        return {}
    };
};

// Create a string of random alphnumeric characters, of a given length
helpers.createRandomString = (strLength)=>{
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if(strLength) {
        // Define all the possible characters that could go into the strings
        const possibleCharacters = 'abcdefghijklmnopqrstuvwyz0123456789';

        // Start the final string
        let str = ''
        for (let i=1; i<=strLength; i++){
            // Get a random character from the possible characters string
            const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length)) 
            // Append this character to the final string
            str += randomCharacter
        }

        // Return the final String
        return str;

    } else {
        return false;
    }
}

// Export the helpers
module.exports = helpers;

// Send an SMS by Twillio
helpers.sendTwillioSms = (phone, msg, callback)=>{
    // Validate the parameters
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <=1600 ? msg.trim() : false;
    if(phone && msg) {
        // Configure the request payload
        
    } else {
        callback('Given Parameters were missing or invalid');
    }

}