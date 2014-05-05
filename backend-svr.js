'use strict';

const http = require('http');

var server=http.createServer(function(request, response) {

    var date = new Date();
    
    console.log('receive request at ' + date.toDateString() + ' ' + date.toTimeString() + '\n')
    response.writeHead(200, {"Content-Type":"application/json"});
    response.end(JSON.stringify(request.headers));
    
}).listen(8088);

console.log('fake backend server running on port 8088.');
