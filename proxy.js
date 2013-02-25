/*
    SIMPLE PROXY SERVICE
    ====================
    
    - gets config from JSON
    - home page with service listing

*/


var net         = require('net'),
    http        = require('http'),
    path        = require('path'),
    fs          = require('fs'),
    httpProxy   = require('http-proxy'),
    prox        = require('flatiron').app,
    mu          = require('mu2'),
    util        = require('util'),
    proxies    = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'proxies.json')))["proxies"], // the proxies.json file
    routingTable = {},
    routingTable = {};


prox.config.argv(); // conf source: arguments is most important
prox.config.env();  // then env vars
// lastly, our config.json file
prox.config.file({ file: path.join(__dirname, 'config', 'config.json') }); 

// build the routing table
var routingTable = {};
routingTable.router = {};

for (var i=0; i<proxies.length; i++)
{
  routingTable.router[proxies[i].hostname] = proxies[i].remote;
};

console.info("routingTable: " + JSON.stringify(routingTable))


// Create a new instance of HttProxy to use in your server
var proxy = new httpProxy.RoutingProxy();

// Create a regular http server and proxy its handler
http.createServer(function (req, res) {  
  console.log("req for: ", req.headers.host);
  
  var cnf = {
    "host": "localhost",
    "port": prox.config.get('listing-port') || 8888
  };
  
  if (routingTable.router[req.headers.host]) {
    cnf.host = req.headers.host;
    var remote = routingTable.router[req.headers.host];
    cnf.port = remote.substring(remote.indexOf(':') + 1);
  }
  console.log(cnf);
  proxy.proxyRequest (req, res, cnf);    

// after creation, server listens on configured port
}).listen(prox.config.get('proxy-port'));


// Built-in HTTP Server for Service listing
http.createServer(function (req, res) {
  var stream = mu.compileAndRender('index.mustache', {
    "server_name": prox.config.get('name'),
    "proxies": proxies
  });
  util.pump(stream, res);
}).listen(prox.config.get('listing-port'), '127.0.0.1');
console.info('Directory Listing Server running at http://127.0.0.1:' +  prox.config.get('listing-port') + '/');
