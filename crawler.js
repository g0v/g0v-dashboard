const { Client } = require('pg');
const http = require('http');
const request = require('request');
const cheerio = require('cheerio');
const config = require('./config.json');

const client = new Client(config.sql);

var all_data={"slack": {}, "hackathon": {}, "summit": {"count": 4}};

function craw_slack() {
  return new Promise(function (resolve, reject) {
    request(config.slack_api, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var _data = JSON.parse(body);
        all_data['slack'] = _data;
        console.log("slack api get!");
        resolve();
      }
      else {
        console.log("slack api error");
        reject();
      }
    });
  });
}

function craw_database() {
  return new Promise(function (resolve, reject) {
    request(config.g0v_database, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        //console.log(body);
        var $ = cheerio.load(body);
        all_data['hackathon']['proposals'] = $('tr').length - 3;
        var last_row = $($('tr')[$('tr').length-1]);
        all_data['hackathon']['count'] = Number($($('td', last_row)[1]).text());
        all_data['hackathon']['current_title'] = $($('td', last_row)[2]).text();
        console.log("g0v database get");
        resolve();
      }
      else {
        console.log("g0v database error");
        reject();
      }
    });
  });
}

async function a(){
  await craw_slack();
  await craw_database();
}

a().then(() => {
  console.log(all_data);
  client.connect();
  client.query(`INSERT INTO dashboard.counter VALUES(\'${JSON.stringify(all_data)}\');`, (err, res) => {
    console.log(err, res);
    client.end();
  });
});
