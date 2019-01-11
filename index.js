const express = require('express');
const hb = require('express-handlebars');
const app = express();
const db = require('./db');

app.engine('handlebars', hb());
app.set('view engine', 'handlebars');
app.use(require('body-parser').urlencoded({extended: false}));

app.use(express.static(__dirname + "/public"));

app.get('/petition', (req, res) => {
    res.render('mainTemplate', {
        layout: 'main'
    });
});

app.post('/petition', (req, res) => {
    console.log("req.body: ", req.body);
    db.addSignature(req.body.first, req.body.last, req.body.sig).then(function() {
        res.redirect('/thankyou');
    }).catch(function(err) {
         res.render('mainTemplate', {
            error: true,
            layout: 'main'
        })
    });
});

app.get('/thankyou', (req, res) => {
    res.render('thankyouTemplate', {
        layout: 'main'
    });
});

app.get('/signers', (req, res) => {
    db.getSigners().then(function(signers) {
        console.log("signers.rows: ", signers.rows)
        res.render('signersTemplate', {
            signers: signers.rows,
            layout: 'main'
        });
        //why is sig not showing in the console of singers.rows?
    });
});

app.listen(8080, () => console.log('Listening!'));
