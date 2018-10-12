/*
 *This are the request handlers
 *
 */

// Dependenies
const _data = require('./data');

// Define handlers
const handlers = {};

// Users
handlers.users = (data, callback)=>{
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    };
};

// Container for the users ssubmethod
handlers._users = {};

// Users-Get
handlers._users.get = (data, callback)=>{

};


// Users-Post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: None
handlers._users.post = (data, callback)=>{
    // Check that all the fields are filled out
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure user doesnt already exist
        _data.read('users', phone, (err,data)=>{
            if(err) {

            } else {
                // User with the phone number already exist
                callback(400, {'Error' : 'User with the phone no already exist'})
            }
        });
    } else {
        callback(400, {'Error': 'Missing required fields'});
    };

};

// Users-Put
handlers._users.put = (data, callback)=>{

};

// Users-Delete
handlers._users.delete = (data, callback)=>{

};

// Define ping handlers
handlers.ping = (data, callback) => {
    callback(200);
};

handlers.hello = (data, callback) =>{
    callback(200, {'message': 'Hello World!, This is my first assignment'})
}

// Not found handlers
handlers.notFound = (data, callback) => {
    callback(404);
};

// Export the module
module.exports = handlers;