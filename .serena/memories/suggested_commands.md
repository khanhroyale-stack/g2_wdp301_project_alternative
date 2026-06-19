# Suggested Commands
- Backend dev server: `cd backend && npm run dev` (runs on http://localhost:5000)
- Frontend dev server: `cd frontend && npm run dev` (runs on http://localhost:5173, Vite proxies `/api` to 5000).
- Windows DNS fix: `server.js` contains a DNS fix (`dns.setServers(["8.8.8.8", "8.8.4.4"]);`). **Do not remove these lines**.