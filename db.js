const spicedPg = require('spiced-pg');
const {dbUser, dbPassword} = require('./secrets');
const db = spicedPg(`postgres:${dbUser}:${dbPassword}@localhost:5432/petition`);


module.exports.addSignature = function(sig, userId) {
    return db.query(
        `INSERT INTO signatures (sig, user_id)
        VALUES ($1, $2)
        RETURNING id`,
        [sig, userId]
    );
}

module.exports.getSigners = function() {
    return db.query(
        `SELECT users.first AS first, users.last AS last, user_profiles.age AS age, user_profiles.city AS city, user_profiles.url AS url
        FROM signatures
        LEFT JOIN users
        ON signatures.user_id = users.id
        LEFT JOIN user_profiles
        ON signatures.user_id = user_profiles.user_id`
    );
}

module.exports.getSignersCity = function(city) {
    return db.query(
        `SELECT users.first AS first, users.last AS last, user_profiles.age AS age, user_profiles.city AS city, user_profiles.url AS url
        FROM signatures
        LEFT JOIN users
        ON signatures.user_id = users.id
        LEFT JOIN user_profiles
        ON signatures.user_id = user_profiles.user_id
        WHERE LOWER(city) = LOWER($1)`,
        [city]
    );
}

module.exports.getSignature = function(sig_id) {
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

module.exports.registerProfile = function(age, city, homepage, user_id) {
    return db.query(
        `INSERT INTO user_profiles (age, city,  url, user_id)
        VALUES ($1, $2, $3, $4)`,
        [age ? Number(age) : null || null, city || null, homepage || null, user_id]
    );
}

module.exports.getUserInfo = function(email) {
    return db.query(
        `SELECT users.first AS first, users.last AS last, users.id AS id, users.email AS email, users.password AS password, signatures.id AS sig_id
        FROM users
        LEFT JOIN signatures
        ON users.id = signatures.user_id
        WHERE email = $1`,
        [email]
    );
}
