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
        'accountSid': 'AC77bc098c57d1fea6f006c8ad42b15337',
        'authToken': 'f3e189daaa96540107f4eedcab9118b8',
        'fromPhone': '+18508528894',
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
         'accountSid': '',
         'authToken': '',
         'fromPhone': '',
     }
 };

 // Determine which env should be exported was passed in cmd argument
 const currentEnviornment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
 
 // Check the current enviornment is one of the above, if not, set to default
 const enviornmentToExport = typeof(enviornment[currentEnviornment]) == 'object' ? enviornment[currentEnviornment] : enviornment.staging

 // Export the module
 module.exports = enviornmentToExport;