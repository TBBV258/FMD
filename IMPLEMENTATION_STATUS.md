# FMD Mozambique Features - Implementation Status

## ✅ COMPLETED FEATURES

### 1. Quick Fixes (100%)
- ✅ Added logout button to profile menu
- ✅ Fixed login page copyright to 2025
- ✅ Dark mode toggle visible and working in TopBar

### 2. Mozambican Document Types (100%)
- ✅ Updated `DocumentType` enum with 10 Mozambican document types:
  - Bilhete de Identidade (BI)
  - Passaporte
  - Carta de Condução
  - DIRE
  - NUIT
  - Cartão de Trabalho
  - Cartão de Estudante
  - Cartão de Eleitor
  - Certidão de Nascimento
  - Título de Propriedade
- ✅ Updated ReportLostView.vue with new types
- ✅ Updated ReportFoundView.vue with new types

### 3. Internationalization (100%)
- ✅ Installed vue-i18n@9
- ✅ Created i18n configuration (`frontend/src/i18n/index.ts`)
- ✅ Created translation files for 5 languages:
  - 🇲🇿 Portuguese (pt.json) - Default
  - 🇬🇧 English (en.json)
  - 🇫🇷 French (fr.json)
  - 🇲🇿 Xitsonga (ts.json)
  - 🇲🇿 Ronga (ro.json)
- ✅ Created LanguageSelector component with dropdown
- ✅ Integrated LanguageSelector in TopBar
- ✅ Configured i18n in main.ts

### 4. Search Composable (100%)
- ✅ Created `useDocumentSearch.ts` composable with:
  - Debounced search functionality
  - Text search (title, description, location, document number)
  - Type filtering
  - Status filtering
  - Date range filtering
  - Clear filters function
  - Active filters indicator

## 🚧 REMAINING TASKS

### 5. Search/Filter UI Integration (0%)
**File:** `frontend/src/views/FeedView.vue`
- [ ] Add search input below current filters
- [ ] Add filter button that opens bottom sheet modal
- [ ] Create bottom sheet with:
  - Document type multi-select checkboxes
  - Date range picker
  - Status toggle (lost/found/all)
- [ ] Integrate useDocumentSearch composable
- [ ] Display active filter count badge on filter button

### 6. Profile Enhancements (0%)

#### 6.1 Points & Ranking System
**Files:** `types/index.ts`, `stores/auth.ts`, `ProfileView.vue`
- [ ] Add `points` and `rank` fields to User type
- [ ] Add `updatePoints()` method to auth store
- [ ] Add `calculateRank()` method (Bronze <100, Silver <500, Gold <1000, Platinum >=1000)
- [ ] Display ranking badge with icon in profile
- [ ] Show points count in stats section
- [ ] Create "Como ganhar pontos?" info modal

#### 6.2 Profile Photo Upload
**Files:** `ProfileView.vue`, `composables/useCamera.ts`
- [ ] Add camera icon overlay on avatar
- [ ] Create useCamera composable for camera access
- [ ] Click to open file picker or camera
- [ ] Upload to Supabase Storage `profiles/` bucket
- [ ] Update user profile with photo URL

#### 6.3 Subscription Plans
**Files:** `ProfileView.vue`, `types/index.ts`
- [ ] Add subscription_plan field to User type
- [ ] Show current plan badge in profile (Free/Premium)
- [ ] Create "Planos" modal with:
  - Free: 10 uploads/month, ads, standard support
  - Premium: Unlimited uploads, no ads, priority, backup (5000 MT/month)

#### 6.4 Cloud Backup Settings
**Files:** Create `SettingsView.vue`, `utils/cloudBackup.ts`
- [ ] Create SettingsView component
- [ ] Add auto-backup toggle (Premium only)
- [ ] Add backup frequency selector
- [ ] Show last backup timestamp
- [ ] Add manual backup button
- [ ] Implement cloud backup utility

#### 6.5 Privacy Settings
**File:** `SettingsView.vue`
- [ ] Add "Privacidade" section
- [ ] Toggle: Show exact location (default: approximate only)
- [ ] When off, show only city/district instead of coordinates

#### 6.6 Location Suggestions Settings
**File:** `SettingsView.vue`
- [ ] Add "Sugestões" section
- [ ] Toggle: Suggest nearby lost documents
- [ ] Radius slider (1-50km)

### 7. Notifications with Chat Tabs (0%)
**File:** `frontend/src/views/NotificationsView.vue`
- [ ] Add tab navigation: "Todas" | "Chats"
- [ ] Filter notifications by type
- [ ] Group chat notifications by document/conversation
- [ ] Add unread chat count badge on BottomNavigation

### 8. Device Permissions (0%)

#### 8.1 Camera Access
**Files:** Create `composables/useCamera.ts`
- [ ] Request camera permission via `navigator.mediaDevices.getUserMedia()`
- [ ] Fallback to file input if denied
- [ ] Show permission prompt modal on first use
- [ ] Integrate in ReportLostView, ReportFoundView, ProfileView

#### 8.2 Location Access
**Files:** `composables/useGeolocation.ts` (enhance existing)
- [ ] Add permission status check
- [ ] Show permission prompt modal
- [ ] Auto-fill location in report forms
- [ ] Center map on user location

#### 8.3 Permission Modal Component
**File:** Create `components/common/PermissionModal.vue`
- [ ] Explain why permission is needed
- [ ] Show browser-specific instructions
- [ ] Handle permission denied gracefully

### 9. Backend Updates (0%)

#### 9.1 Document Matching Notifications
**File:** `server/routes/documentsRoutes.js`
- [ ] Create matching algorithm (type + location + document_number)
- [ ] When document status changes to "matched/returned", award 50 points
- [ ] Send notification to both users (loser and finder)
- [ ] Create notification record in database

#### 9.2 Supabase Schema Updates
- [ ] Add to `profiles` table:
  - `points` (integer, default: 0)
  - `rank` (text, default: 'bronze')
  - `subscription_plan` (text, default: 'free')
  - `subscription_expires_at` (timestamp, nullable)
  - `privacy_settings` (jsonb, default: {})
  - `backup_settings` (jsonb, default: {})
- [ ] Update `documents` table:
  - Update `type` enum with new Mozambican types

### 10. GitHub Pages Deployment (0%)
**File:** `frontend/vite.config.ts`
- [ ] Add `base` property for GitHub Pages path
- [ ] Add gh-pages package: `npm install gh-pages --save-dev`
- [ ] Add deploy script to package.json: `"deploy": "gh-pages -d dist"`

## PRIORITY IMPLEMENTATION ORDER

1. **HIGH PRIORITY** (User-facing, high impact):
   - Search/Filter UI in Feed
   - Notifications with Chat tabs
   - Document matching notifications (backend)
   - Camera & Location permissions

2. **MEDIUM PRIORITY** (Enhances UX):
   - Points & Ranking system
   - Profile photo upload
   - Subscription plans display

3. **LOW PRIORITY** (Nice to have):
   - Cloud backup
   - Privacy & Location settings
   - GitHub Pages deployment setup

## TESTING CHECKLIST

After completing remaining tasks, test:
- [x] Logout from profile works
- [x] Dark mode persists across sessions
- [x] Login page shows 2025
- [x] All 10 document types in forms
- [x] Language selector switches UI (basic setup done, full translation pending)
- [ ] Search and filter work in feed
- [ ] Points awarded on successful match
- [ ] Profile photo upload works
- [ ] Subscription plans modal displays
- [ ] Cloud backup creates file
- [ ] Privacy settings hide exact location
- [ ] Notification tabs work
- [ ] Camera permission prompt appears
- [ ] Location permission prompt appears
- [ ] Document matching notifies users

## ESTIMATED TIME REMAINING

- Search/Filter UI: 2 hours
- Profile enhancements: 4 hours
- Notifications tabs: 1 hour
- Device permissions: 2 hours
- Backend matching + DB updates: 3 hours
- Testing: 2 hours

**Total: ~14 hours remaining**

## NOTES

- Vue-i18n translations are ready but views need to use `$t()` or `useI18n()`
- Backend security features from previous plan are already implemented
- PWA and mobile-first design already working
- Core infrastructure is solid and ready for new features

