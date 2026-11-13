const { createClient } = require('@libsql/client');

// Production (Vercel): set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
// Local dev: falls back to a SQLite file in the project folder.
const db = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN
});

let ready;
function init() {
    if (!ready) {
        ready = db.batch([
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userName TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                pswd TEXT NOT NULL,
                resetToken TEXT,
                resetExpires INTEGER
            )`
        ], 'write');
    }
    return ready;
}

async function query(sql, args = []) {
    await init();
    return db.execute({ sql, args });
}

module.exports = { query };
