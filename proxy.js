/*
    SIMPLE PROXY SERVICE
    ====================
    
    - gets config from JSON
    - home page with service listing

*/


var net           = require('net'),
    http          = require('http'),
    path          = require('path'),
    fs            = require('fs-extra'),
    exec          = require('child_process').exec,
    f             = require('underscore'),
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
var routingTable = {};

// ## Functions

// function to build the routing table
function buildRoutingTable(callback) {
  routingTable.router = {};
  
  try {
    for (var i=0; i<proxies.length; i++)
    {
      routingTable.router[proxies[i].hostname] = {
        target: proxies[i].remote,
        protocol: proxies[i].protocol || 'http'
      };
    };
  } catch (e) {
    var err = e;
  } 

  if (typeof callback === 'function') {
    callback(err || null, routingTable);
  }
  
};

// function to create a proxy
function createProxy(config) {
  //
  // Create a proxy server with custom application logic
  //
  var proxy = new httpProxy.createProxyServer();

  //
  // Create your custom server and just call `proxy.web()` to proxy 
  // a web request to the target passed in the options
  // also you can use `proxy.ws()` to proxy a websockets request
  //
  var server = require('http').createServer(function(req, res) {
    // You can define here your custom logic to handle the request
    // and then proxy the request.
    
    var host = req.headers.host;
    
    console.log('request for %s', host);
    
    if (routingTable.router[host]) {
      var remote = routingTable.router[host];
      console.log('yay', remote);
      
      var proxyOptions = { target: remote.protocol+'://'+remote.target };
      
      proxy.web(req, res, 
        proxyOptions,
        function (err) {
            // Now you can get the err
            // and handle it by your self
            // if (err) throw err;
            res.writeHead(502);
            serveListing(res, f.extend(
              listingData,
              {
                "alert": {
                  "type": "error",
                  "title": "502 - Proxy Error",
                  "msg": err || null,
                  "host": host,
                  "remote": proxyOptions.target
                }
              }
            ));
          });
      
    } else {
      serveListing(res, listingData);
    }
    
  });

  console.log("listening on port 80")
  server.listen(80);
}

// function to serve to listing
function serveListing(res, listingData) {
  stream = mu.compileAndRender('index.mustache', listingData);    
  util.pump(stream, res);
};


// ## Workflow

app.init(function () {
  // prepare listing data
    // get system info
  exec('echo $(uname -n; uname -o 2>/dev/null || uname; uname -r; echo ""; echo "node.js:"; node -v)',
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
    
      // build routing table
      buildRoutingTable(function (err, res) {
        if (err) {
          app.log.error(err)
        } else {
          app.log.info("routingTable", res);
          require('eyes').inspect(res);
        }
        
        createProxy();
        
      });
  });
});
