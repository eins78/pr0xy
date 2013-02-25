# `proxy.js`

simple frontend for [`http-proxy`](https://github.com/nodejitsu/node-http-proxy), go read all about there.

## features

- [`proxies.json`](https://github.com/eins78/proxy.js/blob/master/config/proxies.json) config file with metadata (`name`, etc.)
- implements the proxy within node.js http server
- has a built-in listing of all proxies
- server falls back to listing (if you somehow reache the `IP:port` of the server, you'll get an answer)

## run

    git clone git://github.com/eins78/proxy.js.git
    cd proxy.js
    vim config/config.json
    vim config/proxies.json
    echo 'use sudo to run on port 80!'
    node proxy.js

Showing internal IP:port in the listing can be turned of by setting `{ "public": true }` in [`config.json`](https://github.com/eins78/proxy.js/blob/master/config/config.json).

## license

[MIT](http://www.opensource.org/licenses/MIT)