/*
 * Library for Storing and Editing data
 *
 */   

// Dependencies
const fs = require('fs');
const path = require('path');

// Container for the module to be exported
var lib = {};


// Base directory for data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Write a data to the file
lib.create = (dir, file, data, callback) =>{
    // Open the file for writing
    fs.open(lib.baseDir + dir + '/'+ file+'.json','wx',(err, fileDescriptor){
        if(!err && fileDescriptor){
            
        } else {
            callback('Could not create new file, it may already exist');
        };
    });
}



// Export the module
module.exports = lib;