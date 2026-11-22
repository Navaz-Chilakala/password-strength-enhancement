# Password Strength Enhancement

A sign-up and login app where you can **colour individual characters of your password**. The same text with different colours is a different password, so colour adds strength without making you remember a longer string.

**Live demo:** https://password-strength-enhancement.vercel.app/

## How it works

- **Colour is part of the secret.** Each character is sent as a `character:colour` pair (for example `a:red B:none 1:blue`). To log in you must type the same characters *and* colour them the same way.
- **Extra strength from colour.** With 9 colours, each coloured character adds about log2(9) ≈ 3.2 bits of entropy on top of the usual character-set strength. The dashboard rates the result from Weak to Excellent and shows how much came from characters and how much from colour.
- **Passwords are hashed.** The full `character:colour` string is hashed with **bcrypt** (bcryptjs, cost 10) before it is stored, and logins are checked with `bcrypt.compare`. The database never holds the password or its colours in readable form. Accounts created before hashing was added are upgraded to a hash on their next successful login.
- **The summary never shows the characters.** Strength figures are computed from the password typed in that request and are not stored.

## Tech

Node.js, Express, EJS, bcryptjs, SQLite (libSQL / Turso), deployed on Vercel.

## Run locally
```bash
npm install
npm run dev     # http://localhost:8080, uses local.db
```

## Deploy to Vercel
1. Create a Turso database and get its URL and token.
2. Set the variables from `.env.example` in the Vercel project settings.
3. Push the repo to GitHub and import it in Vercel, or run `vercel --prod`.
