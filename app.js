var express = require('express');
var app = express();
var expressSession = require( 'express-session' );
var passport = require( 'passport' );
var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');
var passportFacebook = require( 'passport-facebook' );
var initializedPassport = passport.initialize();
var passportSession = passport.session();
var port = process.env.PORT || 8080;
var userID;
var userName;
var tokenID;
var localDBUrl = "postgres://qxztjquipmttef:ad4a32b5b1780f3a9c6140818e8862c8cefeda25c926a518d68c9d504a51ed8a@ec2-23-21-224-199.compute-1.amazonaws.com:5432/dk2rd0ji5gf1c";
var basket = false;
var pg = require('pg');
var path = require('path');
var url = require("url");
var crypto = require("crypto");
var genToken = require('rand-token');
var bodyParser = require('body-parser');
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
client.connect();
var session = expressSession({
    secret: '60dd06aa-cf8e-4cf8-8925-6de720015ebf',
    resave: false,
    saveUninitialized: false,
    name: 'sid'
});

var facebookAuth = {
        'clientID'        : '1318994721499964', // facebook App ID
        'clientSecret'    : '419b5142fda611cc073f398fb03b5761', // facebook App Secret
        'callbackURL'     : 'http://localhost:8080/auth/facebook/callback',
        'profileFields': ['id', 'emails', 'first_name', 'last_name', 'timezone', 'updated_time', 'verified'],
    };

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
      extended: true
    }));
app.use(bodyParser.json());
app.use( session );
app.use( initializedPassport );
app.use( passportSession );

passport.serializeUser( function( user, cb ) {
    //nothing to do here as we use the username as it is
    cb( null, user );
} );

passport.deserializeUser( function( obj, cb ) {
    //again, we just pass the username forward
    cb( null, obj );
} );

passport.use( new passportFacebook( {
        clientID: facebookAuth.clientID,
        clientSecret: facebookAuth.clientSecret,
        callbackURL: facebookAuth.callbackURL,
    },
   
    function (token, refreshToken, profile, done) {
    var exists = false;
    
    var queryString1 = "select exists(select * from userinfo where facebookid = '"+profile.id+"')  as \"exists\";";
    var query = client.query(queryString1);
	query.on('row', function(row){
			
        if (row.exists == true) {
          
           var queryString4 = "select * from userinfo where facebookid = '"+profile.id+"';";
          var query4 = client.query(queryString4);
          
           query4.on('row', function(row){
            console.log( row.id);
             userID = row.id;
             tokenID = token;
	     client.query("insert into loggedinfo (userid, token) values ("+userID+",'"+tokenID+"')");
           });
        
        
          return done(null, profile.id);
      } else {
         var newUser = {
              "id":       profile.id,
              "name":     profile.name.givenName + ' ' + profile.name.familyName,
              // "email":    (profile.emails[0].value || '').toLowerCase(),
              "token":    token
          };
          users.push(newUser);
          console.log(newUser);
          console.log('entering new user' + profile);
          var names =  profile.displayName.split(" ");
          var firstname = names[0];
          var lastname = names[1];
          console.log("here is the error at creation");
            var queryString2 = "insert into userinfo (firstname,lastname,password,facebookid,username) values ('" + firstname+ "','" + lastname + "' , 1234 , '"  + profile.id + "','" + profile.id +  "');";
          var query2 = client.query(queryString2);

         query2.on('error', function(err) {
         console.log(err);
        });

        query2.on('end', function() {
        console.log("now we are getting his user ID");
        var queryString3 = "select id from userinfo where facebookid = '"+profile.id+"';";
        var query3 = client.query(queryString3);
	    query3.on('row', function(row){
       
        userID = row.id;
         });
        });
          return done(null, profile.id);
      }
            
	})

   
  }));

// app.get( '/login/facebook', passport.authenticate('facebook') );
//
// app.get( '/login/facebook/return',
//         passport.authenticate('facebook', { failureRedirect: '/login' }),
//         ( req, res ) => {
//                 res.redirect('/');
// } );

// route middleware to ensure user is logged in, if it's not send 401 status
function isLoggedIn(req, res, next) {
  res.locals.login = req.isAuthenticated();
    console.log('status of log is ' +   res.locals.login);
    if (req.isAuthenticated())
        return next();

    res.sendStatus(401);
}

// route middleware to ensure user is logged in, if it's not send 401 status
function isLogged(req, res, next) {
  res.locals.login = req.isAuthenticated();
  res.locals.token = userID;
  res.locals.basket = basket;
  return next();
}

function setToken(userid){
    var token;
    token = genToken.generate(16);
    var queryString = "insert into loggedinfo (userid, token) values ("+userid+",'"+token+"')";
    var query = client.query(queryString);
    return token;
}

app.use(isLogged);
// // home page
// app.get("/", function (req, res) {
//     res.send("Hello!");
// });

// login page
/*app.get("/login", function (req, res) {
    res.send("<a href='/auth/facebook'>login through facebook</a>");
});*/

// send to facebook to do the authentication
app.get("/auth/facebook", passport.authenticate("facebook", { scope : "email" }));
// handle the callback after facebook has authenticated the user
app.get("/auth/facebook/callback",
    passport.authenticate("facebook", {
        successRedirect : "http://localhost:8080/",
        failureRedirect : "http://localhost:8080/"
}));

// content page, it calls the isLoggedIn function defined above first
// if the user is logged in, then proceed to the request handler function,
// else the isLoggedIn will send 401 status instead
app.get("/search",  function (req, res) {
	var search = req.query.search;
    var results = [];
    var query = client.query("select * from bookinfo where bookname like '%" + search + "%' or author like '%" + search + "%' or genres like '%" + search + "%'", function(err, result){
        if(err){
            console.log(err);
            res.send('Cannot find book');
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

// logout request handler, passport attaches a logout() function to the req object,
// and we call this to logout the user, same as destroying the data in the session.
app.get("/logout", function(req, res) {
    req.logout();
    res.send("logout success!");
});

// // send to facebook to do the authentication
// app.get("/auth/facebook", passport.authenticate("facebook", { scope : "email" }));
// // handle the callback after facebook has authenticated the user
// app.get("/auth/facebook/callback",
//     passport.authenticate("facebook", {
//         successRedirect : "/content",
//         failureRedirect : "/"
// }));
//
//
// // content page, it calls the isLoggedIn function defined above first
// // if the user is logged in, then proceed to the request handler function,
// // else the isLoggedIn will send 401 status instead
// app.get("/content", isLoggedIn, function (req, res) {
//     res.send("Congratulations! you've successfully logged in.");
// });
//
// // logout request handler, passport attaches a logout() function to the req object,
// // and we call this to logout the user, same as destroying the data in the session.
// app.get("/logout", function(req, res) {
//     req.logout();
//     res.send("logout success!");
// });

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

app.get('/checkout', function (req, res) {
  res.render('checkout');
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
app.get('/removeItem/:false', function(req, res){
console.log('removing the item from SERVER');
basket = false;
res.locals.basket = false;
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
app.get('/logAction/:log', function(req, res){
    var data = {};
    var log = req.params.log;
    //var conv = JSON.parse(log);

  console.log("cookies received by server" + log.split(";")[1]);
  //console.log("cookies received by domain" + req);
  basket = true;
  res.locals.basket = basket;
  var date = log.split(";")[1];
  var itemID = log.split(";")[0];

	var queryString2 = "insert into log (userid,tokenid,itemid,date,description) values ('" + userID+ "','" + tokenID +  "','" + itemID + "','" + date + "','added to cart');";
  var query2 = client.query(queryString2);

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

function getDate() {
 var date = new Date();
date.setTime(date.getTime());

return date.toGMTString();


}

app.get('/purchase/:servoutput', function (req, res) {
    var log = req.params.servoutput;
    //var conv = JSON.parse(log);
    basket = false;
    var date = getDate();   
    res.locals.basket = basket;

 
   console.log("received checkout from:" + log);
   var queryString2 = log;
  var query2 = client.query(queryString2);

  query2.on('end', function(){
        // res.setHeader('Cache-Control','public, max-age= '+ configTime.milliseconds.day*3);
       var items = queryString2.split(";");
       for (var i = 0;i < items.length; i++ ) {
        var itemname = items[i].split("bookname= ").pop();
        var fix = itemname.split(";").pop();
        itemname = fix;
        console.log("purchaes bookname is " + itemname);
       }
    });
 
  var results = [];
    var query = client.query("SELECT id, bookname, quantity FROM bookinfo;", function(err, result){
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
    console.log('Start userLogin');
    console.log(req.body);
    var username = req.body.username;
    var storedPassword = req.body.password;
    console.log('username = ' + username);
    //var queryString = "select exists (select true from userinfo where username = '"+username+"'";
    var queryString = "select * from userinfo where username='"+username+"'";
    var query = client.query(queryString);
    console.log('sent query');
    query.on('row', function (row){
	console.log('query returned row');
        if(row.username = username){
            var queryString2 = "select (id, password) from userinfo where username = '"+username+"'";
            var query2 = client.query(queryString2);
            query2.on('row', function (){
	        var userid = row.id;
	        var storedPassword = row.password;
	        if(password = storedPassword){
	            var usertoken = setToken(userid)
		      req.session.user = row;
	        } else{
	            //password is wrong
	            //needs to throw error where to say username or password is wrong
		    res.redirect("/");
	        }
	    });
        } else{
	    //user does not exist
	    //throw error saying username or password is incorrect
        }
    })
    query.on('end', function () {
        res.redirect("/");
    })
});

/*app.use((req,res,next) => {
    redis.get(req.headers.Auth).then(reply => {
        if (reply) {
            User. findById(reply).then(user => {
                req.user = user;
                next();
            });
        }
        else {
            throw new Error('403');
        }
    })
});*/
