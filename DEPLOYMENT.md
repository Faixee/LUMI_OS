
# 🚀 LumiX Deployment Guide

This guide details how to deploy the **LumiX** School Management System to cloud servers.

## 🏗️ Architecture Overview

The application is split into two parts:
1.  **Frontend (React/Vite)**: Deployed to a CDN/Static Host (e.g., Vercel, Netlify).
2.  **Backend (FastAPI/Python)**: Deployed to a containerized service (e.g., Render, Railway, Heroku).
3.  **Database (PostgreSQL)**: Managed database service (e.g., Supabase, Neon, Render PostgreSQL).

---

## 1️⃣ Backend Deployment (AWS EC2 - Recommended for Performance)

**Prerequisites:**
- AWS Account and CLI configured locally.
- A GitHub repository containing your code.

**Steps:**
1.  **Provision EC2 Instance:**
    - Run the provided setup script: `bash scripts/setup-ec2.sh <region> <instance-type> <key-name>`
    - This will create a security group and launch an Ubuntu instance.
    - Note the **Public IP** returned by the script.

2.  **Initialize the Server:**
    - SSH into your instance: `ssh -i <your-key>.pem ubuntu@<EC2_PUBLIC_IP>`
    - Run the initialization script: `curl -s https://raw.githubusercontent.com/Faixee/LUMI_OS/main/scripts/init-ec2.sh | bash`
    - This installs Docker and Docker Compose.

3.  **Deploy the Backend:**
    - Copy `.env.example` to `.env` on the server and fill in your secrets.
    - Run the deployment script: `bash scripts/deploy.sh`
    - Your backend will be available at `http://<EC2_PUBLIC_IP>:8000`.

---

## 2️⃣ Backend Deployment (Render.com - Alternative)

## 2️⃣ Frontend Deployment (Vercel recommended)

**Steps:**
1.  **Install Vercel CLI** (optional) or use the Dashboard.
2.  **Go to Vercel Dashboard -> Add New Project**.
3.  Import your GitHub repo.
4.  **Build Settings:**
    -   Framework Preset: Vite
    -   Build Command: `npm run build`
    -   Output Directory: `dist`
5.  **Environment Variables:**
    -   `VITE_API_URL`: Set this to `/api` (This uses the built-in Vercel proxy to avoid "Mixed Content" HTTPS errors).
    -   **Important**: Update your `vercel.json` with your EC2 IP to enable the proxy.
6.  **Deploy**.

---

## 3️⃣ Troubleshooting: Mixed Content (HTTPS/HTTP)

If you see a "Mixed Content" or "Failed to Fetch" error in production:
1.  **Vercel Proxy (Recommended)**: 
    - In `vercel.json`, ensure the `rewrites` section points to your EC2 IP.
    - Set `VITE_API_URL=/api` in Vercel Dashboard.
2.  **SSL for Backend**:
    - Use Let's Encrypt and Nginx on your EC2 instance to serve the backend over `https://`.
    - Set `VITE_API_URL=https://your-backend-domain.com`.

1.  **Update CORS:**
    -   Go back to your Backend settings.
    -   Update `CORS_ORIGINS` to match your *actual* Vercel URL (e.g., `https://lumix-os.vercel.app`).
    -   Redeploy the backend.

2.  **Create Admin User:**
    -   You cannot register an admin via the UI initially without an invite code.
    -   **Option A (Database Direct):** Use a tool like DBeaver or pgAdmin to connect to your DB and manually change a user's role to `admin`.
    -   **Option B (API):** Set an `ADMIN_INVITE_CODE` env var in backend, then register using that code via Postman/Curl.

---

## 🔐 Access Control & Security

-   **Demo Users:** Access is read-only. The system automatically loads mock data if the backend is unreachable or if the user role is `demo`.
-   **Admins:** Have full access. The "Role Switcher" (God Mode) is only visible to users with the `admin` role.
-   **Payments:** Subscription status is enforced by the backend. Unpaid users are blocked from AI and Write endpoints.

---

## 📝 Procfile (For Heroku/Railway)

If you use Heroku or Railway instead of Render, use the included `Procfile`:

```
web: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```
