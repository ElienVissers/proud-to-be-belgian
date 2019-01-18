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
    if (!req.session.signatureId) {
        res.redirect('/petition');
        return;
    } else {
        next();
    }
};

const requireSignature2 = (req, res, next) => {
    if (!req.session.signatureId2) {
        res.redirect('/petition2');
        return;
    } else {
        next();
    }
};

//if you signed already, you'll go to thankyou
const requireNoSignature = (req, res, next) => {
    if (req.session.signatureId) {
        res.redirect('/thankyou');
        return;
    } else {
        next();
    }
};

const requireNoSignature2 = (req, res, next) => {
    if (req.session.signatureId2) {
        res.redirect('/thankyou2');
        return;
    } else {
        next();
    }
};

module.exports = {requireSignature, requireSignature2, requireNoSignature, requireNoSignature2, requireLoggedOutUser}
