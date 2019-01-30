/*
 * Library for storing and rotating the logs
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

//Container for the module
const lib = {}

// Base directory of the logs folder
lib.baseDir = path.join(__dirname, '/../.logs/');


// Append a string to the file. Create a file if it doesn't exist
lib.append = function(file, str, callback) {
  // Open the file for appending
  fs.open(lib.baseDir + file + '.log', 'a', (err, fileDescriptor) => {
      if(!err && fileDescriptor) {
        // Append to the file and close it
        fs.appendFile(fileDescriptor, str+'\n', (err) => {
            if(!err) {
                fs.close(fileDescriptor, (err) => {
                    if(!err) {
                        callback(false);
                    } else {
                        callback('Error: Closing file that was being appended');
                    }
                });
            } else {
                callback('Error: Apending the file')
            }
        })
      } else {
          callback('Error: could not open the file to append')
      }
  })  
};

// Export the module
module.exports = lib;