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

app.get('/', (req, res) => {
    res.redirect('/register');
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
        req.session.signatureId = {};
        res.redirect('/profile');
    }).catch(function(err) {
        console.log("error in registration: ", err);
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
        db.updateProfile(req.body.age, req.body.city, url, req.session.userId);
    }).then(() => {
        res.redirect('/home');
    }).catch(err => {
        console.log(err);
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
                    res.redirect('/home');
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
                res.redirect('/home');
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
        req.session.signatureId = {};
        if (dbInfo.rows[0].password) {
            return bcrypt.compare(req.body.password, dbInfo.rows[0].password);
        }
    }).then(() => {
        Promise.all([
            db.getSigId(req.session.userId, 1),
            db.getSigId(req.session.userId, 2)
        ]).then(results => {
            for (let i = 0; i < results.length; i++) {
                if (results[i].rows[0]) {
                    req.session.signatureId[i +1] = results[i].rows[0].sig_id;
                }
            }
        }).then(() => {
            res.redirect('/home');
        }).catch(function(err) {
            req.session = null;
            console.log(err);
            res.render('loginTemplate', {
                error: true,
                layout: 'main'
            });
        });
    });
});

app.get('/home', (req, res) => {
    let petitions = [];
    if (Object.keys(req.session.signatureId).length != 0) {
        var numSig = Object.keys(req.session.signatureId).length;
        var promArr = [];
        for (let i = 0; i < numSig; i++) {
            promArr.push(db.getPetitionName(Object.keys(req.session.signatureId)[i]));
        }
        Promise.all(promArr).then(results => {
            return new Promise(function(resolve) {
                for (var j = 0; j < results.length; j++) {
                    petitions.push(results[j].rows[0].topic);
                }
                if (j == results.length) {
                    resolve();
                }
            }).then(() => {
                console.log('signed = true');
                console.log('petitions: ', petitions);
                res.render('homeTemplate', {
                    signed: true,
                    petitions: petitions,
                    layout: 'main'
                });
            });
        }).catch(err => {
            console.log('error in promise.all: ', err);
        });
    } else {
        console.log('signed = false');
        res.render('homeTemplate', {
            signed: false,
            petitions: petitions,
            layout: 'main'
        });
    }
    // array of petition ids: Object.keys(req.session.signatureId)
    // loop through it: Object.keys(req.session.signatureId)[i]
});

app.get('/petition/:id', requireNoSignature, (req, res) => {
    if (req.params.id == 1) {
        res.render('mainTemplate1', {
            layout: 'main'
        });
    } else if (req.params.id == 2){
        res.render('mainTemplate2', {
            layout: 'main'
        });
    }

});

app.post('/petition/:id', requireNoSignature, (req, res) => {
    db.addSignature(req.body.sig, req.session.userId, req.params.id).then(function({rows}) {
        req.session.signatureId[req.params.id] = rows[0].id;
        res.redirect('/thankyou/' + req.params.id);
    }).catch(function(err) {
        console.log(err);
        res.render('mainTemplate' + req.params.id, {
            error: true,
            layout: 'main'
        });
    });
});

app.get('/thankyou/:id', requireSignature, (req, res) => {
    db.getSignature(req.session.signatureId[req.params.id], req.params.id).then(function(sig) {
        if (req.params.id == 1) {
            res.render('thankyouTemplate', {
                signature: sig.rows[0].sig,
                name: req.session.first,
                layout: 'main'
            });
        } else if (req.params.id == 2) {
            res.render('thankyouTemplate2', {
                signature: sig.rows[0].sig,
                name: req.session.first,
                layout: 'main'
            });
        }
    }).catch(function(err) {
        console.log(err);
    });
});

app.post('/thankyou/:id', (req, res) => {
    db.removeSignature(req.session.signatureId[req.params.id], req.params.id).then(() => {
        delete req.session.signatureId[req.params.id];
    }).then(() => {
        res.redirect('/home');
    }).catch(err => {
        console.log("error when removing signature: ", err);
    });
});

app.get('/signers/:id', requireSignature, (req, res) => {
    db.getSigners(req.params.id).then(function(signers) {
        if (req.params.id == 1) {
            res.render('signersTemplate', {
                signers: signers.rows,
                layout: 'main'
            });
        } else if (req.params.id == 2) {
            res.render('signersTemplate2', {
                signers: signers.rows,
                layout: 'main'
            });
        }
    }).catch(err => {
        console.log(err);
    });
});

app.get('/signers/:id/:city', requireSignature, (req, res) => {
    const city = req.params.city;
    db.getSignersCity(city, req.params.id).then(function(signers) {
        if (req.params.id == 1) {
            res.render('signersTemplate', {
                layout: 'main',
                signers: signers.rows,
                titleCity: city
            });
        } else if (req.params.id == 2) {
            res.render('signersTemplate2', {
                layout: 'main',
                signers: signers.rows,
                titleCity: city
            });
        }
    });
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/login');
});

app.listen(process.env.PORT || 8080, () => console.log('Listening!'));
