const express = require('express');
const hb = require('express-handlebars');
const app = express();
const db = require('./db');
const bcrypt = require('./bcrypt');
const security = require('./security');
const cookieSession = require('cookie-session');
const csurf = require('csurf');
const {requireLoggedOutUser, requireSignature, requireNoSignature} = require('./middleware');


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

app.get('/profile', (req, res) => {
    res.render('profileTemplate', {
        layout: 'main',
        name: req.session.first
    });
});

app.post('/profile', (req, res) => {
    security.checkUrl(req.body.homepage).then(url => {
        db.updateProfile(req.body.age, req.body.city, url, req.session.userId)
    }).then(() => {
        res.redirect('/petition');
    }).catch(err => {
        res.render('profileTemplate', {
            error: true,
            name: req.session.first,
            layout: 'main'
        });
    });
});

app.post('/delete', (req,res) => {
    db.deleteSignatureRow(req.session.userId).then(() => {
        db.deleteProfileRow(req.session.userId);
    }).then(() => {
        db.deleteUserRow(req.session.userId);
    }).then(() => {
        res.redirect('/bye');
    }).catch(err => {
        console.log("error in delete: ", err);
    });
});

app.get('/bye', (req, res) => {
    const name = req.session.first;
    req.session = null;
    res.render('byeTemplate', {
        name: name,
        layout: 'main'
    });
});

app.get('/profile/edit', (req, res) => {
    db.getProfileInfo(req.session.userId).then(dbInfo => {
        res.render('profileEditTemplate', {
            layout: 'main',
            first: dbInfo.rows[0].first,
            last: dbInfo.rows[0].last,
            email: dbInfo.rows[0].email,
            age: dbInfo.rows[0].age || null,
            city: dbInfo.rows[0].city || null,
            homepage: dbInfo.rows[0].url || null
        });
    });
});

app.post('/profile/edit', (req, res) => {
    var url;
    function errorDisplay(err) {
        console.log("error: ", err);
        db.getProfileInfo(req.session.userId).then(dbInfo => {
            res.render('profileEditTemplate', {
                layout: 'main',
                first: dbInfo.rows[0].first,
                last: dbInfo.rows[0].last,
                email: dbInfo.rows[0].email,
                age: dbInfo.rows[0].age || null,
                city: dbInfo.rows[0].city || null,
                homepage: dbInfo.rows[0].url || null,
                error: true
            });
        });
    }
    security.checkUrl(req.body.homepage).then(resultUrl => {
        url = resultUrl;
        if (req.body.password !== '') {
            bcrypt.hash(req.body.password).then(hashedPassword => {
                Promise.all([
                    db.updateUserWithPassword(req.body.first, req.body.last, req.body.email, hashedPassword, req.session.userId),
                    db.updateProfile(req.body.age, req.body.city, url, req.session.userId)
                ]).then(() => {
                    req.session.first = req.body.first;
                    req.session.last = req.body.last;
                    res.redirect('/petition')
                }).catch(err => {
                    errorDisplay(err);
                });
            });
        } else {
            Promise.all([
                db.updateUserWithoutPassword(req.body.first, req.body.last, req.body.email, req.session.userId),
                db.updateProfile(req.body.age, req.body.city, url, req.session.userId)
            ]).then(() => {
                req.session.first = req.body.first;
                req.session.last = req.body.last;
                res.redirect('/petition')
            }).catch(err => {
                errorDisplay(err);
            });
        }
    }).catch(err => {
        errorDisplay(err);
    });
});

app.get('/login', requireLoggedOutUser, (req, res) => {
    res.render('loginTemplate', {
        layout: 'main'
    });
});

app.post('/login', requireLoggedOutUser, (req, res) => {
    db.getUserInfo(req.body.email).then(dbInfo => {
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

app.post('/thankyou', (req, res) => {
    db.removeSignature(req.session.userId).then(() => {
        req.session.signatureId = null;
    }).then(() => {
        res.redirect('/petition');
    }).catch(err => {
        console.log("error when removing signature: ", err);
    })
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
