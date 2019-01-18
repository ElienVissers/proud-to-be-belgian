DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS signatures2;

CREATE TABLE signatures(
    id SERIAL PRIMARY KEY,
    sig TEXT NOT NULL CHECK (sig <> ''),
    user_id INTEGER NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE signatures2(
    id SERIAL PRIMARY KEY,
    sig TEXT NOT NULL CHECK (sig <> ''),
    user_id INTEGER NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
