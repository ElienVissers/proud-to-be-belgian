const express = require('express');
const hb = require('express-handlebars');
const app = express();
const db = require('./db');
const cookieSession = require('cookie-session');

app.engine('handlebars', hb());
app.set('view engine', 'handlebars');
app.use(require('body-parser').urlencoded({extended: false}));
app.use(cookieSession({
    secret: `I'm always angry.`,
    maxAge: 1000 * 60 * 60 * 24 * 14
}));


app.use(express.static(__dirname + "/public"));

app.get('/petition', (req, res) => {
    if (!req.session.signatureId) {
        res.render('mainTemplate', {
            layout: 'main'
        });
    } else {
        res.redirect('/thankyou');
    }
});

app.post('/petition', (req, res) => {
    //console.log("req.body: ", req.body);
    db.addSignature(req.body.first, req.body.last, req.body.sig).then(function(sigId) {
        console.log('sigId: ', sigId);
        req.session.signatureId = sigId;
        res.redirect('/thankyou');
    }).catch(function(err) {
         res.render('mainTemplate', {
            error: true,
            layout: 'main'
        });
    });
});

app.get('/thankyou', (req, res) => {
    //console.log("sig id in object :", req.session.signatureId.rows[0].id);
    if (req.session.signatureId) {
        db.getSignature(req.session.signatureId.rows[0].id).then(function(sig) {
            console.log("then: ", sig);
            res.render('thankyouTemplate', {
                signature: sig.rows[0].sig,
                layout: 'main'
            });
        }).catch(function(err) {
            console.log(err);
        });
    } else {
        res.redirect('/petition');
    }

});

app.get('/signers', (req, res) => {
    if (req.session.signatureId) {
        db.getSigners().then(function(signers) {
            res.render('signersTemplate', {
                signers: signers.rows,
                layout: 'main'
            });
        });
    } else {
        res.redirect('/petition');
    }

});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/petition');
});

app.listen(8080, () => console.log('Listening!'));
