const fetch = require('node-fetch');
const { Client } = require('pg');
const cheerio = require('cheerio');
const config = require('./config.json');
const HttpsProxyAgent = require('https-proxy-agent');
var proxyAgent = undefined;
if (config.proxy) {
    proxyAgent = new HttpsProxyAgent(config.proxy);
}

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
var all_data = { "slack": {}, "hackathon": {}, "summit": {}, "fanpage": {}, "github": {} };
const arrayOfPromises = [
    new Promise((resolve, reject) => {
        let to = setTimeout(() => {
            console.log("slack api timeout");
            resolve(1);
        }, 15000);
        fetch(config.slack_api)
            .then(res => res.text())
            .then(body => {
                //console.log(body);
                all_data['slack'] = JSON.parse(body);
                console.log("slack api get!");
                clearTimeout(to);
                resolve(1);
            })
    }),
    new Promise((resolve, reject) => {
        let to = setTimeout(() => {
            console.log("g0v database timeout");
            resolve(2);
        }, 30000);
        fetch(config.g0v_database)
            .then(res => res.text())
            .then(body => {
                var $ = cheerio.load(body);
                if ($('tr').length > 0) {
                    let counter = 0;
                    for (let row_id = 0; row_id < $('tr').length; row_id++) {
                        if ($($('td', $('tr')[row_id])[2]).text().length > 0) {
                            counter++;
                        }
                    }
                    counter--; // remove head row
                    all_data['hackathon']['proposals'] = counter;
                    var last_row = $($('tr')[counter]);
                    all_data['hackathon']['count'] = Number($($('td', last_row)[1]).text()) + 1;
                    all_data['hackathon']['current_title'] = $($('td', last_row)[2]).text();
                    //console.log(all_data['hackathon']);
                    console.log("g0v database get!");
                }
                else {
                    console.log("g0v database get error");
                }
                clearTimeout(to);
                resolve(2);
            });
    }),
    new Promise((resolve, reject) => {
        let to = setTimeout(() => {
            console.log("fb fanpage timeout");
            resolve(3);
        }, 15000);
        fetch(config.g0v_fanpage, { headers: { 'Accept-Language': 'zh-TW' }, agent: proxyAgent })
            .then(res => res.text())
            .then(body => {
                //console.log(body);
                var $ = cheerio.load(body);
                var like = follow = null;
                var like_match = $("body").text().match('[0-9,]* 個讚');
                var follow_match = $("body").text().match('[0-9,]* 人在追蹤');
                if (like_match != null)
                    like = Number(like_match[0].replace(",", "").replace(" 個讚", ""));
                if (follow_match != null)
                    follow = Number(follow_match[0].replace(",", "").replace(" 人在追蹤", ""));

                if (like == null || follow == null) {
                    throw new Error("g0v fanpage get error!!");
                }
                else {
                    all_data['fanpage'] = {
                        "like": like,
                        "follow": follow
                    }
                    console.log("g0v fanpage get!");
                }
                clearTimeout(to);
                resolve(3);
            })
    }),
    new Promise((resolve, reject) => {
        let to = setTimeout(() => {
            console.log("github api timeout");
            resolve(4);
        }, 15000);
        fetch('https://api.github.com/orgs/g0v', {
            "header": {
                "Accept": "application/vnd.github.v3+json"
            }
        })
            .then(res => res.text())
            .then(body => {
                var _org = JSON.parse(body);
                all_data['github']['repos'] = _org.public_repos;
                console.log("github api get!");
                clearTimeout(to);
                resolve(4);
            });
    })
]
client.connect();
client.query(`SELECT * FROM dashboard.counter ORDER BY create_at DESC LIMIT 1;`, (error, result) => {
    if (error) {
        console.log(error.stack);
    } else {
        all_data = result.rows[0]['data'];
        console.log("old data: ", all_data);
        Promise.all(arrayOfPromises).then(() => {
            all_data['summit'] = { "count": 5 };
            console.log("new data: ", all_data);
            client.query(`INSERT INTO dashboard.counter VALUES(\'${JSON.stringify(all_data)}\');`, (err, res) => {
                console.log(err, res);
                client.end();
                throw "end";
            });
        });
    }
});
