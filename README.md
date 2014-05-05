nodejs-oauth-client
===================

This is an example that I have been using for learning node.js and testing against the DataPower OAuth 7.0 support.


OAuth authz/token endpoint (authorization code, with client_id = client_id & client_secret = client_secret) :
oauth-client.js (port: 8880) ------>  DP (oauth-az, port 8000)

OAuth access resource with access_token
oauth-client.js (port: 8880) ------>  DP (oauth-rs, port 8080) --------> backend-svr.js (port 8088)

To launch the oauth client :
--------------------------
oauth-client.js : (optional parameter for client_id & client_secert to override the default)
    node --harmony oauth-client.js [client_id] [client_secret]
    
To launch the backend server :
----------------------------
backend-svr.js
    node --harmony backend-svr.js

DataPower : 
---------
2 domains  (all key materials are in local:///)
oauth-az : 
     port : 8000
     client : client_id
     
oauth-rz :
     port : 8080
