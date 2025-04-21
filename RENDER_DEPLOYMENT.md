# Mazeej Deployment Guide for Render

This guide explains how to deploy the Mazeej application on Render.com.

## Prerequisites

- A Render.com account
- A Supabase PostgreSQL database (already configured)

## Deployment Steps

### Backend Deployment

1. Log in to your Render dashboard
2. Click "New" and select "Blueprint" 
3. Connect your GitHub repository
4. Render will detect the `render.yaml` file and suggest services to deploy
5. Configure the environment variables:
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string
   - `NODE_ENV`: production
   - `PORT`: 10000 (or any port Render assigns)
6. Deploy the service

### Frontend Deployment (Alternative Method)

If you prefer to deploy the frontend separately:

1. Log in to your Render dashboard
2. Click "New" and select "Static Site"
3. Connect your GitHub repository
4. Set the build command to: `npm install && npm run build`
5. Set the publish directory to: `dist/public`
6. Add the environment variable:
   - `NODE_ENV`: production
7. Deploy the site

### Important Configuration Notes

1. **API Endpoint**: Update any hardcoded API URLs in your frontend code to point to your Render backend URL
2. **CORS**: Ensure your backend allows requests from your frontend domain
3. **File Uploads**: The backend service has a 1GB disk mounted at `/opt/render/project/src/uploads` for file storage
4. **Database**: Your application is configured to use Supabase PostgreSQL

## Monitoring and Logs

After deployment:
1. Monitor the build and deployment logs in the Render dashboard
2. Check application logs for any runtime errors
3. Set up health checks to ensure your application stays running

## Troubleshooting

Common issues:
- Build failures: Check your `package.json` scripts and dependencies
- Runtime errors: Check application logs in the Render dashboard
- Database connection issues: Verify your `DATABASE_URL` environment variable
