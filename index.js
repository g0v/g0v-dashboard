const http = require('http');
const { Client } = require('pg');
const config = require('./config.json');
const client = new Client(config.sql);

client.connect();

var app = http.createServer(function(req,res) {
    res.setHeader('Content-Type', 'application/json');
    client.query(`SELECT data FROM dashboard.counter LIMIT 1;`, (error, result) => {
      if (error) {
        console.log(error.stack);
        res.end(`"error": ${error.stack}`);
      } else {
        _data = result.rows[0];
        res.end(JSON.stringify(_data));
      }
    });
});

console.log("listen to "+config.port);
app.listen(config.port);

// > {"a":1}
