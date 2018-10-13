/*
 * Primary file for api
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./lib/config');
const fs = require('fs');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');


// Instantiating the HTTP server
const httpServer = http.createServer((req, res) => {
    unnifiedServer(req, res);
});

// Start the HTTP server
httpServer.listen(config.httpPort, () => {
    console.log('Server has started on port ' + config.httpPort);
});

// Instatiating the HTTPS server
const httpsServerOption = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOption, (req, res) => {
    unnifiedServer(req, res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, () => {
    console.log('Server has started on port ' + config.httpsPort);
});
// All the server logic for both http and https server
const unnifiedServer = (req, res) => {
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
        const chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

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
const router = {
    'ping': handlers.ping,
    'users': handlers.users
}

