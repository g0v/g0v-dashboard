const { Client } = require('pg');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const config = require('./config.json');
const HttpsProxyAgent = require('https-proxy-agent');
var proxyAgent = undefined;
if(config.proxy) {
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

var all_data = { "slack": {}, "hackathon": {}, "summit": { "count": 4 }, "fanpage": {}, "github": {} };

async function a() {
    let to = setTimeout(() => {
        throw new Error("Timeout!!");
    }, 600000);
    await fetch(config.slack_api, { agent: proxyAgent })
        .then(res => res.text())
        .then(body => {
            console.log(body);
            all_data['slack'] = JSON.parse(body);
            console.log("slack api get!");
        });

    await fetch(config.g0v_database, { agent: proxyAgent })
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
                console.log(all_data['hackathon']);
                console.log("g0v database get!");
            }
            else {
                console.log("g0v database get error");
            }
        });

    await fetch(config.g0v_fanpage, { headers: { 'Accept-Language': 'zh-TW' }, agent: proxyAgent })
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
                console.log("g0v fanpage get error");
            }
            else {
                all_data['fanpage'] = {
                    "like": like,
                    "follow": follow
                }
                console.log("g0v fanpage get!");
            }
        });

    await fetch('https://api.github.com/orgs/g0v', {
        "header": {
            "Accept": "application/vnd.github.v3+json"
        },
        agent: proxyAgent
    })
        .then(res => res.text())
        .then(body => {
            var _org = JSON.parse(body);
            all_data['github']['repos'] = _org.public_repos;
            console.log("gov github get!");
            clearTimeout(to);
        });
}

client.connect();

client.query(`SELECT * FROM dashboard.counter ORDER BY create_at DESC LIMIT 1;`, (error, result) => {
    if (error) {
        console.log(error.stack);
    } else {
        all_data = result.rows[0]['data'];
        console.log("old data:", all_data);
        a().then(() => {
            console.log(all_data);
            client.query(`INSERT INTO dashboard.counter VALUES(\'${JSON.stringify(all_data)}\');`, (err, res) => {
                console.log(err, res);
                client.end();
            });
        });
    }
});
