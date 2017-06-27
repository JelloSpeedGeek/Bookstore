var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var pg = require('pg');
var path = require('path');
var url = require('url');
var bodyParser = require('body-parser');
var localDBUrl = "postgres://qxztjquipmttef:ad4a32b5b1780f3a9c6140818e8862c8cefeda25c926a518d68c9d504a51ed8a@ec2-23-21-224-199.compute-1.amazonaws.com:5432/dk2rd0ji5gf1c";
var databaseUrl = process.env.DATABASE_URL || localDBUrl;
var params = url.parse(databaseUrl);
var auth = params.auth.split(':');

var config = {
    user: auth[0],
    password: auth[1],
    host: params.hostname,
    port: params.port,
    database: params.pathname.split('/')[1],
    ssl: true   // NOTICE: if connecting on local db, this should be false
};
var client = new pg.Client(config);
var passport = require('passport-facebook');
client.connect();

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.listen(port, function () {
    console.log('Example app listening on port ' + port);
});

app.get('/', function (req, res) {
    res.render('index', {
		title: "hello!"    
    });
});

app.get('/authors', function (req, res) {
    var results = [];
    var query = client.query("SELECT id, author FROM bookinfo;", function(err, result){
        if(err){
            console.log("Error getting mens items");
            res.send('Cannot get item from mens');
            return;
        }
    });

    query.on('row', function(row){
        results.push(row);
    });

    query.on('end', function(){
        // res.setHeader('Cache-Control','public, max-age= '+ configTime.milliseconds.day*3);
        res.render('authors', {
            results: results
        });
    });
});

app.get('/books', function (req, res) {
    var results = [];
    var query = client.query("SELECT id, bookname FROM bookinfo;", function(err, result){
        if(err){
            console.log("Error getting mens items");
            res.send('Cannot get item from mens');
            return;
        }
    });

    query.on('row', function(row){
        results.push(row);
    });

    query.on('end', function(){
        // res.setHeader('Cache-Control','public, max-age= '+ configTime.milliseconds.day*3);
        res.render('books', {
            results: results
        });
    });
});

app.get('/bookinfo/:id', function(req, res){
    var data = {};
    var id = req.params.id;
    var query = client.query("SELECT * FROM bookinfo where id=$1;", [id], function(err, result){
        if(err){
            console.log("Error getting mens items");
            res.send('Cannot get item from mens');
            return;
        }
    });

    query.on('row', function(row){
        data.bookname = row.bookname;
        data.author = row.author;
        data.genres = row.genres;
        data.imageurl = row.imageurl;
        data.description = row.description;
        data.quantity = row.quantity;
    });

    query.on('end', function(){
        // res.setHeader('Cache-Control','public, max-age= '+ configTime.milliseconds.day*3);
        res.render('bookinformation', data);
    });
});

app.get('/genres', function (req, res) {
    var results = [];
    var query = client.query("SELECT id, genres FROM bookinfo;", function(err, result){
        if(err){
            console.log("Error getting mens items");
            res.send('Cannot get item from mens');
            return;
        }
    });

    query.on('row', function(row){
        results.push(row);
    });

    query.on('end', function(){
        // res.setHeader('Cache-Control','public, max-age= '+ configTime.milliseconds.day*3);
        res.render('genres', {
            results: results
        });
    });
});

app.get('/search', function (req, res) {
    var search = req.query.search;
    var results = [];
    var query = client.query("select * from bookinfo where bookname like '%" + search + "%' or author like '%" + search + "%' or genres like '%" + search + "%'", function(err, result){
        if(err){
            console.log(err);
            res.send('Cannot get item from mens');
            return;
        }
    });

    query.on('row', function(row){
        results.push(row);
    });

    query.on('end', function(){
        // res.setHeader('Cache-Control','public, max-age= '+ configTime.milliseconds.day*3);
        res.render('search', {
            results: results
        });
    });
});

app.post('/register', function (req, res) {
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var username = req.body.username;
  var password = req.body.password;
  var queryString = "insert into userinfo (firstname,lastname,username,password) values ('" + firstname + "','" + lastname + "','" + username + "','" + password + "')";
  var query = client.query(queryString);
  query.on('end', function () {
  		/*redirect is for if we want it to go back to the homepage after registering.*/
  		res.redirect("/");
  });
  query.on('error', function(err) {
      console.log(err);
  });
});

app.get('/login', function (req, res) {
    res.render('login', {
    });
});

app.post('/userLogin', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var queryString = "select * from userinfo where username = '"+username+"' and password = '"+password+"';";
    var query = client.query(queryString);
	query.on('row', function(row){
			console.log(row);
	})
    query.on('end', function () {
    	/*redirect is for if we want it to go back to the homepage after registering.*/
    	res.redirect("/");
    })
    query.on('error', function(err) {
        console.log(err);
    });
});