
# 🚀 LumiX Deployment Guide

This guide details how to deploy the **LumiX** School Management System to cloud servers.

## 🏗️ Architecture Overview

The application is split into two parts:
1.  **Frontend (React/Vite)**: Deployed to a CDN/Static Host (e.g., Vercel, Netlify).
2.  **Backend (FastAPI/Python)**: Deployed to a containerized service (e.g., Render, Railway, Heroku).
3.  **Database (PostgreSQL)**: Managed database service (e.g., Supabase, Neon, Render PostgreSQL).

---

## 1️⃣ Backend Deployment (Render.com recommended)

**Prerequisites:**
-   GitHub repository containing your code.

**Steps:**
1.  **Create a PostgreSQL Database:**
    -   Go to [Render Dashboard](https://dashboard.render.com/) -> New -> PostgreSQL.
    -   Name: `lumix-db`.
    -   Copy the `Internal DB URL` (for internal use) and `External DB URL` (for local connection).

2.  **Deploy Web Service:**
    -   Go to New -> Web Service.
    -   Connect your GitHub repo.
    -   **Runtime:** Python 3.
    -   **Build Command:** `pip install -r requirements.txt`
    -   **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port 10000`
    -   **Environment Variables:**
        -   `DATABASE_URL`: (Paste your Internal DB URL from step 1)
        -   `SECRET_KEY`: (Generate a long random string)
        -   `API_KEY`: (Your Gemini AI API Key)
        -   `ENVIRONMENT`: `production`
        -   `CORS_ORIGINS`: `https://your-frontend-url.vercel.app` (You will update this after frontend deployment)

---

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
    -   `VITE_API_URL`: (The URL of your deployed Backend, e.g., `https://lumix-backend.onrender.com`)
6.  **Deploy**.

---

## 3️⃣ Final Configuration

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
