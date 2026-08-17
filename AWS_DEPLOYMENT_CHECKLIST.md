# CampusCore / EduNexus - AWS Deployment Checklist

Use this checklist to systematically verify every requirement before and during AWS production deployment.

---

## 1. Pre-Deployment Configuration & Security Verification

- [x] **MongoDB Atlas Configured**: Managed database cluster created with dedicated DB user and network access whitelisting.
- [x] **Production Environment Variables**: `PORT`, `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_URL` configured in `server/.env`.
- [x] **JWT Secret Configured**: High-entropy JWT secret string set in environment variable (not hardcoded).
- [x] **CORS Origin Whitelisting**: Express CORS and Socket.IO CORS configured to allow `CLIENT_URL` and explicit domain patterns without `origin: '*'`.
- [x] **Frontend Production API URL**: Centralized API client configured to read `import.meta.env.VITE_API_URL` without `http://localhost:5000` hardcodes.
- [x] **No Secrets Committed**: `.env` and `server/.env` excluded from version control via `.gitignore`. `server/.env.example` created.
- [x] **No DB Wipe Scripts in Auto-Deploy**: Database cleanup/seed scripts isolated from automated startup scripts.

---

## 2. Local & Build Verification

- [x] **Frontend Build Verification**: `npm run build` executed successfully in `client/` producing optimized bundles in `client/dist`.
- [x] **Backend Production Mode Test**: `NODE_ENV=production npm start` executed locally without runtime or module import errors.
- [x] **Health Endpoint Health Check**: `GET /api/health` returns `{"success": true, "status": "healthy", "database": "connected"}`.
- [x] **Socket.IO Real-Time Messaging**: WebSocket connections establish, rooms join, and notifications broadcast cleanly.
- [x] **File Upload Pathing**: File uploads and PDF document generation tested using cross-platform `path.join(process.cwd(), 'uploads')`.

---

## 3. AWS Infrastructure Readiness

- [ ] **EC2 Provisioned**: Ubuntu 24.04 LTS instance running Node.js 20 LTS.
- [ ] **AWS Security Group Configured**: Inbound ports `22` (SSH), `80` (HTTP), and `443` (HTTPS) open. Port `5000` kept closed to public traffic.
- [ ] **PM2 Process Supervisor Setup**: Process configured via `pm2 start server.js --name "edunexus-api"` and saved via `pm2 save`.
- [ ] **Nginx Reverse Proxy Configured**: `/etc/nginx/sites-available/edunexus-api` setup with proxy pass to `http://127.0.0.1:5000` and WebSocket `Upgrade` headers for `/socket.io/`.
- [ ] **HTTPS / Let's Encrypt Certbot SSL**: SSL certificate issued and auto-renewing for API domain (`api.yourdomain.com`).
- [ ] **S3 Static Website Hosting**: `client/dist` contents deployed to S3 bucket.
- [ ] **CloudFront Distribution Setup**: CloudFront CDN configured with SPA fallback custom error response (`404` -> `/index.html` `200`).

---

## 4. Post-Deployment Monitoring & Maintenance

- [ ] **PM2 Auto-Restart Verification**: Tested `pm2 restart edunexus-api` to ensure server auto-restarts on system reboot.
- [ ] **MongoDB Atlas Automated Backups**: Continuous backup schedule enabled in MongoDB Atlas console.
- [ ] **AWS CloudWatch & Cost Alerts**: AWS Budget alert set to notify if monthly expenditure exceeds threshold.
