'use strict';

// this is a sample client to test the DataPower's OAuth authorization code support
//   - it takes in 2 optional parameters, client_id (default : client_id) & 
//     client_secret (default : client_secret)
//
//   To run the client : node --harmony oauth-client.js [client_id] [client_secret]
//

const http = require('http');
const https = require('https');
const url = require('url');
const crypto = require('crypto');
const querystring = require('querystring');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var localipaddr = '';
const localport = 8880;

// oauth client ip address
const localip = '172.16.196.1';

// datapower oauth az endpoint 
const oauthip = '172.16.196.8:8000';

// datapower resource server protection endpoint
const oauthrs = '172.16.196.8:8080';

// oauth client id
var client_id = 'client-id';

// oauth client_secret
var client_secret = 'client-secret';

if (process.argv[2]) {
    client_id = process.argv[2];
}

if (process.argv[3]) {
    client_secret = process.argv[3];
}

const oauth_authen_ep = 'https://' + oauthip + '/authz';
const oauth_token_ep = 'https://' + oauthip + '/token';
const resource_ep = 'https://' + oauthrs;
var my_redirect = 'http://' + localip + ':' + localport + '/redirect';

console.log('\nclient_id: ' + client_id + '\nclient_secert: ' + client_secret);

var server=http.createServer(function(req, resp) {

    var reqdata = '';

    req.on('data', function(data) {
        reqdata += data;
    });

    req.on('end', function() {

        var pathname = url.parse(req.url).pathname;

        if (pathname == '/') {
            resp.writeHead(200, {'Content-Type': 'text/html'});
            resp.write('<head><title>OAuth Testing Client</title></head>\n');
            resp.write('<h1>OAuth Client Testing for ' + client_id +'</h1>\n');            
            resp.write('<body><form method="POST" action="doit">\n');
            resp.write('Scope <input type="text" size="18" maxlength="28" name="scope" placeholder="/accountinfo"/>\n');
            resp.write('<input type="submit" name="submit" value="Submit"/>\n');
            resp.end('</form>\n\nYou will be redirected to provide the authorization for this client for the above resources.</body>\n');
        }
        else if (pathname == '/favicon.ico') {
            resp.writeHead(200, {'Content-Type': 'image/x-icon'});
            resp.end();
        }
        else if (req.url.indexOf('?') >= 0 &&
                 req.url.indexOf('code=') >=0) {

            // receive authorization code
            var queryHeader = url.parse(req.url, true).query;
            var finalresource = '';

            if (queryHeader.code) {
                console.log('Received authorization_code: ' + queryHeader.code);
                const tokenuri = oauth_token_ep + '?' + 'grant_type=authorization_code';
                const request = require("request");
                var   resource = '';
                request({
                    uri: tokenuri,
                    method: "POST",
                    rejectUnauthorized: false,
                    form: {
                        code: queryHeader.code,
                        redirect_uri: my_redirect
                    },
                    headers: {
                        'Authorization': 'Basic ' + new Buffer(client_id + ':' + client_secret).toString('base64')
                    }
                }, function(error, response, body) {
                    if (error) throw error;
                    var jat = JSON.parse(body);
                    if (jat["access_token"]) {
                        console.log('Retrieve resource using access_token: ' + jat["access_token"] + ', for scope ' + jat["scope"] + '.');
                        // set retrieving resource
                        request({
                            uri: resource_ep + jat["scope"],
                            method: 'GET',
                            headers: {
                                'Authorization': 'Bearer ' + jat["access_token"]
                            }
                        }, function(error, response, body) {
                            if (error) throw error;
                            if (response.statusCode == '200') {
                                resource = body;
                                resp.writeHead(200,  {'Content-Type': 'application/json'});
                                resp.end(resource);
                                console.log('------------------------------------------------------------------');
                            } else {
                                console.log('------------------------------------------------------------------');
                                throw new Error('response returns non-200 error');
                            }
                        });
                    } else {
                        console.log('------------------------------------------------------------------');
                        throw new Error('missing access_token');
                    }
                });    // authorization code -> access_token
               
            }
            else {
                resp.writeHead(200,  {'Content-Type': 'text/html'});
                resp.write('<head><title>Regretfully</title></head>\n');
                resp.end('<body>Client regrets that you did not provide your approval. Chao!!</body');
                console.log('------------------------------------------------------------------');
            }
        }
        else if (pathname == '/') {
            resp.writeHead(200, {'Content-Type': 'text/html'});
            resp.write('<head><title>OAuth Testing Client</title></head>\n');
            resp.write('<h1>OAuth Client Testing for ' + client_id +'</h1>\n');            
            resp.write('<body><form method="POST" action="doit">\n');
            resp.write('Scope <input type="text" size="18" maxlength="28" name="scope" placeholder="/accountinfo"/>\n');
            resp.write('<input type="submit" name="submit" value="Submit"/>\n');
            resp.end('</form>\n\nYou will be redirected to provide the authorization for this client for the above resources.</body>\n');
        }
        else if (pathname == '/redirect') {
            var jp = querystring.parse(url.parse(req.url).query);
            if (jp["error"] != undefined) {
                resp.writeHead(200,  {'Content-Type': 'text/html'});
                resp.write('<body>error: ' + jp["error"] + '\n');
                if (jp["error_description"] != undefined) {
                    resp.write('error_description: ' + jp["error_description"]);
                }
                resp.end('</body>');
            }
            else {
                resp.writeHead(200, {'Content-Type': 'text/html'});
                resp.end('<head/><body>Unexpected</body>');
            }
        }
        else {
            var jp = querystring.parse(reqdata);
            
            var scope = '';
            
            if (pathname != '/doit')
                scope = pathname;

            if (jp["scope"] != undefined) 
                scope = jp["scope"];
           
            var state = randomHex(12);

            console.log('Redirecting user to get his/her consent for the scope, ' + scope + ' and state ' + state + '.');

            var redirect_location = oauth_authen_ep + '?response_type=code&client_id=' + 
                                    client_id + '&redirect_uri=' + my_redirect + '&state=' + state;
            if (scope != '')
                 redirect_location = redirect_location + '&scope=' + scope;

            resp.writeHead(302, {
                'Location': redirect_location, 
                'Content-Type': 'text/html'
            });
            resp.end('<html><head/><body>redirect</body></html>');

        }
    });

}).listen(localport);


function randomHex(len) {
    const crypto = require('crypto');
    return crypto.randomBytes(Math.ceil(len/2)).toString('hex').slice(0, len);
};

console.log('\nOAuth Authz Endpoint : ' + oauth_authen_ep);
console.log('OAuth Token Endpoint : ' + oauth_token_ep);
console.log('Resource Endpoint : ' + resource_ep);
console.log('my redirect : ' + my_redirect);
console.log('server running on port http://' + localip + ':' + localport + '.\n');
