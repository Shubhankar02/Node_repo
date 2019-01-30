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
lib.append = function (file, str, callback) {
    // Open the file for appending
    fs.open(lib.baseDir + file + '.log', 'a', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // Append to the file and close it
            fs.appendFile(fileDescriptor, str + '\n', (err) => {
                if (!err) {
                    fs.close(fileDescriptor, (err) => {
                        if (!err) {
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
    });
};

// List all the logs and optionally compressed all the logs
lib.list = function (includeCompressedLog, callback) {
    fs.readdir(lib.baseDir, (err, data) => {
        if (!err && data && data.length > 0) {
            const trimmedFileName = [];
            data.forEach(function (fileName) {
                // Add the .log files
                if (fileName.indexOf('.log') > -1) {
                    trimmedFileName.push(fileName.replace('.log', ''));
                }

                // Add .gz files 
                if (fileName.indexOf('gz.b64') > -1 && includeCompressedLog) {
                    trimmedFileName.push(fileName.replace('.gz.b64', ''));
                }
            });
            callback(false, trimmedFileName);
        } else {
            callback(err, data);
        }
    });
};

// Compress the content of one .log file into a .gz.b64 file within the same folder
lib.compress = function (logId, newFileId, callback) {
    const sourceFile = logId + '.log';
    const destFile = newFileId + '.gz.b64';

    // Read the source file
    fs.readFile(lib.baseDir+sourceFile, 'utf8', (err, inputString) => {
        if (!err && inputString) {
            // Compress the data using gzip
            zlib.gzip(inputString, (err, buffer) => {
                if (!err && buffer) {
                    // Send the data to the destination file
                    fs.open(lib.baseDir + destFile, 'wx', (err, fileDescriptor) => {
                        if (!err && fileDescriptor) {
                            // Write to the destination file
                            fs.writeFile(fileDescriptor, buffer.toString('base64'), (err) => {
                                if (!err) {
                                    fs.close(fileDescriptor, (err) => {
                                        if (!err) {
                                            callback(false);
                                        } else {
                                            callback(err);
                                        }
                                    });
                                } else {
                                    callback(err);
                                }
                            })
                        } else {
                            callback(err);
                        }
                    });

                } else {
                    callback(err);
                }
            })
        } else {
            callback(err);
        }
    });
};

// Decompress the content of the .gz.b64 file into a string variable
lib.decompress = function (fileId, callback) {
    const fileName = fileId + '.gz.b64';
    fs.readFile(lib.baseDir + fileName, 'utf8', (err, str) => {
        if(!err && str) {
            // Decompress the data
            const inputBuffer = Buffer.from(str, 'base64');
            zlib.unzip(inputBuffer, (err, outputBuffer) => {
                if(!err && outputBuffer) {
                    const str = outputBuffer.toString();
                    callback(false, str);
                } else {
                    callback(err);
                };
            });
        } else {
            callback(err);
        }
    });
};

// Truncating the log file
lib.truncate = function(logId, callback) {
    fs.truncate(lib.baseDir + logId + '.log', 0, (err) => {
        if(!err) {
            callback(false);
        } else {
            callback(err);
        }
    })
}




// Export the module
module.exports = lib;