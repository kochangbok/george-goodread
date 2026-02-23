# Portfolio Dashboard (React + Vite)

Institutional-style crypto basket analytics dashboard built with React + Tailwind + Recharts.

## Vercel Deployment

### One-time setup (CLI)

```bash
cd /Users/george/Dev/codex/portfolio-dashboard
npm install
npm run build
npm i -g vercel
vercel login
vercel
```

### Deploy to production

```bash
cd /Users/george/Dev/codex/portfolio-dashboard
vercel --prod
```

### Notes

- This project is a static Vite build and does not require a custom server.
- If you want to force clean deploys each time, run:
  - `vercel --prod --force`
- API calls are made directly from the browser to Binance Futures API (`/fapi/v1/...`), so CORS must allow access in the deployment environment.
