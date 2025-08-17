# 🔧 Supabase CORS Configuration Guide for GitHub Pages

## 🎯 **What This Guide Covers**
- Setting up Supabase CORS for GitHub Pages
- Configuring authentication redirects
- Setting up production environment variables
- Testing the configuration

## 📋 **Prerequisites**
- ✅ Supabase project created
- ✅ GitHub Pages deployment ready
- ✅ Your GitHub username (for the URL)

## 🚀 **Step-by-Step Configuration**

### **Step 1: Get Your GitHub Pages URL**
Your app will be available at:
```
https://[your-username].github.io/FMD/
```

**Example:** If your username is `johndoe`, your URL will be:
```
https://johndoe.github.io/FMD/
```

### **Step 2: Access Supabase Dashboard**
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your FindMyDocs project

### **Step 3: Configure Authentication Settings**
1. In the left sidebar, click **"Authentication"**
2. Click **"Settings"** (gear icon)
3. Scroll down to **"URL Configuration"**

### **Step 4: Update Site URL**
Set **Site URL** to:
```
https://[your-username].github.io
```

### **Step 5: Add Redirect URLs**
In the **Redirect URLs** section, add these URLs (replace `[your-username]` with your actual GitHub username):

```
https://[your-username].github.io/FMD/
https://[your-username].github.io/FMD/auth/callback
https://[your-username].github.io/FMD/dashboard
https://[your-username].github.io/FMD/login
```

### **Step 6: Configure CORS Origins**
1. Still in Authentication → Settings
2. Find **"CORS (Cross-Origin Resource Sharing)"** section
3. Add your GitHub Pages domain:
```
https://[your-username].github.io
```

### **Step 7: Create Production Environment File**
Create a file called `.env.production` in your project root:

```bash
# Production Environment Variables for GitHub Pages
# Replace [YOUR_PROJECT_ID] and [YOUR_ANON_KEY] with your actual Supabase credentials

VITE_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]

# GitHub Pages base URL
VITE_BASE_URL=https://[your-username].github.io/FMD
```

**To find your credentials:**
1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy **Project URL** and **anon public** key
3. Replace the placeholders in `.env.production`

### **Step 8: Update Supabase Client (Already Done)**
✅ Your `src/lib/supabase.ts` has been updated to:
- Use environment variables properly
- Handle production URLs dynamically
- Use PKCE flow for better security

## 🔍 **Testing Your Configuration**

### **Test 1: Local Build**
```bash
npm run build:gh-pages
```

### **Test 2: Check Environment Variables**
The build should use your `.env.production` file.

### **Test 3: Deploy and Test**
1. Push your code to GitHub
2. Wait for GitHub Actions to deploy
3. Test authentication on your live site

## ⚠️ **Common Issues and Solutions**

### **Issue 1: CORS Errors in Browser Console**
**Solution:** Double-check your CORS origins in Supabase Dashboard

### **Issue 2: Authentication Redirects Not Working**
**Solution:** Verify redirect URLs are exactly correct (no trailing slashes)

### **Issue 3: Environment Variables Not Loading**
**Solution:** Ensure `.env.production` is in your project root

### **Issue 4: Supabase Client Not Initializing**
**Solution:** Check browser console for configuration errors

## 🎯 **Final Checklist**

- [ ] Supabase Site URL updated
- [ ] Redirect URLs added
- [ ] CORS origins configured
- [ ] `.env.production` file created
- [ ] Credentials verified
- [ ] Local build tested
- [ ] Code pushed to GitHub
- [ ] Live site authentication tested

## 🚀 **Next Steps After CORS Configuration**

1. **Test authentication** on your live GitHub Pages site
2. **Verify database operations** work
3. **Test file uploads** (if applicable)
4. **Deploy your Express backend** to Vercel/Netlify
5. **Update API endpoints** to use production URLs

## 📞 **Need Help?**

If you encounter issues:
1. Check browser console for error messages
2. Verify all URLs are exactly correct
3. Ensure environment variables are loaded
4. Check Supabase Dashboard settings

Your Supabase CORS configuration should now work with GitHub Pages! 🎉
