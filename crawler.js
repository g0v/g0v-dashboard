const rp = require('request-promise');
const { Client } = require('pg');
const client = new Client();
const url_slack = 'https://g0v-slack-archive.g0v.ronny.tw/index/count';

data ={};

/*
client.query('SELECT $1::text as message', ['Hello world!'], (err, res) => {
  console.log(err ? err.stack : res.rows[0].message) // Hello World!
  client.end()
});*/

rp(url_slack)
  .then(function(html){
    var slack_data = JSON.parse(html);
	console.log(slack_data['users']);
  })
  .catch(function(err){
  });