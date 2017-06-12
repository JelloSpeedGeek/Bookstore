var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var pg = require('pg');
var path = require('path');
var bodyParser = require('body-parser');
var connectionString = process.env.DATABASE_URL||"postgres://mirandange:300323076@depot:5432/mirandange_jdbc";
var client = new pg.Client(connectionString);
var passport = require('passport');
client.connect();

/*------------------------------*/

var Strategy	=	require('passport-facebook').Strategy;
passport.use(new	FacebookStrategy({
    clientID:	1318994721499964,
    clientSecret:"419b5142fda611cc073f398fb03b5761",
callbackURL:	"https://bookwork-storybook-bookstore.herokuapp.com/auth/facebook/callback"
},

function(accessToken,	refreshToken,	profile,	cb)	{
    User.findOrCreate({	facebookId:	profile.id	},	function	(err, user)	{
        return	cb(err,	user);
    });			}));

app.get('/auth/facebook',
    passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook',	{	failureRedirect:	'/login'	}),
    function(req,	res)	{
//	Successful	authentication,	redirect	home.
        res.redirect('/');
    });

/*------------------------------*/

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
      res.sendStatus(200);
  })
  query.on('error', function(err) {
      console.log(err);
  });
  
  console.log(firstname);
  console.log(lastname);
  console.log(username);
  console.log(password);
  
  /*redirect is for if we want it to go back to the homepage after registering.*/
  res.redirect("/");
});

app.get('/login', function (req, res) {
    res.render('login', {
    });
});

app.get('/userLogin', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;

    console.log(username);
    console.log(password);

    var queryString = "select exists (select true from userinfo where username = '"+username+"' and password = '"+password+"');";
    var query = client.query(queryString);
    query.on('end', function () {
        res.sendStatus(200);
    })
    query.on('error', function(err) {
        console.log(err);
    });
    /*redirect is for if we want it to go back to the homepage after registering.*/
    res.redirect("/");
});

