var cradle = require('cradle');

// `exports.attach` gets called by broadway on `app.use`
exports.attach = function (options) {
  
  var app = this,
  
      cc  = new(cradle.Connection)('http://localhost', 5984, {
        auth: { username: 'xxx', password: 'zzz' },
        cache: true,
        raw: false
      });
      
  app.db = cc.database('proxy');
  
  app.db.exists(function (err, exists) {
    
      if (err) {
        console.log('error', err);
      } else if (exists) {
        console.log('database exists.');
      } else {
        console.log('database does not exist. creating it.');
        app.db.create();
      }
      
    });

};

// `exports.init` gets called by broadway on `app.init`.
exports.init = function (done) {

  // This plugin doesn't require any initialization step.
  return done();

};