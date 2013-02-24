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
    proxies    = JSON.parse(fs.readFileSync(path.join(__dirname, 'proxies.json')))["proxies"], // the proxies.json file
    routerData = {},
    routesList = {};


prox.config.argv(); // conf source: arguments is most important
prox.config.env();  // then env vars
prox.config.file({ file: path.join(__dirname, 'config.json') }); // lastly, our config.json file


console.log(proxies);

for (var i=0; i<proxies.length; i++)
{
  var hostname = proxies[i].hostname;
  var remote = proxies[i].remote;
  routesList[hostname] = remote;
  console.info("routesList: " + JSON.stringify(routesList));
};

routerData.router = routesList;
console.info("routerData: " + JSON.stringify(routerData))

// prox.init();

//
// Http Proxy Server with Proxy Table
//
httpProxy.createServer(routerData).listen(prox.config.get('proxy-port'));
console.info('Proxy Server running at Port ' + prox.config.get('proxy-port'));

//
// Built-in HTTP Server for Service listing
//

http.createServer(function (req, res) {
  var stream = mu.compileAndRender('index.mustache', {
    "server_name": prox.config.get('name'),
    "proxies": proxies
  });
  util.pump(stream, res);
}).listen(prox.config.get('listing-port'), '127.0.0.1');
console.info('Directory Listing Server running at http://127.0.0.1:' +  prox.config.get('listing-port') + '/');

//
// Telnet Interface
//

// var server = net.createServer(function (socket) {
//   socket.write('Welcome to the Proxy Viewer!');
// }).listen(prox.config.get('telnet-port'));
