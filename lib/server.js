/*
 * Server related tasks
 *
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const path = require('path');


// Instantiate the server module object
const server = {};

// Instantiating the HTTP server
server.httpServer = http.createServer((req, res) => {
    server.unifiedServer(req, res);
});



// Instatiating the HTTPS server
server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
    server.unifiedServer(req, res);
});


// All the server logic for both http and https server
server.unifiedServer = (req, res) => {
    // Get the url and parsed it
    const parsedUrl = url.parse(req.url, true);

    // Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '')

    // Get the HTTP Method
    const method = req.method.toLowerCase();

    // Get the query string as an object
    const queryStringObject = parsedUrl.query

    // Get the headers as an object
    const headers = req.headers;

    // Get the payload, if there is any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });

    req.on('end', () => {
        buffer += decoder.end();

        // Choose the handler this request should go to
        // If one is not found choose not found handers
        const chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handlers
        const data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        // Route the request to the handlers specified in the router
        chosenHandler(data, (statusCode, payload) => {
            // Use the status code called back by the handlers, or use the default 200
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

            // Use the payload called back by the handlers, or use the default empty object
            payload = typeof (payload) == 'object' ? payload : {};

            // Convert payload to string
            const payloadString = JSON.stringify(payload);

            // Return the reponse
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);


            // log the request path
            console.log('Returning this response ', statusCode, payloadString);
        });
    });
};



// Define a request router
server.router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks
};

// Init Script
server.init = () =>{
    // Start the http server
    server.httpServer.listen(config.httpPort, () => {
        console.log('Server has started on port ' + config.httpPort);
    });

    // Start the HTTPS server
    server.httpsServer.listen(config.httpsPort, () => {
        console.log('Server has started on port ' + config.httpsPort);
    });
}



module.exports = server;
