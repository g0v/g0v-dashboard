var http = require('http');



var app = http.createServer(function(req,res){
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ a: 1 }));
});
console.log("listen to 8080");
app.listen(8080);

// > {"a":1}
