# 🚀 Deployment Guide for Les Mots Croisés

This guide will help you deploy your crossword game using:
- **Neon** for PostgreSQL database
- **Render** for backend hosting
- **Vercel** for frontend hosting

## Prerequisites

1. GitHub account with your code pushed to a repository
2. Neon account (https://neon.tech)
3. Render account (https://render.com)
4. Vercel account (https://vercel.com)

## Step 1: Setup Neon Database

1. **Create Neon Account & Project**
   - Go to https://neon.tech
   - Sign up/Login and create a new project
   - Choose a region close to your users
   - Note down the connection string

2. **Configure Database**
   - Copy the connection string (starts with `postgresql://`)
   - It should look like: `postgresql://username:password@host.neon.tech/dbname?sslmode=require`

## Step 2: Deploy Backend to Render

1. **Connect GitHub Repository**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` folder as root directory

2. **Configure Service**
   - **Name**: `les-mots-croises-backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (for testing) or Starter

3. **Set Environment Variables**
   ```
   DATABASE_URL=your-neon-connection-string
   JWT_SECRET=your-super-secure-jwt-secret-here
   ADMIN_CODE=your-admin-secret-code
   NODE_ENV=production
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (usually 2-5 minutes)
   - Note down your Render URL (e.g., `https://your-app.onrender.com`)

## Step 3: Deploy Frontend to Vercel

1. **Connect GitHub Repository**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Select the `frontend` folder as root directory

2. **Configure Project**
   - **Project Name**: `les-mots-croises`
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`

3. **Set Environment Variables**
   ```
   VITE_API_URL=https://your-render-backend.onrender.com/api
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment (usually 1-3 minutes)
   - Note down your Vercel URL

## Step 4: Update CORS Settings

1. **Update Backend CORS**
   - Go back to your Render service
   - Update the `CORS_ORIGINS` environment variable
   - Set it to your Vercel frontend URL: `https://your-frontend.vercel.app`
   - Redeploy the service

## Step 5: Database Migration

1. **Run Database Migration**
   - Your database should auto-migrate on first deployment
   - If needed, you can run migrations manually in Render console:
   ```bash
   npm run db:push
   npm run db:seed
   ```

## Step 6: Testing

1. **Test Your Deployed App**
   - Visit your Vercel URL
   - Create some test puzzles via admin panel
   - Test crossword functionality
   - Check that data persists in Neon database

## Environment Variables Summary

### Backend (Render):
```
DATABASE_URL=postgresql://username:password@host.neon.tech/dbname?sslmode=require
JWT_SECRET=your-super-secure-jwt-secret
ADMIN_CODE=your-admin-code
NODE_ENV=production
CORS_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (Vercel):
```
VITE_API_URL=https://your-backend.onrender.com/api
```

## Troubleshooting

1. **CORS Issues**: Make sure CORS_ORIGINS matches your Vercel URL exactly
2. **Database Connection**: Verify your Neon connection string includes `?sslmode=require`
3. **Build Failures**: Check logs in Render/Vercel dashboard for specific errors
4. **API Not Found**: Ensure VITE_API_URL points to correct Render URL with `/api` suffix

## Post-Deployment

- Set up custom domain (optional)
- Configure monitoring and alerts
- Set up backup strategies
- Enable auto-deploys from main branch

## Cost Estimate

- **Neon**: Free tier (512MB storage, 1 compute hour/month)
- **Render**: Free tier (750 hours/month, sleeps after 15min inactivity)
- **Vercel**: Free tier (100GB bandwidth, unlimited static sites)

**Total**: FREE for small scale usage! 🎉
