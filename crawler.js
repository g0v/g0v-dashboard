const { Client } = require('pg');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const config = require('./config.json');

var sql_config;
if(config.sql) {
    sql_config = config.sql;
} else {
    var url = process.env.DATABASE_URL;
    url = url.replace("pgsql://","");
    url = url.replace(":","/");
    url = url.replace("@","/");
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

var all_data={"slack": {}, "hackathon": {}, "summit": {"count": 4}, "fanpage": {}};

async function a(){
  await fetch(config.slack_api)
  .then(res => res.text())
  .then(body => {
    all_data['slack'] = JSON.parse(body);
    console.log("slack api get!");
  });

  await fetch(config.g0v_database)
  .then(res => res.text())
  .then(body => {
    var $ = cheerio.load(body);
    all_data['hackathon']['proposals'] = $('tr').length - 3;
    var last_row = $($('tr')[$('tr').length-1]);
    all_data['hackathon']['count'] = Number($($('td', last_row)[1]).text())+1;
    all_data['hackathon']['current_title'] = $($('td', last_row)[2]).text();
    console.log("g0v database get!");
  });

  await fetch(config.g0v_fanpage)
  .then(res => res.text())
  .then(body => {
    var $ = cheerio.load(body);
    var like = Number($("body").text().match('[0-9,]*(?= 人說這讚)')[0].replace(",",""));
    var follow = Number($("body").text().match('[0-9,]*(?= 人在追蹤)')[0].replace(",",""));
    all_data['fanpage'] = {
      "like": like,
      "follow": follow
    }
    console.log("g0v fanpage get!");
  });
}

a().then(() => {
  console.log(all_data);
  client.connect();
  client.query(`INSERT INTO dashboard.counter VALUES(\'${JSON.stringify(all_data)}\');`, (err, res) => {
    console.log(err, res);
    client.end();
  });
});
