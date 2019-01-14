const spicedPg = require('spiced-pg');
const {dbUser, dbPassword} = require('./secrets');
const db = spicedPg(`postgres:${dbUser}:${dbPassword}@localhost:5432/petition`);

module.exports.addSignature = function(first, last, sig) {
    return db.query(
        `INSERT INTO signatures (first, last, sig)
        VALUES ($1, $2, $3)
        RETURNING id`,
        [first, last, sig]
    );
}

module.exports.getSigners = function() {
    return db.query(
        `SELECT first, last
        FROM signatures`
    );
}

module.exports.getSignature = function(id) {
    return db.query(
        `SELECT sig
        FROM signatures
        WHERE id = $1`,
        [id]
    );
}
