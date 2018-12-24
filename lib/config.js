/*
 * Create and export configuration variable
 */

 // Container for all the exviornments
 const enviornment = {};

 // Staging (default) enviornment
 enviornment.staging = {
    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName' : 'staging',
    'hashingSecret' : 'thisIsASecret',
    'maxChecks': 5,
    'twilio' : {
        'accountSid': 'AC3fa60f22ed6b2aaff24e295f86dcc8eb',
        'authToken': '9798b6ad5192cc9fbfc6d120924d660c',
        'fromPhone': '+17197939549'
    }
 };

 // Production enviornment
 enviornment.production = {
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName' : 'production',
    'hashingSecret' : 'thisIsAlsoASecret',
    'maxChecks': 5,
     'twilio': {
         'accountSid': 'AC3ee43115267056ca74068f3e3f74c5a7',
         'authToken': '1f1f95ed3a476471449e9b784c85626a',
         'fromPhone': '+18508528894',
     }
 };

 // Determine which env should be exported was passed in cmd argument
 const currentEnviornment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
 
 // Check the current enviornment is one of the above, if not, set to default
 const enviornmentToExport = typeof(enviornment[currentEnviornment]) == 'object' ? enviornment[currentEnviornment] : enviornment.staging

 // Export the module
 module.exports = enviornmentToExport;