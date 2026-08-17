# CampusCore / EduNexus - AWS Production Readiness Report

**Date**: August 17, 2026  
**Auditor**: Senior MERN / AWS Production Engineering  
**Application**: CampusCore / EduNexus School Management System  

---

## 1. Executive Summary & Architecture Overview

CampusCore (EduNexus) is a full-stack MERN application structured as a monorepo. It features role-based access control for four primary user groups: **School Admins**, **Teachers**, **Parents**, and **Students**.

```
CampusCore / EduNexus Monorepo Structure
├── package.json               # Monorepo concurrency & workspace scripts
├── server/                    # Express.js REST API & Socket.IO WebSockets backend
│   ├── config/                # MongoDB Mongoose database configuration
│   ├── controllers/           # Auth, Admin, Teacher, Student, Parent, Chat, Announcement controllers
│   ├── middleware/            # JWT Auth, Upload (Multer), and Error handlers
│   ├── models/                # 17 Mongoose models (User, Student, Teacher, Parent, Class, etc.)
│   ├── routes/                # Unified API router (`/api/...`)
│   ├── socket/                # Socket.IO real-time notification & chat handler
│   └── utils/                 # PDF generator, Nodemailer, AI solver integration
└── client/                    # Vite React 18 SPA frontend
    ├── src/
    │   ├── api/               # Axios client instance (`client.js`)
    │   ├── components/        # Dashboard layout & reusable UI components
    │   ├── pages/             # Login & Role-specific portals (Admin, Teacher, Student, Parent)
    │   └── store/             # Zustand stores (Auth, Chat, Notifications)
    └── index.html             # React mount root
```

---

## 2. Audit Findings & Critical Issues Identified

### Critical Security Risks
1. **Wildcard CORS in Socket.IO (`origin: '*'`)**:
   - `server/socket/socket.js` initialized Socket.IO with `origin: '*'`. This allows any arbitrary origin to initiate WebSocket connections to the production backend.
2. **Hardcoded `http://localhost:5000` in Frontend**:
   - `client/src/pages/parent/ParentDashboard.jsx` hardcoded `http://localhost:5000` for invoice receipt downloads.
   - `client/src/store/notificationStore.js` had fallback to `http://localhost:5000` for WebSocket connections.
3. **Environment Variable Naming Mismatches**:
   - `server/server.js` used `process.env.FRONTEND_URL` while standard AWS deployment specifications expect `CLIENT_URL`.
4. **Missing Production Error Formatting**:
   - Express error handler did not guarantee standard `{ success: false, message: "..." }` payload structure, and could leak error stacks if `NODE_ENV` was unset.

### Operational & Deployment Blockers
1. **Platform-Dependent Storage Paths**:
   - File upload middleware (`uploadMiddleware.js`) and PDF generator (`pdf.js`) used hardcoded relative string paths (`./uploads` and `./uploads/documents`). On Linux/Ubuntu EC2, this can cause permission errors or path resolution failures depending on cwd.
2. **Missing Health Check Endpoint**:
   - The backend lacked a `/api/health` route necessary for AWS Target Group health checks, uptime monitoring, and CI/CD smoke testing.
3. **Silenced Database Disconnections**:
   - `server/config/db.js` caught MongoDB connection errors and logged `"Server is running without MongoDB connection"` without surfacing health status to monitoring systems.
4. **Missing Database Indexes**:
   - Key lookup fields across MongoDB collections (`User.role`, `Student.class`, `Teacher.user`, `Attendance.student`, `Assignment.class`, `Result.student`) lacked compound indexes, which degrades database throughput under production load.
5. **Interactive `npx` Dev Script**:
   - Root `package.json` ran `npx concurrently` without the `-y` auto-confirm flag, causing non-interactive server startup to hang.

---

## 3. Required Fixes & Implementation Summary

| Component | Audit Finding | Required Fix Implemented |
| :--- | :--- | :--- |
| **CORS & Socket.IO** | Socket.IO allowed `*` origins | Restricted Socket.IO & Express CORS to `process.env.CLIENT_URL` |
| **Health Check** | No `/api/health` endpoint | Added `/api/health` returning DB connection status & environment |
| **Environment Vars** | Non-standard variable names | Standardized on `PORT`, `MONGO_URI`, `JWT_SECRET`, `NODE_ENV`, `CLIENT_URL` |
| **File Storage** | Raw `./uploads` path strings | Replaced with `path.join(process.cwd(), 'uploads')` |
| **Error Handling** | Raw error messages & stack leaks | Formatted response to `{ success, message }` & hidden stacks in prod |
| **Database Models** | Missing index definitions | Added indexes to foreign keys & query target fields |
| **Role Registration** | Only `/api/auth/register` existed | Added explicit `/api/auth/register-school`, `/register-teacher`, etc. |
| **Frontend API** | Hardcoded `localhost:5000` URLs | Centralized API client & dynamic socket connection URLs |

---

## 4. Recommended AWS Production Architecture

```
                                  +-----------------------+
                                  |   AWS CloudFront      |
                                  |   (Global CDN & SSL)  |
                                  +-----------+-----------+
                                              |
                                              v
                                  +-----------------------+
                                  |   AWS S3 Bucket       |
                                  |   (Vite React Build)  |
                                  +-----------------------+

Users ---> Domain (HTTPS) 
               |
               v
    +--------------------+
    |  Nginx Proxy (EC2) | <--- Port 80/443 (Certbot SSL)
    +---------+----------+
              |
              +---> Proxy /api and /socket.io to localhost:5000
              |
              v
    +--------------------+
    |   PM2 (Node.js)    | <--- Running server.js in production mode
    +---------+----------+
              |
              v
    +--------------------+
    |   MongoDB Atlas    | <--- Managed Database Cluster
    +--------------------+
```

### Key Architectural Specifications:
- **Frontend Hosting**: AWS S3 Bucket configured with static website hosting, fronted by AWS CloudFront distribution for edge caching and SSL (AWS Certificate Manager).
- **Backend Hosting**: AWS EC2 Instance (Ubuntu 24.04 LTS, `t3.small` or `t3.medium`) running Node.js managed by **PM2** process supervisor (`pm2 start server.js --name "edunexus-api"`).
- **Reverse Proxy**: **Nginx** running on EC2 handling Let's Encrypt TLS certificates, forwarding HTTP requests on port 80/443 to internal port 5000, and proxying WebSocket upgrades for `/socket.io/`.
- **Database**: **MongoDB Atlas** M10+ multi-AZ cluster (outside EC2), accessed via secure connection string (`MONGO_URI`).
