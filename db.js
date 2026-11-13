const { createClient } = require('@libsql/client');

// Production (Vercel): set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
// Local dev: falls back to a SQLite file in the project folder.
let db;
function getClient() {
    if (!db) {
        const url = process.env.TURSO_DATABASE_URL;
        if (!url && process.env.VERCEL) {
            throw new Error('TURSO_DATABASE_URL is not set');
        }
        db = createClient({
            url: url || 'file:local.db',
            authToken: process.env.TURSO_AUTH_TOKEN
        });
    }
    return db;
}

let ready;
function init() {
    if (!ready) {
        ready = getClient().batch([
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userName TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                pswd TEXT NOT NULL,
                resetToken TEXT,
                resetExpires INTEGER
            )`
        ], 'write').catch(e => { ready = undefined; throw e; });
    }
    return ready;
}

async function query(sql, args = []) {
    await init();
    return getClient().execute({ sql, args });
}

module.exports = { query };
