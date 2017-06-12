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
    res.render('authors', {
    });
});

app.get('/books', function (req, res) {
    res.render('books', {
    });
});

app.get('/genres', function (req, res) {
    res.render('genres', {
    });
});

app.get('/search', function (req, res) {
    res.render('search', {
    });
});

app.get('/register', function (req, res) {
    res.render('register', {
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
  })
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

