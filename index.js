const http = require('http');
const request = require('request');
const cheerio = require('cheerio');
const config = require('./config.json');

var all_data={"slack": {}, "hackathon": {}, "summit": {"count": 4}};

function craw_slack() {
  request('https://g0v-slack-archive.g0v.ronny.tw/index/count', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var _data = JSON.parse(body);
      all_data['slack'] = _data;
    }
  });
}
function craw_database() {
  request('https://docs.google.com/spreadsheets/d/e/2PACX-1vT0oqWKBwSjyUo5k9uPTJItYkSpxZmpz0QFH65myqXasM9K7ldzuEY1eN6lGElTKlz52TozB94Os7oG/pubhtml?gid=1563040282&single=true', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(body);
      all_data['hackathon']['proposals'] = $('tr').length - 3;
      var last_row = $($('tr')[$('tr').length-1]);
      all_data['hackathon']['count'] = Number($($('td', last_row)[1]).text());
      all_data['hackathon']['current_title'] = $($('td', last_row)[2]).text();
    }
  });
}

craw_slack();
craw_database();

var app = http.createServer(function(req,res){
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(all_data));
});

console.log("listen to "+config.port);
app.listen(config.port);

// > {"a":1}
