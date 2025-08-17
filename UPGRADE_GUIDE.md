# FindMyDocs Upgrade Guide

## Overview

This guide helps you migrate from the legacy vanilla JavaScript version of FindMyDocs to the new React + TypeScript architecture. The refactor maintains 100% backward compatibility while modernizing the entire frontend.

## ⚠️ Pre-Migration Checklist

### Backup Requirements
- [ ] **Database backup**: Export all data from Supabase
- [ ] **Environment variables**: Save all current `.env` values
- [ ] **Custom configurations**: Document any custom settings
- [ ] **File uploads**: Ensure all document/avatar files are safely stored

### Prerequisites
- [ ] **Node.js 18+**: Upgrade if using older version
- [ ] **npm 8+**: Update package manager
- [ ] **Supabase project**: Verify access and credentials
- [ ] **Git repository**: Ensure code is committed

## 🔄 Migration Steps

### 1. Prepare New Environment

```bash
# Backup current project
cp -r findmydocs findmydocs-backup

# Pull new codebase
git checkout refactor-branch
# OR
git clone <new-repository> findmydocs-new
cd findmydocs-new
```

### 2. Install Dependencies

```bash
# Install all new dependencies
npm install

# Verify installation
npm run typecheck
npm run lint
```

### 3. Environment Configuration

```bash
# Copy your existing environment file
cp ../findmydocs-backup/.env .env

# Verify all required variables are present
cat .env
```

**Required Variables** (should remain unchanged):
```env
FMD_URL=https://your-project.supabase.co
FMD_ANON_KEY=your-anon-key
PORT=9000
NODE_ENV=development
```

### 4. Database Schema Verification

The new version uses the **exact same database schema**. No migration needed.

```bash
# Optional: Verify database connection
npm run test-db
```

### 5. Start Development Environment

```bash
# Terminal 1: Start backend (unchanged)
npm run serve

# Terminal 2: Start new frontend
npm run dev
```

### 6. Verify Core Functionality

Visit `http://localhost:3000` and test:

- [ ] **Login/Signup**: Same credentials work
- [ ] **Document listing**: All existing documents appear
- [ ] **File uploads**: Upload new documents
- [ ] **Lost/Found reporting**: Create reports
- [ ] **Chat system**: Send messages
- [ ] **Maps**: Location selection works
- [ ] **Language toggle**: PT/EN switching
- [ ] **Theme toggle**: Light/dark mode

## 🔍 What's Changed

### User-Facing Changes
- **✅ No breaking changes**: All features work identically
- **✨ Enhanced UI**: Modern design with smooth animations
- **📱 Better mobile**: Improved responsive design
- **♿ Accessibility**: WCAG AA compliant
- **⚡ Performance**: Faster loading and interactions

### Developer-Facing Changes
- **🔧 Tech Stack**: React + TypeScript instead of vanilla JS
- **🏗️ Architecture**: Modular feature-based structure
- **🧪 Testing**: Comprehensive test suite
- **📦 Build System**: Vite instead of basic file serving
- **🔒 Type Safety**: Full TypeScript coverage

### File Structure Changes

```
OLD                          NEW
=================           =================
index.html (545 lines)   →  src/main.tsx + modules
script.js (1601 lines)   →  Feature-based components  
style.css                →  TailwindCSS + design system
translations.js          →  src/i18n/ directory
supabaseClient.js        →  src/lib/services/
```

## 🐛 Troubleshooting

### Common Issues

**🔥 "Module not found" errors**
```bash
rm -rf node_modules package-lock.json
npm install
```

**🔥 "Supabase client not initialized"**
- Verify `.env` file exists and has correct values
- Check network connectivity
- Ensure Supabase project is active

**🔥 "Authentication not working"**
- Confirm Supabase URL and anon key are correct
- Check browser console for errors
- Verify redirect URLs in Supabase dashboard

**🔥 "Files not uploading"**
- Check Supabase storage bucket permissions
- Verify file size limits (5MB max)
- Ensure file types are supported

**🔥 "Maps not loading"**
- Check browser console for Leaflet errors
- Verify internet connection
- Clear browser cache

### Performance Issues

**🐌 Slow initial load**
```bash
# Build and test production version
npm run build
npm run preview
```

**🐌 Slow API responses**
- Check network tab in browser dev tools
- Verify database indexes are present
- Monitor Supabase dashboard for slow queries

### Database Issues

**🗃️ Missing data**
- Confirm you're connecting to correct Supabase project
- Check RLS policies are enabled
- Verify user has proper permissions

**🗃️ Upload errors**
- Check storage bucket exists in Supabase
- Verify storage policies allow uploads
- Ensure file size under 5MB

## 🔄 Rollback Plan

If issues arise, you can quickly rollback:

### Quick Rollback
```bash
# Stop new version
pm2 stop findmydocs-new

# Start old version
cd ../findmydocs-backup
npm start
```

### Domain Rollback
```bash
# Update DNS/proxy to point to old version
# OR
# Deploy old version to production
```

**Note**: No database changes were made, so rollback is safe.

## 🚀 Production Deployment

### Build for Production
```bash
# Create optimized build
npm run build

# Test production build locally
npm run preview
```

### Deployment Options

**Option 1: Vercel (Recommended)**
```bash
npm install -g vercel
vercel --prod
```

**Option 2: Static hosting**
```bash
npm run build
# Upload dist/ folder to your hosting provider
```

**Option 3: Self-hosted**
```bash
npm run build
npm run serve # Backend
# Serve dist/ folder with nginx/apache
```

### Environment Variables in Production
Ensure production environment has:
```env
FMD_URL=https://your-project.supabase.co
FMD_ANON_KEY=your-production-anon-key
NODE_ENV=production
```

## 📊 Monitoring & Validation

### Post-Deployment Checks
- [ ] **Health check**: `/api/health` returns 200
- [ ] **Authentication**: Login/signup works
- [ ] **Core features**: Document CRUD works
- [ ] **Real-time**: Chat messages send/receive
- [ ] **File uploads**: Images and PDFs upload
- [ ] **Mobile**: Test on actual devices
- [ ] **Performance**: Lighthouse score >85

### Error Monitoring
- **Browser Console**: Check for JavaScript errors
- **Network Tab**: Verify API calls succeed
- **Supabase Logs**: Monitor database activity
- **Server Logs**: Check backend for errors

### User Acceptance Testing
- [ ] **Existing users**: Can access their data
- [ ] **New users**: Can create accounts
- [ ] **Core workflows**: Lost/found reporting works
- [ ] **Premium features**: Upgrade flow works
- [ ] **Multi-language**: PT/EN switching works

## 🔧 Customization

### Branding Updates
```typescript
// Update colors in tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        500: '#YOUR_BRAND_COLOR',
        // ...
      }
    }
  }
}
```

### Feature Modifications
```typescript
// Add new features in src/features/
src/features/your-feature/
├── components/
├── hooks/
├── pages/
└── services/
```

### Translation Updates
```typescript
// Add new languages in src/i18n/
export const newLanguageTranslations = {
  nav: { home: 'Home' },
  // ...
};
```

## 🆘 Support

### Getting Help
1. **Check this guide**: Common issues covered above
2. **Review logs**: Browser console and server logs
3. **Test locally**: Reproduce issue in development
4. **Create issue**: GitHub issue with reproduction steps

### Emergency Contacts
- **Tech Lead**: [email]
- **DevOps**: [email]  
- **Product**: [email]

### Escalation Path
1. **Developer** → Check logs, test locally
2. **Tech Lead** → Review architecture, identify root cause
3. **DevOps** → Infrastructure issues, deployment problems
4. **Product** → User impact assessment, communication

---

## ✅ Migration Checklist

**Pre-Migration**
- [ ] Backup completed
- [ ] Prerequisites installed
- [ ] Environment variables documented

**Migration**
- [ ] New environment installed
- [ ] Dependencies installed successfully
- [ ] Environment configured
- [ ] Development servers running
- [ ] Core functionality verified

**Post-Migration**
- [ ] Production deployment successful
- [ ] Health checks passing
- [ ] User acceptance testing completed
- [ ] Monitoring configured
- [ ] Rollback plan documented

**Sign-off**
- [ ] Technical validation complete
- [ ] User acceptance testing passed
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Documentation updated

---

**Migration Date**: ________________  
**Completed By**: ________________  
**Approved By**: ________________
