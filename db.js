const spicedPg = require('spiced-pg');
const {dbUser, dbPassword} = require('./secrets');
const db = spicedPg(`postgres:${dbUser}:${dbPassword}@localhost:5432/petition`);


module.exports.addSignature = function(first, last, sig, userId) {
    return db.query(
        `INSERT INTO signatures (first, last, sig, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id`, //we want this in the cookie session to know that they signed
        [first, last, sig, userId]
    );
}

module.exports.getSigners = function() {
    return db.query(
        `SELECT first, last
        FROM signatures`
    );
}

module.exports.getSignature = function(sig_id) {
    console.log(sig_id);
    return db.query(
        `SELECT sig
        FROM signatures
        WHERE id = $1`,
        [sig_id]
    );
}

module.exports.getSigId = function(user_id) {
    console.log(user_id, typeof user_id);
    return db.query(
        `SELECT id
        FROM signatures
        WHERE user_id = $1`,
        [user_id]
    );
}

module.exports.registerUser = function(first, last, email, hashedPassword) {
    return db.query(
        `INSERT INTO users (first, last,  email, password)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [first, last, email, hashedPassword]
    );
}

module.exports.getUserInfo = function(email) {
    return db.query(
        `SELECT *
        FROM users
        WHERE email = $1`,
        [email]
    )
}
