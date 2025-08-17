# 🚀 GitHub Pages Deployment Guide

## Prerequisites
- Your repository is named `FMD`
- You have GitHub Pages enabled in your repository settings

## 🛠️ Setup Steps

### 1. Enable GitHub Pages
1. Go to your repository settings
2. Navigate to "Pages" in the left sidebar
3. Set source to "GitHub Actions"
4. Save the changes

### 2. Build and Deploy
The app will automatically deploy when you push to the `main` branch.

**Manual deployment:**
```bash
# Build for GitHub Pages
npm run build:gh-pages

# The dist folder will contain your built app
```

### 3. Access Your App
Your app will be available at: `https://[your-username].github.io/FMD/`

## 📱 PWA Features
- ✅ Service Worker (for offline functionality)
- ✅ Web App Manifest
- ✅ Installable on mobile devices
- ✅ Responsive design

## ⚠️ Important Notes

### Backend Limitations
Since this is a static deployment:
- ❌ Supabase authentication won't work without proper CORS configuration
- ❌ Database operations will fail
- ❌ File uploads won't work
- ❌ API calls to your Express server won't work

### To Make Backend Work
1. Configure Supabase CORS origins to include your GitHub Pages domain
2. Set up environment variables for production
3. Deploy your Express server separately (Vercel, Netlify, etc.)

## 🔧 Troubleshooting

### 404 Errors
- Ensure all asset paths use `/FMD/` prefix
- Check that the build completed successfully
- Verify GitHub Pages is enabled

### Build Issues
- Run `npm run build:gh-pages` locally to test
- Check the GitHub Actions logs for errors

## 📋 Next Steps
1. Push your code to trigger the first deployment
2. Test the app on GitHub Pages
3. Configure Supabase for production use
4. Deploy your backend server
5. Test full functionality

## 🎯 PWA to APK
Once deployed, you can use:
- **PWA Builder** (Microsoft)
- **Bubblewrap** (Google)
- **Appetize.io**

To generate an APK from your public URL.
