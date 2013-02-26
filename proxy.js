/*
    SIMPLE PROXY SERVICE
    ====================
    
    - gets config from JSON
    - home page with service listing

*/


var net           = require('net'),
    http          = require('http'),
    path          = require('path'),
    fs            = require('fs'),
    exec          = require('child_process').exec,
    httpProxy     = require('http-proxy'),
    app           = require('flatiron').app,
    mu            = require('mu2'),
    util          = require('util'),
    proxies       = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'proxies.json')))["proxies"], // the proxies.json file
    routingTable  = {},
    routingTable  = {};


app.config.argv(); // conf source: arguments is most important
app.config.env();  // then env vars
// lastly, our config.json file
app.config.file({ file: path.join(__dirname, 'config', 'config.json') });


var listingData = {};

// prepare listing data
  // get system info
exec('echo $(uname -n; uname -o 2>/dev/null || uname; uname -r; echo "node.js:"; node -v)',
  function (err, stdout, stderr) {
    var sysinfo = stdout || "unknown";
    
    // build listing data
    listingData = {
      "server_name": app.config.get('name'),
      "server": app.config.get('server'),
      "system": sysinfo,
      "hello-msg": app.config.get('hello-msg'),
      "secret": !app.config.get('public'),
      "proxies": proxies,
      "alert": {
        "type"  : "info",
        "msg"   : JSON.stringify("Testing alerts!")
      }
    };
    
});


// build the routing table
var routingTable = {};
(function buildRoutingTable() {
  routingTable.router = {};

  for (var i=0; i<proxies.length; i++)
  {
    routingTable.router[proxies[i].hostname] = proxies[i].remote;
  };
  
})();

// Create a new instance of HttProxy to use in your server
var // proxy = new httpProxy.RoutingProxy(),
  
    serveListing = function(res, listingData) {
      stream = mu.compileAndRender('index.mustache', listingData);    
      util.pump(stream, res);
    };
    
// Create a httpProxy server and proxy its handler
httpProxy.createServer(function (req, res, proxy) {  
  console.log("req for: ", req.headers.host);
  
  // config for the proxy
  var cnf = {};
  
  // is the hostname in our routing table?
  if (routingTable.router[req.headers.host]) {
    
    // if it is, we have our remote!
    var remote = routingTable.router[req.headers.host];
    
    // extract the hostname and port
    cnf.host = remote.substring(0, remote.indexOf(':'));
    cnf.port = remote.substring(remote.indexOf(':') + 1);
    
    console.log(cnf);
    proxy.proxyRequest (req, res, cnf);
    
    proxy.on('end', function() {
      console.log("The request was proxied.");
    });
    

  } else {  // host is not in the routing table, 
    // we serve the listing!

    serveListing(res, listingData);
    
  }
  
}).listen(app.config.get('proxy-port'));
