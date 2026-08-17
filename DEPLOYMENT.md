# CampusCore / EduNexus - Production AWS Deployment Guide

This guide details step-by-step instructions for deploying CampusCore (EduNexus) to AWS using an **AWS EC2** instance for the Node.js backend, **AWS S3 + CloudFront** for the React frontend, and **MongoDB Atlas** for managed database persistence.

---

## Architecture Overview

- **Frontend**: AWS S3 Bucket + AWS CloudFront CDN (Global Edge CDN + SSL)
- **Backend**: AWS EC2 Instance (Ubuntu 24.04 LTS) + PM2 Process Supervisor
- **Reverse Proxy**: Nginx (handling TLS/SSL Certbot, HTTP Port 80/443 -> 5000, and `/socket.io/` WebSockets)
- **Database**: MongoDB Atlas Cluster

---

## 1. Prerequisites & AWS Preparation

### AWS Security Group Rules (EC2 Instance)
In the AWS Management Console, create/configure an EC2 Security Group with the following inbound rules:

| Type | Protocol | Port Range | Source | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **SSH** | TCP | `22` | My IP / Admin IP | Remote SSH Access |
| **HTTP** | TCP | `80` | `0.0.0.0/0` | Web Traffic & SSL Verification |
| **HTTPS** | TCP | `443` | `0.0.0.0/0` | Secure Web Traffic |

> [!CAUTION]
> Do **NOT** open Port `5000` publicly in the AWS Security Group. Internal port 5000 is proxied securely by Nginx on `localhost:5000`.

---

## 2. MongoDB Atlas Configuration

1. Log in to [MongoDB Atlas Console](https://cloud.mongodb.com/).
2. Create a Database User (e.g. `edunexus_prod_user`) with read/write privileges on database `edunexus`.
3. Under **Network Access**, add the Elastic IP address of your AWS EC2 instance.
4. Copy the connection string:
   ```env
   MONGO_URI=mongodb+srv://edunexus_prod_user:<PASSWORD>@edunexus.ynwolq4.mongodb.net/edunexus?retryWrites=true&w=majority
   ```

---

## 3. AWS EC2 Backend Deployment Setup

### 3.1 Provision EC2 Instance & Environment Setup
SSH into your Ubuntu EC2 instance:
```bash
ssh -i "your-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```

Update system dependencies and install Node.js (v20 LTS), Git, Nginx, and PM2:
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx certbot python3-certbot-nginx
sudo npm install -g pm2
```

### 3.2 Clone Repository & Configure Environment
```bash
git clone https://github.com/YourOrg/CampusCore.git /var/www/edunexus
cd /var/www/edunexus/server
npm install --production
```

Create `/var/www/edunexus/server/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://edunexus_prod_user:YourSecurePassword@edunexus.ynwolq4.mongodb.net/edunexus?retryWrites=true&w=majority
JWT_SECRET=c8d9e1f2a3b4c5d6e7f8a9b0c1d2e3f4g5h6i7j8k9l0
NODE_ENV=production
CLIENT_URL=https://edunexus.yourdomain.com
```

### 3.3 Start Backend with PM2 Supervisor
```bash
cd /var/www/edunexus/server
pm2 start server.js --name "edunexus-api"
pm2 save
pm2 startup
```
Verify status:
```bash
pm2 status
curl http://localhost:5000/api/health
```
Expected output:
```json
{"success":true,"status":"healthy","database":"connected","environment":"production"}
```

---

## 4. Nginx Reverse Proxy & SSL Configuration

### 4.1 Create Nginx Configuration
Create `/etc/nginx/sites-available/edunexus-api`:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Maximum file upload size (matches Multer 10MB limit)
    client_max_body_size 10M;

    # REST API endpoints
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Real-Time WebSockets (Socket.IO) proxy with Upgrade headers
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Enable site & restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/edunexus-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4.2 Provision SSL Certificate with Let's Encrypt
```bash
sudo certbot --nginx -d api.yourdomain.com
```

---

## 5. AWS S3 + CloudFront Frontend Deployment

### 5.1 Build Frontend Artifact Locally or in CI/CD
In local `client/` directory:
Create `client/.env.production`:
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_SOCKET_URL=https://api.yourdomain.com
```
Execute production build:
```bash
npm run build
```
This generates optimized static files in `client/dist/`.

### 5.2 Upload to S3 Bucket
1. Create AWS S3 Bucket (e.g. `edunexus-frontend-prod`).
2. Upload contents of `client/dist/` to the S3 bucket root.

### 5.3 Configure CloudFront Distribution
1. Create a CloudFront Distribution pointing origin to `edunexus-frontend-prod.s3.amazonaws.com`.
2. Set **Custom Error Response** for SPA client-side routing fallback:
   - **HTTP Error Code**: `404`
   - **Customize Error Response**: Yes
   - **Response Page Path**: `/index.html`
   - **HTTP Response Code**: `200`
3. Associate SSL Certificate via AWS Certificate Manager (ACM).
