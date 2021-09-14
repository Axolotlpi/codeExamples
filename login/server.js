if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}
//https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');//hashing/unhashing
const passport = require('passport');//authentication middleware
const flash = require('express-flash');//info banner on redirect
const session = require('express-session');//maintain persistent vars
const methodOverride = require('method-override');

const initializePassport = require('./passport-config');
initializePassport(passport, 
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
);

const users = [];

app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false })); //allows access to form values
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false, //asks: Should we resave our session vars if nothing has changed?
    saveUninitialized: false //asks: Do we save an empty value in the sesssion if there's no val
}));

app.use(passport.initialize());
app.use(passport.session());//persist vars accross session

app.use(methodOverride('_method'));//allows us to change logout form to use DELETE instead of POST

app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs');
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs');
});

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        users.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });
        console.log(users);
        res.redirect('/login');
    } catch {
        res.redirect('/register');
    }
});

app.delete('/logout', (req, res) => {
    req.logOut();//provided by passport
    res.redirect('/login');
});

function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){//check provided by passport
        return next();
    }
    res.redirect('/login');
}
function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect('/');
    }
    next();
}

app.listen(3000);