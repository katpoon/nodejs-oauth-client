'use strict';

const http = require('http');
const https = require('https');
const url = require('url');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var localipaddr = '';
const localport = 8880;

//var netis = require('os').networkInterfaces();
//for (var neti in netis) {
//    var cnt = 0;
//    netis[neti].forEach(function(details) {
//        if (details.family==='IPv4' && neti === 'vmnet1') {
//            localipaddr = details.address;
//            ++cnt;
//        }
//    });
//}

const localip = '172.16.196.1';
const oauthip = '172.16.196.8';

//const oauth_svr = process.argv[2]; 
//if (!oauth_svr || (oauth_svr.indexOf(':') == -1)) {
//    throw Error('missing oauth server host or ip address! (abc.com:7777)');
//}

const oauthsvr = process.argv[2];
if (!oauthsvr) {
    throw Error('missing oauthsrv port ! (8000)');
}

const rssvr = process.argv[3];
if (!rssvr) {
    throw Error('missing resource server ep port ! (8080)');
}

const client_id = 'client-id';

// optional, since this can be a public client
const client_secret = 'client-secret';

const oauth_authen_ep = 'https://' + oauthip + ':' + oauthsvr + '/authz';
const oauth_token_ep = 'https://' + oauthip + ':' + oauthsvr + '/token';
const resource_ep = 'https://' + oauthip + ':' + rssvr;
const my_redirect = 'http://' + localip + ':' + localport + '/redirect';

var server=http.createServer(function(req, resp) {

    if (req.url.indexOf('?') < 0 ||
        req.url.indexOf('code=') < 0) {
        var scope = req.url;
        var redirect_location = oauth_authen_ep + '?response_type=code&client_id=' + 
                                client_id + '&redirect_uri=' + my_redirect + '&scope=' + scope;
        resp.writeHead(302, {
            'Location': redirect_location, 
            'Content-Type': 'text/html'
        });
        resp.end('<html><head/><body>redirect</body></html>');

    } else if (req.url.indexOf('?') >= 0 &&
               req.url.indexOf('code=') >=0) {
        var queryHeader = url.parse(req.url, true).query;
        var finalresource = '';

        if (queryHeader.code) {
            console.log('authorization_code: ' + queryHeader.code);
            const tokenuri = oauth_token_ep + '?' + 'grant_type=authorization_code';
            const request = require("request");
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
                    console.log('\naccess_token: ' + jat["access_token"]);
                    console.log('scope: ' + jat["scope"]);
                    
                    // set retrieving resource
                    request({
                        uri: resource_ep + jat["scope"],
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + jat["access_token"]
                        }
                    }, function(error, response, body) {
                        if (error) throw error;
                        finalresource = body;
                        console.log('what ' + body);
                    });
                } else {
                    console.log('error in exchanging authorization code to access_token: ' + body);
                }
            });    // authorization code -> access_token

           console.log('here ' + finalresource);
        }
    }

}).listen(localport);


console.log('\nOAuth Authz Endpoint : ' + oauth_authen_ep);
console.log('OAuth Token Endpoint : ' + oauth_token_ep);
console.log('Resource Endpoint : ' + resource_ep);
console.log('my redirect : ' + my_redirect);
console.log('server running on port http://' + localip + ':' + localport + '.\n');

