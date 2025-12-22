<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1tRJr4FdlKfjsjyoJy1Nx7884etdiHkjL

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Vercel

This project is configured for seamless deployment on Vercel with a Python backend.

1. **Push to GitHub/GitLab/Bitbucket**
   - Commit your changes and push the repository.

2. **Import into Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard) -> Add New -> Project.
   - Select your repository.

3. **Configure Environment Variables**
   Add the following variables in the Vercel Project Settings:
   - `GEMINI_API_KEY`: Your Gemini API Key.
   - `VITE_API_URL`: Set this to `/api` (This ensures the frontend talks to the serverless backend).
   - `CORS_ORIGINS`: `https://your-project-name.vercel.app` (Add your production URL).
   - `ENVIRONMENT`: `production`

4. **Deploy**
   - Click **Deploy**. Vercel will automatically build the React frontend and configure the Python serverless functions.

### Notes
- The database defaults to an ephemeral SQLite instance on Vercel. For persistent data in production, configure `DATABASE_URL` with a PostgreSQL connection string (e.g., Vercel Postgres).
