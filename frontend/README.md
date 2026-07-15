# CodeGuard Frontend

Live dashboard for on-chain file integrity checking on Monad Testnet.

## Setup

1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Hashing Modes

### Manual Mode (Default / Netlify)
In `manual` mode, you can upload `package-lock.json` directly in the browser to hash it client-side, or paste a hash manually.

### Live Mode (Demo)
To use `live` mode, set `VITE_LOCAL_HASH_MODE=live` in your `.env` and run a local helper to serve hashes:

```bash
# Minimal node helper (example)
# node -e "const http=require('http'); const crypto=require('crypto'); const fs=require('fs'); http.createServer((req,res)=>{ res.setHeader('Access-Control-Allow-Origin', '*'); const hash = '0x' + crypto.createHash('sha256').update(fs.readFileSync('../package-lock.json')).digest('hex'); res.end(JSON.stringify({hash})); }).listen(3001)"
```

## Deployment

Build the static site:
```bash
npm run build
```
Deploy the `dist` folder to Netlify.
