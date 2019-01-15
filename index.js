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
        res.redirect('/petition');
    }).catch(function(err) {
        res.render('registerTemplate', {
            error: true,
            layout: 'main'
        });
    });
});

app.get('/login', requireLoggedOutUser, (req, res) => {
    res.render('loginTemplate', {
        layout: 'main'
    });
});

app.post('/login', requireLoggedOutUser, (req, res) => {
/*LOGIN also do another query to get the sig id to know if they signed */
    let user;
    db.getUserInfo(req.body.email).then(dbInfo => {
        user = {
            id: dbInfo.rows[0].id,
            first: dbInfo.rows[0].first,
            last: dbInfo.rows[0].last,
            email: dbInfo.rows[0].email,
            password: dbInfo.rows[0].password
        }
        if (user.password) {
            return bcrypt.compare(req.body.password, user.password);
        }
    }).then(() => {
        return db.getSigId(user.id);
    }).then(({rows}) => {
        req.session.userId = user.id;
        req.session.first = user.first;
        req.session.last = user.last;
        if (rows[0]) {
            req.session.signatureId = rows[0].id;
        }
        res.redirect('/petition');
    }).catch(function(err) {
        console.log(err);
        res.render('loginTemplate', {
            error: true,
            layout: 'main'
        });
    });
})

app.get('/petition', requireNoSignature, (req, res) => {
    res.render('mainTemplate', {
        layout: 'main'
    });
});

app.post('/petition', requireNoSignature, (req, res) => {
    db.addSignature(req.session.first, req.session.last, req.body.sig, req.session.userId).then(function({rows}) {
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
        console.log("then: ", sig);
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

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/login');
});

app.listen(8080, () => console.log('Listening!'));
