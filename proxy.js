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
    exec        = require('child_process').exec,
    httpProxy   = require('http-proxy'),
    app        = require('flatiron').app,
    mu          = require('mu2'),
    util        = require('util'),
    proxies    = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'proxies.json')))["proxies"], // the proxies.json file
    routingTable = {},
    routingTable = {};


app.config.argv(); // conf source: arguments is most important
app.config.env();  // then env vars
// lastly, our config.json file
app.config.file({ file: path.join(__dirname, 'config', 'config.json') });


// get system info
var sysStr = "";
exec('echo $(uname -n; uname -o 2>/dev/null || uname; uname -r; echo "node.js:"; node -v)',
  function(err, stdout, stderr) {
    app.config.set('system', stdout || "unknown");
});


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

  } else {  // host is not in the routing table! 
    
    // we serve the listing!
    var stream = mu.compileAndRender('index.mustache', {
      "server_name": app.config.get('name'),
      "server": app.config.get('server'),
      "system": app.config.get('system'),
      "hello-msg": app.config.get('hello-msg'),
      "secret": !app.config.get('public'),
      "proxies": proxies
    });
    
    util.pump(stream, res);
    
  }
// after creation, server listens on configured port
}).listen(app.config.get('proxy-port'));
