/*
 *This are the request handlers
 *
 */

// Dependenies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');


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

// Container for the users submethod
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
// @TODO: Only let an authenticated user access their objects. - Complete!
handlers._users.get = (data, callback) => {
	// Check that the phone number is valid
	const phone =
		typeof (data.queryStringObject.phone) == 'string' &&
		data.queryStringObject.phone.trim().length == 10 ?
		data.queryStringObject.phone.trim() : false;

	if (phone) {

		// Get the token from the header
		const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
		// Verify the given token is valid for the phone number
		handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
			if (tokenIsValid) {
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
				callback(403, {
					'Error': 'Missing required token in header or token is invalid'
				});
			};
		});

	} else {
		callback(400, {
			'Error': 'Missing the required phone number'
		});
	};
};

// Users-Put
// Required data : phone
// Optional data : firstName, lastName, password (at least one must be specified)
// @TODO Only let the authenticated user to update their own object. - Completed!
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

		// Get the token from the header
		const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
		// Verify the given token is valid for the phone number
		handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
			if (tokenIsValid) {
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
				callback(403, {
					'Error': 'Missing the required token in the header'
				});
			}
		});


	} else {
		callback(400, {
			'Error': 'Missing required field'
		});
	}


};

// Users-Delete
// Required field : phone
// @TODO Only let the authenticated user to delete their object - Completed
// @TODO Cleanup (delete) any other data files associated with the user
handlers._users.delete = (data, callback) => {
	// Check that the phone number is valid
	const phone =
		typeof (data.queryStringObject.phone) == 'string' &&
		data.queryStringObject.phone.trim().length == 10 ?
		data.queryStringObject.phone.trim() : false;
	if (phone) {

		// Get the token from the header
		const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
		// Verify the given token is valid for the phone number
		handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
			if (tokenIsValid) {
				// Lookup the user
				_data.read('users', phone, (err, userData) => {
					if (!err && userData) {
						_data.delete('users', phone, (err) => {
							if (!err) {
								// Delete each of the checks associated with the user
								const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
								const checksToDelete = userChecks.length;
								if(checksToDelete > 0) {
									let checksDeleted = 0;
									let deletionErrors = false;
									// Loop through the checks
									userChecks.forEach((checkId) => {
										// Delete the check 
										_data.delete('checks', checkId, (err)=>{
											if(err){
												deletionErrors = true;
											}
											checksDeleted++;
											if(checksDeleted == checksToDelete) {
												if(!deletionErrors) {
													callback(200);
												} else {
													callback(500, {'Error': 'Error encountered while deleting the user checks'})
												}
											}
										})
									});
								} else {
									callback(200);
								}
							} else {
								callback(500, {
									'Error': 'Could not delete the specified user'
								});
							}
						})
					} else {
						callback(400, {
							'Error': 'Could not find the specified user'
						});
					};
				});
			} else {
				callback(403, {
					'Error': 'Missing the required token in the header'
				});
			};
		});

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
handlers._tokens.post = (data, callback) => {
	const phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	const password = typeof (data.payload.password) == 'string' &&
		data.payload.password.trim().length > 0 ?
		data.payload.password.trim() : false;
	if (phone && password) {
		// Lookup the user who matches that phone number
		_data.read('users', phone, (err, userData) => {
			if (!err && userData) {
				// Hashed the sent password and compare it to the password store in the user object
				const hashedPassword = helpers.hash(password);
				if (hashedPassword == userData.hashedPassword) {
					// If valid, create a new token with random name, Set expression date 1 hour in the future
					const tokenID = helpers.createRandomString(20);
					const expires = Date.now() + 1000 * 60 * 60;
					const tokenObject = {
						'phone': phone,
						'id': tokenID,
						'expires': expires
					};

					// Store the token
					_data.create('tokens', tokenID, tokenObject, (err) => {
						if (!err) {
							callback(200, tokenObject);
						} else {
							callback(500, {
								'Error': 'Could not create the new token'
							});
						};
					});

				} else {
					callback(400, {
						'Error': 'Password did not matched the specified user\'s stored password'
					});
				}
			} else {
				callback(400, {
					'Error': 'Could not find the specified user'
				});
			}
		});
	} else {
		callback(400, {
			'Error': 'Missing the required fields'
		})
	}
};

// Tokens - Get
// Required data: ID
// Optional data: none
handlers._tokens.get = (data, callback) => {
	// Check that the Id is valid
	const id =
		typeof (data.queryStringObject.id) == 'string' &&
		data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
	if (id) {
		// Lookup the user
		_data.read('tokens', id, (err, tokenData) => {
			if (!err && tokenData) {
				callback(200, tokenData);
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

// Tokens - Put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = (data, callback) => {
	const id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
	const extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;

	if (id && extend) {
		// Lookup the token
		_data.read('tokens', id, (err, tokenData) => {
			if (!err && tokenData) {
				// Check to make sure token isn't already expired
				if (tokenData.expires > Date.now()) {
					// Set the expression an hour from now
					tokenData.expires = Date.now() + 1000 * 60 * 60;

					// Store the new updates
					_data.update('tokens', id, tokenData, (err) => {
						if (!err) {
							callback(200);
						} else {
							callback(500, {
								'Error': 'Could not update token'
							});
						}
					})
				} else {
					callback(400, {
						'Error': 'The token has already expired and cannot be expanded'
					});
				}
			} else {
				callback(400, {
					'Error': 'Specified token does not exist'
				});
			}
		})
	} else {
		callback(400, {
			'Error': 'Missing required fields or fields are invalid'
		});
	}

};

// Tokens - Delete
// Reqired data: id
// Optional data: None
handlers._tokens.delete = (data, callback) => {
	// Check that the id is valid
	const id =
		typeof (data.queryStringObject.id) == 'string' &&
		data.queryStringObject.id.trim().length == 20 ?
		data.queryStringObject.id.trim() : false;
	if (id) {
		// Lookup the tokens
		_data.read('tokens', id, (err, tokenData) => {
			if (!err && tokenData) {
				_data.delete('tokens', id, (err) => {
					if (!err) {
						callback(200);
					} else {
						callback(500, {
							'Error': 'Could not delete the specified token'
						});
					}
				})
			} else {
				callback(400, {
					'Error': 'Could not find the specified token'
				});
			};
		})
	} else {
		callback(400, {
			'Error': 'Missing the required token'
		});
	};
};

// Verify the giben token id is valid for given user
handlers._tokens.verifyToken = (id, phone, callback) => {
	// lookup the token
	_data.read('tokens', id, (err, tokenData) => {
		if (!err && tokenData) {
			// Ckeck that the token is for the given user and has not the expired
			if (tokenData.phone && tokenData.expires > Date.now()) {
				callback(true);
			} else {
				callback(false);
			}
		} else {
			callback(false);
		};
	});
};

// Chekcs
handlers.checks = (data, callback) => {
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._checks[data.method](data, callback);
	} else {
		callback(405);
	}
};

// Container for all the checks method
handlers._checks = {};

// Checks post
// Required data: protocol, URL, method, successCodes, timeoutSeconds
// Optional data: None
handlers._checks.post = (data, callback) => {
	// Validate all of the above inputs
	const protocol = typeof (data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false
	const url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false
	const method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false
	const successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false
	const timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false


	if (protocol && url && successCodes && timeoutSeconds) {
		// Check that the user has provided the token
		let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

		// Lookup the user by reading the token
		_data.read('tokens', token, (err, tokenData) => {
			if (!err && tokenData) {
				const userPhone = tokenData.phone;

				// Lookup the user data
				-
				_data.read('users', userPhone, (err, userData) => {
					if (!err && userData) {
						const userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
						// Verify the user has less than the number of max-checks per user
						if (userChecks.length < config.maxChecks) {
							// Create a random id for the check
							const checkId = helpers.createRandomString(20);

							// Create the check object and include the users phone
							const checkObject = {
								id: checkId,
								userPhone: userPhone,
								protocol: protocol,
								url: url,
								method: method,
								successCodes: successCodes,
								timeoutSeconds: timeoutSeconds
							};

							// Save the object
							_data.create('checks', checkId, checkObject, (err) => {
								if (!err) {
									// Add the check id to the user object
									userData.checks = userChecks;
									userData.checks.push(checkId);

									// Save the new user data
									_data.update('users', userPhone, userData, (err) => {
										if (!err) {
											// Return the data about the new check
											callback(200, checkObject);
										} else {
											callback(500, {
												'Error': 'Could not update the user with new check'
											});
										}
									})
								} else {
									callback(500, {
										'Error': 'Could not create the new check'
									});
								}
							})
						} else {
							callback(400, {
								'Error': 'The user already has max number of checks' + config.maxChecks
							});
						}
					} else {
						callback(400);
					}
				});
			} else {
				callback(403);
			}
		});
	} else {
		callback(400, {
			'Error': 'Missing inputs or invalid'
		});
	};
};

// Checks - get
// Required data: id
// Optional data: None
handlers._checks.get = function (data, callback) {
	// Check that id is valid
	const id = typeof (data.queryStringObject.id) == 'string' &&
		data.queryStringObject.id.trim().length == 20 ?
		data.queryStringObject.id.trim() : false;
	if (id) {
		// Lookup the check
		_data.read('checks', id, function (err, checkData) {
			if (!err && checkData) {
				// Get the token that sent the request
				const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
				// Verify that the given token is valid and belongs to the user who created the check
				handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
					if (tokenIsValid) {
						// Return check data
						callback(200, checkData);
					} else {
						callback(403);
					}
				});
			} else {
				callback(404);
			}
		});
	} else {
		callback(400, {
			'Error': 'Missing required field, or field invalid'
		})
	}
};

// Checks - put
// Required data: id
// Optional data: protocol, url, method, sucessCodes, timeoutSeconds (one must be provided)
handlers._checks.put = (data, callback) => {
	// Check for the required field
	const id =
		typeof (data.payload.id) == 'string' &&
		data.payload.id.trim().length == 20 ?
		data.payload.id.trim() : false;

	// Check for the optional fields
	const protocol = typeof (data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false
	const url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false
	const method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false
	const successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false
	const timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false

	// Error if the id is invalid
	if (id) {
		// Check to make sure one or more fields has been sent
		if (protocol || url || method || successCodes || timeoutSeconds) {
			// Looking up to check
			_data.read('checks', id, (err, checkData) => {
				if (!err && checkData) {
					// Get the token that sent the request
					const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
					// Verify that the given token is valid and belongs to the user who created the check
					handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
						if (tokenIsValid) {
							// Update the check where necessary
							if (protocol) {
								checkData.protocol = protocol;
							};
							if (url) {
								checkData.url = url;
							};
							if (method) {
								checkData.method = method;
							};
							if (successCodes) {
								checkData.successCodes = successCodes;
							};
							if (timeoutSeconds) {
								checkData.timeoutSeconds = timeoutSeconds;
							};

							// Store the new updates
							_data.update('checks', id, checkData, (err) => {
								if (!err) {
									callback(200, checkData);
								} else {
									callback(500, console.log(err));
								};
							});
						} else {
							callback(403)
						};
					});
				} else {
					callback(400, {
						'Error': 'Check Id did not exist'
					});
				};
			});
		} else {
			callback(400, {
				'Error': 'Missing fields to update'
			})
		}
	} else {
		callback(400, {
			'Error': 'Missing required field'
		});
	}

};

// Checks - Delete
// Required data: id
// Optional data: 

handlers._checks.delete = (data, callback) => {
	// Check that the id is valid
	const id =
		typeof (data.queryStringObject.id) == 'string' &&
		data.queryStringObject.id.trim().length == 20 ?
		data.queryStringObject.id.trim() : false;
	if (id) {

		// Lookup the check that they want to delete
		_data.read('checks', id, (err, checkData) => {
			if (!err && checkData) {
				// Get the token from the header
				const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
				// Verify the given token is valid for the phone number
				handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
					if (tokenIsValid) {

						// Delete the check data
						_data.delete('checks', id, (err) => {
							if (!err) {
								// Lookup the user
								_data.read('users', checkData.userPhone, (err, userData) => {
									if (!err && userData) {
										const userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

										// Remove the deleted checks from user's check
										const checkPosition = userChecks.indexOf(id);

										if (checkPosition > -1) {
											userChecks.splice(checkPosition, 1);

											// Resave the user's data
											_data.update('users', checkData.userPhone, userData, (err) => {
												if (!err) {
													callback(200);
												} else {
													callback(500, {
														'Error': 'Could not update the user'
													});
												};
											});
										} else {
											callback(500, {
												'Error': 'Could not find the check in the user object'
											});
										};
									} else {
										callback(500, {
											'Error': 'Could not find the specified user who created the check to delete it'
										});
									};
								});
							} else {
								callback(500, {
									'Error': 'Could not delete the check'
								});
							}
						})

					} else {
						callback(403);
					};
				});
			} else {
				callback(400, {
					'Error': 'The specified check id does not exist'
				});
			}
		});


	} else {
		callback(400, {
			'Error': 'Missing the required phone number'
		});
	};
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