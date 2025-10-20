Deploy guide: Frontend (Vercel) + Backend (Render) from GitHub

Overview
- Frontend: static site deployed to Vercel (connect to GitHub repo)
- Backend/proxy: Node.js service deployed to Render (connect to same GitHub repo or separate repo)

Prerequisites
- GitHub account
- Vercel account and domain configured
- Render account
- Node.js project with `proxy-server.js` and `package.json` (this repo)

1) Push repo to GitHub
- From your local project folder:

  git init
  git add .
  git commit -m "initial"
  git branch -M main
  git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
  git push -u origin main

2) Deploy frontend to Vercel
- In Vercel dashboard, choose "Import Project" -> GitHub -> select repo -> Deploy
- Configure build settings if needed (static site: no build command, output directory = root)
- Add domain in Vercel settings (if you have a custom domain)

3) Deploy backend/proxy to Render
- In Render dashboard, click "New" -> "Web Service"
- Connect GitHub and choose the repo
- For Environment, choose "Node"
- Build command: npm install
- Start command: node proxy-server.js
- Important: add environment variables in Render > Environment > New Variable:
  - BITGET_API_KEY
  - BITGET_SECRET
  - BITGET_PASSPHRASE
  - (optional) other keys for MEXC/BingX
- Deploy. Render will provide a public URL like `https://your-service.onrender.com`

4) Configure frontend to use backend proxy
- In your frontend code (before initializing APIs), set:

  window.PROXY_URL = 'https://your-service.onrender.com';

- Commit this change or set it using an environment-specific configuration on Vercel (REACT_APP_PROXY_URL or similar) so you don't hardcode secrets.

5) Test
- Open your Vercel site (your domain)
- Perform a sync action
- Check logs on Render if any errors

Security notes
- Never put secrets in your frontend code or commit them to GitHub.
- Store secrets in Render/Vercel env vars.

If you want, I can generate:
- A `vercel.json` (optional) with rewrites to proxy relative `/api/bitget` to the backend URL.
- A `Procfile` or Dockerfile for Render (if you prefer Docker).

Tell me which of the following you want next:
- Generate `api/bitget/[...].js` serverless function for Vercel (to keep frontend+api together)
- Generate a `vercel.json` with rewrite rules pointing `/api/*` to the Render backend
- Generate a `Procfile` and `start` script in `package.json` for Render
