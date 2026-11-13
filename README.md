# Password Strength Enhancement

Express + EJS registration/login app backed by SQLite (libSQL / Turso), deployable on Vercel.

## Run locally
```bash
npm install
npm run dev     # http://localhost:8080, uses local.db
```

## Deploy to Vercel
1. Create a Turso database and get its URL and token.
2. Set the variables from `.env.example` in the Vercel project settings.
3. Push the repo to GitHub and import it in Vercel, or run `vercel --prod`.
