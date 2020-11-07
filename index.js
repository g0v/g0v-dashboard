const http = require('http');
const request = require('request');
const cheerio = require('cheerio');
const config = require('./config.json');

var all_data={"slack": {}, "hackathon": {}, "summit": {"count": 4}};

function craw_slack() {
  request(config.slack_api, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var _data = JSON.parse(body);
      all_data['slack'] = _data;
    }
  });
}
function craw_database() {
  request(config.g0v_database, function (error, response, body) {
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
