/*
 * Library for Storing and Editing data
 *
 */   

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');
// Container for the module to be exported
var lib = {};


// Base directory for data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Write a data to the file
lib.create = (dir, file, data, callback) =>{
    // Open the file for writing
    fs.open(lib.baseDir + dir + '/'+ file+'.json','wx',(err, fileDescriptor)=>{
        if(!err && fileDescriptor){
            // Convert data to string
            const stringData = JSON.stringify(data);

            // Write to file and close it
            fs.writeFile(fileDescriptor, stringData, (err)=>{
                if(!err){
                    fs.close(fileDescriptor, (err)=>{
                        if(!err){
                            callback(false);
                        } else {
                            callback('Error closing to new file')
                        }
                    })
                } else {
                    callback('Error writing to new file');
                }
            });
        } else {
            callback('Could not create new file, it may already exist');
        };
    });
};

// Read data from the file
lib.read = (dir, file, callback)=>{
    fs.readFile(lib.baseDir + dir + '/' + file + '.json','utf8',(err, data)=>{
        if(!err && data) {
            const parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data);
        };      
    });
};

// Update the data in the existing file
lib.update = (dir, file, data, callback)=>{
    // Open the file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json','r+', (err, fileDescriptor)=>{
        if(!err && fileDescriptor){
            // Convert data to string
            const stringData = JSON.stringify(data);
            
            // Truncate the file
            fs.truncate(fileDescriptor, (err)=>{
                if(!err) {
                    // Write to the file and close it
                    fs.writeFile(fileDescriptor, stringData, (err)=>{
                        if(!err){
                            fs.close(fileDescriptor, (err)=>{
                                if(!err){
                                    callback(false);
                                } else {
                                    callback('Error while closing the existing file');
                                };
                            });
                        } else {
                            callback('Error writing to the existing file');
                        };
                    });
                } else {
                    callback('Error truncating file')
                };
            }) ;
        } else {
            callback('Could not open the file for updating, it may not exist yet');
        };
    });
};

// Delete the file
lib.delete = (dir, file, callback)=>{
    // Unlink the file - means removing the file from file system
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', (err)=>{
        if(!err){
            callback(false);
        } else {
            callback('Error deleting the file');
        }
    });
};

// List all the items in the directory
lib.list = (dir, callback) =>{
    fs.readdir(lib.baseDir+dir+'/', (err, data)=>{
        if(!err && data && data.length > 0) {
            const trimmedFileNames = []
            data.forEach((fileName)=>{
                trimmedFileNames.push(fileName.replace('.json', ''))
            });
            callback(false, trimmedFileNames)
        } else {
            callback(err, data);
        };
    });
};

// Export the module
module.exports = lib;