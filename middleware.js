//checks if you are logged out, before the code runs that route
const requireLoggedOutUser = (req, res, next) => {
    if (req.session.userId) {
        res.redirect('/home');
        return;
    } else {
        next();
    }
};

//if you didnt sign yet, you'll go to petition
const requireSignature = (req, res, next) => {
    if (req.originalUrl.endsWith(1) && !req.session.signatureId[1]) {
        res.redirect('/petition/1');
        return;
    } else if (req.originalUrl.endsWith(2) && !req.session.signatureId[2]) {
        res.redirect('/petition/2');
        return;
    } else {
        next();
    }
};

//if you signed already, you'll go to thankyou
const requireNoSignature = (req, res, next) => {
    if (req.originalUrl.endsWith(1) && req.session.signatureId[1]) {
        res.redirect('/thankyou/1');
        return;
    } else if (req.originalUrl.endsWith(2) && req.session.signatureId[2]) {
        res.redirect('/thankyou/2');
        return;
    }else {
        next();
    }
};

module.exports = {requireSignature, requireNoSignature, requireLoggedOutUser};
