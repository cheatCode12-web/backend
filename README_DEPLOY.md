# Deployment notes — Render (backend) + Netlify (frontend)

Follow these steps to migrate the backend from cPanel to Render and host the frontend on Netlify.

1) Prepare a managed MySQL database
   - Provision a managed MySQL instance (DigitalOcean, AWS RDS, Aiven, PlanetScale, etc.).
   - Note the connection values: host, port, user, password, database name.

2) Backend (Render)
   - In your Render dashboard, create a new **Web Service** and point it to the `backend` folder in your repo.
   - Use the `backend/render.yaml` manifest if you prefer to use Render's spec.
   - Environment variables (set on Render):
     - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
     - `JWT_SECRET` (strong random secret)
     - `FRONTEND_URL` — set to your Netlify site URL (e.g. `https://your-site.netlify.app`)
     - `NODE_ENV=production`
   - Start command: `npm start`
   - After DB is reachable, run migrations/seeds once from Render shell or locally against the remote DB:

```bash
cd backend
npm ci
npm run db:migrate
npm run db:init    # only if you want sample data
```

Running migrations from Render on first deploy
   - To run migrations as part of your first Render deploy, set the following environment variables in the Render dashboard for the service (only for the first deploy):
      - `RUN_MIGRATIONS=true`
      - `RUN_DB_INIT=true` (optional, runs `npm run db:init` after migrations)
   - Deploy the service. The backend will run the migration script once and print output to logs.
   - After migrations succeed, set `RUN_MIGRATIONS=false` and `RUN_DB_INIT=false` (or remove them) to avoid rerunning on every restart.


3) Frontend (Netlify)
   - Connect your repository to Netlify.
   - Set the **Publish directory** to `public_html` (the inner folder containing `index.html`).
   - If you want the frontend to call the backend using relative `/api` paths, edit `public_html/_redirects` and replace `YOUR_BACKEND_DOMAIN` with your Render service domain; Netlify will proxy those requests to the backend.
   - If the frontend needs environment variables at build time (e.g., `VITE_API_URL`), set them in Netlify build environment and rebuild.

4) Socket.IO notes
   - Socket connections should point to the backend domain (e.g., `https://your-backend.onrender.com`).
   - Netlify's proxy in `_redirects` may not fully support WebSocket upgrades in all cases; prefer establishing sockets directly to the backend from the client using the full backend URL.

5) CORS
   - The backend reads `FRONTEND_URL` and allows it in CORS. Ensure that matches your Netlify production URL.

6) Verify
   - Deploy backend and frontend to staging URLs, then:
     - Confirm backend API health: `GET https://your-backend.onrender.com/backend`
     - Confirm frontend loads and can call APIs.
     - Test Socket.IO features in browser devtools.

If you want, I can:
- replace `YOUR_BACKEND_DOMAIN` and `FRONTEND_URL` placeholders with actual domains once you provide them,
- add a small helper script to build the frontend with a configurable `API_URL`,
- or generate a `render.yaml` tuned for a specific Render plan.
