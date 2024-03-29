const http = require('http');
const { Client } = require('pg');
const config = require('./config.json');

var sql_config;
if (config.sql) {
    sql_config = config.sql;
} else {
    var url = process.env.DATABASE_URL;
    url = url.replace("pgsql://", "");
    url = url.replace(":", "/");
    url = url.replace("@", "/");
    url = url.split("/");
    console.log(url);
    sql_config = {
        "user": url[0],
        "host": url[2],
        "database": url[3],
        "password": url[1],
        "port": 5432
    }
}

const client = new Client(sql_config);

client.connect();

var app = http.createServer(function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.url == '/') {
        client.query(`SELECT * FROM dashboard.counter ORDER BY create_at DESC LIMIT 1;`, (error, result) => {
            if (error) {
                console.log(error.stack);
                res.end(`"error": ${error.stack}`);
            } else {
                _data = result.rows[0];
                res.end(JSON.stringify(_data));
            }
        });
    }
    else if (req.url == '/all') {
        client.query(`SELECT * FROM dashboard.counter ORDER BY create_at DESC;`, (error, result) => {
            if (error) {
                console.log(error.stack);
                res.end(`"error": ${error.stack}`);
            } else {
                _data = result.rows;
                res.end(JSON.stringify(_data));
            }
        });
    }
    else if (req.url == '/health') {
        client.query(`SELECT * FROM dashboard.counter WHERE create_at >= now() - INTERVAL '36' HOUR;`, (error, result) => {
            if (error) {
                console.log(error.stack);
                res.end(`{"error": ${error.stack}}`);
            } else {
                if(result.rows.length == 0) {
                    res.end(`{"error": "data outdated"}`);
                }
                else {
                    res.end(`{"health": "good"}`);
                }
            }
        });
    }
    else {
        res.end(`"error": "wrong url"`);
    }
});

console.log("listen to " + config.port);
app.listen(config.port);

// > {"a":1}
