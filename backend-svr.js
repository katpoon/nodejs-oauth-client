'use strict';

const http = require('http');
const os = require('os');

var server=http.createServer(function(request, response) {

    var date = new Date();
    
    console.log('receive request, ' + request.url + ', at ' + date.toDateString() + ' ' + date.toTimeString() + '\n')
    response.writeHead(200, {"Content-Type":"application/json"});
    response.end(JSON.stringify(request.headers));
    
}).listen(8088);

var localipv4addr = '';

var ifaces=os.networkInterfaces();
for (var dev in ifaces) {
   var alias = 0;
   ifaces[dev].forEach(function(details) {
       if (details.family=='IPv4' && dev == 'eth0') {
            localipv4addr = details.address;
       }
   });
}

console.log('fake backend server running on port 8088.');
