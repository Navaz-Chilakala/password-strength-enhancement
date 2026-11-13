const { createClient } = require('@libsql/client');

// Production (Vercel): set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
// Local dev: falls back to a SQLite file in the project folder.
let db;
function getClient() {
    if (!db) {
        const url = process.env.TURSO_DATABASE_URL;
        // Vercel's only writable folder is /tmp (ephemeral: data resets on cold start).
        // Set TURSO_DATABASE_URL for data that persists.
        const fallback = process.env.VERCEL ? 'file:/tmp/local.db' : 'file:local.db';
        db = createClient({
            url: url || fallback,
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
                pswd TEXT NOT NULL
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
