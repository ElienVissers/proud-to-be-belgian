DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures(
    id SERIAL PRIMARY KEY,
    sig TEXT NOT NULL CHECK (sig <> ''),
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

/*remove first and last from this table and instead get their names from the cookiesession (so petition page only has signature input left)*/
