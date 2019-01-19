DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS petitions;

CREATE TABLE signatures(
    id SERIAL PRIMARY KEY,
    sig TEXT NOT NULL CHECK (sig <> ''),
    user_id INTEGER NOT NULL,
    petition_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE petitions(
    id SERIAL PRIMARY KEY,
    topic TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO petitions (topic)
VALUES ('MakeFriesBelgianAgain');

INSERT INTO petitions (topic)
VALUES ('MakeBeerglassesUsefulAgain');
