/*
 *This are the request handlers
 *
 */

// Dependenies
const _data = require('./data');
const helpers = require('./helpers');

// Define handlers
const handlers = {};

// Users
handlers.users = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for the users ssubmethod
handlers._users = {};


// Users-Post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: None
handlers._users.post = (data, callback) => {
    // Check that all the fields are filled out
    const firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure user doesnt already exist
        _data.read('users', phone, (err, data) => {
            if (err) {
                // Hash the password
                const hashedPassword = helpers.hash(password);

                // Create the user object
                if (hashedPassword) {
                    const userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    };

                    // Store the user
                    _data.create('users', phone, userObject, (err) => {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, {
                                'Error': 'Could not create the new user'
                            });
                        };
                    });
                } else {
                    callback(500, {
                        'Error': 'Could not hash the user\'s password'
                    });
                }

            } else {
                // User with the phone number already exist
                callback(400, {
                    'Error': 'User with the phone no already exist'
                })
            }
        });
    } else {
        callback(400, {
            'Error': 'Missing required fields'
        });
    };

};

// Users-Get
// Required data : Phone
// Optional data : name
// @TODO: Only let an authenticated user access their objects.
handlers._users.get = (data, callback) => {
    // Check that the phone number is valid
    const phone =
        typeof (data.queryStringObject.phone) == 'string' &&
        data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        // Lookup the user
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                // Remove the hashed password from the user object before returing it to the requester
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404);
            }
        })
    } else {
        callback(400, {
            'Error': 'Missing the required phone number'
        })
    }
};

// Users-Put
// Required data : phone
// Optional data : firstName, lastName, password (at least one must be specified)
// @TODO Only let the authenticated user to update their own object.
handlers._users.put = (data, callback) => {
    // Check for the require field
    const phone =
        typeof (data.payload.phone) == 'string' &&
        data.payload.phone.trim().length == 10 ?
        data.payload.phone.trim() : false;

    // Check for the optional fields
    const firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if the phone is invalid
    if (phone) {
        // Error if nothing is sent to update
        if (firstName || lastName || password) {
            // Lookup user
            _data.read('users', phone, (err, userData) => {
                if (!err && userData) {
                    //Update the necessary fields
                    if (firstName) {
                        userData.firstName = firstName;
                    };
                    if (lastName) {
                        userData.lastName = lastName;
                    };
                    if (password) {
                        userData.hashedPassword = helpers.hash(password);
                    };
                    // Store the new updates
                    _data.update('users', phone, userData, (err) => {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {
                                'Error': 'Could not update the user'
                            });
                        };
                    });
                } else {
                    callback(400, {
                        'Error': 'The specified user does not exist'
                    });
                }
            })
        } else {
            callback(400, {
                'Error': 'Missing required field'
            });
        }
    } else {
        callback(400, {
            'Error': 'Missing required field'
        });
    }


};

// Users-Delete
// Required field : phone
// @TODO Only let the authenticated user to delete their object
// @TODO Cleanup (delete) any other data files associated with the user
handlers._users.delete = (data, callback) => {
    // Check that the phone number is valid
    const phone =
        typeof (data.queryStringObject.phone) == 'string' &&
        data.queryStringObject.phone.trim().length == 10 ? 
        data.queryStringObject.phone.trim() : false;
    if (phone) {
        // Lookup the user
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
              _data.delete('users', phone, (err)=>{
                  if(!err){
                      callback(200);
                  } else {
                      callback(500,{'Error':'Could not delete the specified user'});
                  }
              })
            } else {
                callback(400, {'Error':'Could not find the specified user'});
            };
        })
    } else {
        callback(400, {
            'Error': 'Missing the required phone number'
        });
    };
};

// Tokens
handlers.tokens = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for all the tokens method
handlers._tokens = {};


// Tokens - Post
// Required data: Phone, password
// Optional data: none
handlers._tokens.post = (data, callback)=>{
    const phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof (data.payload.password) == 'string' && 
        data.payload.password.trim().length > 0 ?
        data.payload.password.trim() : false;
    if(phone && password) {
        // Lookup the user who matches that phone number
        _data.read('users', phone, (err, userData)=>{
            if(!err && userData) {
                // Hashed the sent password and compare it to the password store in the user object
                const hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.hashedPassword) {
                    // If valid, create a new token with random name, Set expression date 1 hour in the future
                    const tokenID = helpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenObject = {
                        'phone' : phone,
                        'id' : tokenID,
                        'expires' : expires
                    };

                    // Store the token
                    _data.create('tokens', tokenID, tokenObject, (err)=>{
                        if(!err){
                            callback(200, tokenObject);
                        } else {
                            callback(500, {'Error': 'Could not create the new token'});
                        };
                    });

                } else {
                    callback(400, {'Error': 'Password did not matched the specified user\'s stored password' });
                }
            } else {
                callback(400, {'Error': 'Could not find the specified user'});
            }
        });
    } else {
        callback(400, {'Error':'Missing the required fields'})
    }
};

// Tokens - Get
handlers._tokens.get = (data, callback)=>{
    
};

// Tokens - Put
handlers._tokens.put = (data, callback)=>{
    
};

// Tokens - Delete
handlers._tokens.delete = (data, callback)=>{
    
};



// Define ping handlers
handlers.ping = (data, callback) => {
    callback(200);
};

handlers.hello = (data, callback) => {
    callback(200, {
        'message': 'Hello World!, This is my first assignment'
    })
}

// Not found handlers
handlers.notFound = (data, callback) => {
    callback(404);
};

// Export the module
module.exports = handlers;