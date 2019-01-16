const express = require('express');
const hb = require('express-handlebars');
const app = express();
const db = require('./db');
const bcrypt = require('./bcrypt');
const cookieSession = require('cookie-session');
const csurf = require('csurf');
const {requireLoggedOutUser, requireSignature, requireNoSignature} = require('./middleware')

app.engine('handlebars', hb());
app.set('view engine', 'handlebars');
app.use(require('body-parser').urlencoded({extended: false}));
app.use(cookieSession({
    secret: `Token that the request came from my own site! :D`,
    maxAge: 1000 * 60 * 60 * 24 * 14
}));
app.use(csurf());
app.use(express.static(__dirname + "/public"));

//protects against attacks
app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

//logged out user can only access login and registration
app.use(function(req, res, next) {
    if (!req.session.userId && req.url != '/register' && req.url != '/login') {
        res.redirect('/register');
    } else {
        next();
    }
});

app.get('/register', requireLoggedOutUser, (req, res) => {
    res.render('registerTemplate', {
        layout: 'main'
    });
});

app.post('/register', requireLoggedOutUser, (req, res) => {
    bcrypt.hash(req.body.password).then(hashedPassword => {
        return db.registerUser(req.body.first, req.body.last, req.body.email, hashedPassword);
    }).then(({rows}) => {
        req.session.userId = rows[0].id;
        req.session.first = rows[0].first;
        req.session.last = rows[0].last;
        res.redirect('/profile');
    }).catch(function(err) {
        res.render('registerTemplate', {
            error: true,
            layout: 'main'
        });
    });
});

//Before you put the url a user specifies into the href attribute of a link, you must make sure that it begins with either "http://" or "https://" or "//"
//OR make them not being able to post if incorrect
//OR when you pull them out of database, discard or edit the wrong ones
//not sure where in the code all of this should happen though, not necessarily here
app.get('/profile', (req, res) => {
    res.render('profileTemplate', {
        layout: 'main',
        name: req.session.first
    });
});

app.post('/profile', (req, res) => {
    db.registerProfile(req.body.age, req.body.city, req.body.homepage, req.session.userId).then(() => {
        res.redirect('/petition');
    });
});

app.get('/login', requireLoggedOutUser, (req, res) => {
    res.render('loginTemplate', {
        layout: 'main'
    });
});

app.post('/login', requireLoggedOutUser, (req, res) => {
    db.getUserInfo(req.body.email).then(dbInfo => {
        console.log("dbInfo: ", dbInfo);
        req.session.userId = dbInfo.rows[0].id;
        req.session.first = dbInfo.rows[0].first;
        req.session.last = dbInfo.rows[0].last;
        if (dbInfo.rows[0].sig_id) {
            req.session.signatureId = dbInfo.rows[0].sig_id;
        }
        if (dbInfo.rows[0].password) {
            return bcrypt.compare(req.body.password, dbInfo.rows[0].password);
        } //if not, they need to register first
    }).then(() => {
        res.redirect('/petition');
    }).catch(function(err) {
        console.log(err);
        res.render('loginTemplate', {
            error: true,
            layout: 'main'
        });
    });
});

app.get('/petition', requireNoSignature, (req, res) => {
    res.render('mainTemplate', {
        layout: 'main'
    });
});

app.post('/petition', requireNoSignature, (req, res) => {
    db.addSignature(req.body.sig, req.session.userId).then(function({rows}) {
        req.session.signatureId = rows[0].id;
        res.redirect('/thankyou');
    }).catch(function(err) {
        console.log(err);
        res.render('mainTemplate', {
            error: true,
            layout: 'main'
        });
    });
});

app.get('/thankyou', requireSignature, (req, res) => {
    db.getSignature(req.session.signatureId).then(function(sig) {
        res.render('thankyouTemplate', {
            signature: sig.rows[0].sig,
            layout: 'main'
        });
    }).catch(function(err) {
        console.log(err);
    });
});

app.get('/signers', requireSignature, (req, res) => {
    db.getSigners().then(function(signers) {
        res.render('signersTemplate', {
            signers: signers.rows,
            layout: 'main'
        });
    });
});

app.get('/signers/:city', requireSignature, (req, res) => {
    const city = req.params.city;
    db.getSignersCity(city).then(function(signers) {
        res.render('signersTemplate', {
            layout: 'main',
            signers: signers.rows,
            titleCity: city
        });
    });
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/login');
});

app.listen(8080, () => console.log('Listening!'));
