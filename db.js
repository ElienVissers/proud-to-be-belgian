const spicedPg = require('spiced-pg');
// const db = spicedPg(`postgres:${dbUser}:${dbPassword}@localhost:5432/petition`);
var db;
if (process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL);
} else {
    const {dbUser, dbPassword} = require('./secrets');
    db = spicedPg(`postgres:${dbUser}:${dbPassword}@localhost:5432/petition`);
}


module.exports.getPetitionName = function(petition_id) {
    return db.query(
        `SELECT topic
        FROM petitions
        WHERE id = $1`,
        [petition_id]
    );
};

module.exports.addSignature = function(sig, userId, petitionId) {
    return db.query(
        `INSERT INTO signatures (sig, user_id, petition_id)
        VALUES ($1, $2, $3)
        RETURNING id, petition_id`,
        [sig, userId, petitionId]
    );
};

module.exports.removeSignature = function(sig_id, pet_id) {
    return db.query(
        `DELETE FROM signatures
        WHERE id = $1 AND petition_id = $2`,
        [sig_id, pet_id]
    );
};

module.exports.getSigners = function(petition_id) {
    return db.query(
        `SELECT users.first AS first, users.last AS last, user_profiles.age AS age, user_profiles.city AS city, user_profiles.url AS url
        FROM signatures
        LEFT JOIN users
        ON signatures.user_id = users.id
        LEFT JOIN user_profiles
        ON signatures.user_id = user_profiles.user_id
        WHERE signatures.petition_id = $1`,
        [petition_id]
    );
};

module.exports.getSignersCity = function(city, petition_id) {
    return db.query(
        `SELECT users.first AS first, users.last AS last, user_profiles.age AS age, user_profiles.city AS city, user_profiles.url AS url
        FROM signatures
        LEFT JOIN users
        ON signatures.user_id = users.id
        LEFT JOIN user_profiles
        ON signatures.user_id = user_profiles.user_id
        WHERE LOWER(city) = LOWER($1) AND signatures.petition_id = $2`,
        [city, petition_id]
    );
};

module.exports.getSignature = function(sig_id, petition_id) {
    return db.query(
        `SELECT sig
        FROM signatures
        WHERE id = $1 AND petition_id = $2`,
        [sig_id, petition_id]
    );
};

module.exports.getSigId = function(user_id, petition_id) {
    return db.query(
        `SELECT id AS sig_id
        FROM signatures
        WHERE user_id = $1 AND petition_id = $2`,
        [user_id, petition_id]
    );
};

module.exports.registerUser = function(first, last, email, hashedPassword) {
    return db.query(
        `INSERT INTO users (first, last, email, password)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [first, last, email, hashedPassword]
    );
};

module.exports.getUserInfo = function(email) {
    return db.query(
        `SELECT users.first AS first, users.last AS last, users.id AS id, users.email AS email, users.password AS password
        FROM users
        LEFT JOIN signatures
        ON users.id = signatures.user_id
        WHERE email = $1`,
        [email]
    );
};

module.exports.getProfileInfo = function(id) {
    return db.query(
        `SELECT users.first AS first, users.last AS last, users.email AS email, p.age AS age, p.city AS city, p.url AS url
        FROM users
        LEFT JOIN user_profiles AS p
        ON users.id = p.user_id
        WHERE users.id = $1`,
        [id]
    );
};

module.exports.getPassword = function(user_id) {
    return db.query(
        `SELECT password
        FROM users
        WHERE id = $1`,
        [user_id]
    );
};

module.exports.updateUserWithPassword = function(first, last, email, hashedPassword, user_id) {
    return db.query(
        `UPDATE users
        SET first = $1, last = $2, email = $3, password = $4
        WHERE id = $5`,
        [first, last, email, hashedPassword, user_id]
    );
};

module.exports.updateUserWithoutPassword = function(first, last, email, user_id) {
    return db.query(
        `UPDATE users
        SET first = $1, last = $2, email = $3
        WHERE id = $4`,
        [first, last, email, user_id]
    );
};

module.exports.updateProfile = function(age, city, homepage, user_id) {
    return db.query(
        `INSERT INTO user_profiles (age, city,  url, user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age = $1, city = $2, url = $3`,
        [age ? Number(age) : null || null, city || null, homepage || null, user_id]
    );
};

module.exports.deleteSignatureRow = function(user_id) {
    return db.query(
        `DELETE FROM signatures
        WHERE user_id = $1`,
        [user_id]
    );
};

module.exports.deleteProfileRow = function(user_id) {
    return db.query(
        `DELETE FROM user_profiles
        WHERE user_id = $1`,
        [user_id]
    );
};

module.exports.deleteUserRow = function(user_id) {
    return db.query(
        `DELETE FROM users
        WHERE id = $1`,
        [user_id]
    );
};
