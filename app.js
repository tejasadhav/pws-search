const express = require("express");
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const app = express();
const config = require('./config/database');

mongoose.connect(config.database);
let db = mongoose.connection;

db.once('open',function(){
  console.log('Connected to MongoDB');
});

db.on('error',function(err){
  console.log(err);
});

app.set('views',path.join(__dirname,'views'));
app.set('view engine','pug');

app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

// Express Session Middleware
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));

// Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Express Validator Middleware
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };users
  }
}));

// Passport Config
require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function(req, res, next){
  res.locals.user = req.user || null;
  next();
});

app.get('/',function(req,res){
  res.render('index',{
    title:'Welcome!..to our Search Engine'
  });
});

const port = process.env.PORT || 8000 ;
let users = require('./routes/users');
let search = require('./routes/search');
app.use('/users',users);
app.use('/search',search);

app.listen(port,function(){
  console.log('Server started on port 3000....');
});
