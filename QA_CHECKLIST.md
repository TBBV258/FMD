# FindMyDocs - Manual QA Checklist

## 🔐 Authentication & Account Management

### Login Flow
- [ ] **Email/Password Login**
  - [ ] Valid credentials allow successful login
  - [ ] Invalid email shows appropriate error message
  - [ ] Invalid password shows appropriate error message
  - [ ] Empty fields show validation errors
  - [ ] Remember me functionality works
  - [ ] Password visibility toggle works
  - [ ] Login form is accessible via keyboard navigation

- [ ] **Google OAuth Login**
  - [ ] Google login button redirects to Google OAuth
  - [ ] Successful Google auth redirects back to app
  - [ ] Google auth creates user profile automatically
  - [ ] Google auth handles existing accounts correctly
  - [ ] OAuth errors are handled gracefully

- [ ] **Account Creation**
  - [ ] Email/password signup creates new account
  - [ ] All required fields (first name, last name, email, password) are validated
  - [ ] Password minimum length (6 chars) is enforced
  - [ ] Duplicate email registration shows appropriate error
  - [ ] Email confirmation process works (if enabled)
  - [ ] New user gets default free plan entitlements

### Session Management
- [ ] **Session Persistence**
  - [ ] User stays logged in across browser sessions
  - [ ] Token refresh happens automatically
  - [ ] Expired sessions redirect to login
  - [ ] Multiple tabs maintain same session state
  - [ ] Session persists after browser restart

- [ ] **Logout Flow**
  - [ ] Logout button clears session completely
  - [ ] After logout, protected routes redirect to login
  - [ ] Logout works from all pages
  - [ ] Multiple tabs logout simultaneously

## 📄 Document Management

### Adding Documents
- [ ] **Free Plan Limits**
  - [ ] Free users can add 1 document (BI only)
  - [ ] Adding second document shows upgrade modal
  - [ ] Non-BI document types show upgrade modal for free users
  - [ ] Upgrade modal contains correct plan comparison

- [ ] **Premium Plan Access**
  - [ ] Premium users can add unlimited documents
  - [ ] Premium users can add all document types
  - [ ] Document type dropdown shows all options for premium

- [ ] **Document Creation**
  - [ ] All required fields (type, name) are validated
  - [ ] Document number field accepts optional input
  - [ ] Description field accepts optional text
  - [ ] File upload supports images (JPG, PNG, WebP) and PDFs
  - [ ] File size limit (5MB) is enforced
  - [ ] Multiple files can be uploaded
  - [ ] File upload progress is shown
  - [ ] Upload errors are handled gracefully

### Document Display & Management
- [ ] **Document List**
  - [ ] User's documents display in creation order (newest first)
  - [ ] Document cards show type, name, status, and date
  - [ ] Document type icons display correctly
  - [ ] Status badges (normal, lost, found) have correct colors
  - [ ] Empty state shows when no documents exist

- [ ] **Document Actions**
  - [ ] View button opens document details
  - [ ] Edit button allows modifying document info
  - [ ] Mark as Lost button changes status and adds to lost feed
  - [ ] Delete button removes document after confirmation
  - [ ] Document actions only show for document owner

- [ ] **Document Status Management**
  - [ ] Normal documents can be marked as lost
  - [ ] Lost documents appear in public lost feed
  - [ ] Status changes update immediately in UI
  - [ ] Lost document notification system works

## 📍 Lost & Found Reporting

### Lost Document Reports
- [ ] **Report Creation**
  - [ ] All required fields are validated
  - [ ] Document type selection works
  - [ ] Location input accepts text and coordinates
  - [ ] Map integration allows selecting location
  - [ ] Contact information is properly formatted
  - [ ] Phone number validation by country code
  - [ ] Description field accepts detailed text
  - [ ] File upload works for evidence photos

- [ ] **Location Services**
  - [ ] Map displays correctly
  - [ ] Click to select location works
  - [ ] Location search functionality works
  - [ ] Current location detection works (with permission)
  - [ ] Selected coordinates are saved correctly
  - [ ] Address geocoding works when available

### Found Document Reports
- [ ] **Report Creation**
  - [ ] Similar validation to lost reports
  - [ ] Finder contact information is collected
  - [ ] Location where found is recorded
  - [ ] Photos of found documents can be uploaded
  - [ ] Privacy warning about sensitive information

- [ ] **Matching System**
  - [ ] Found documents trigger notifications to potential owners
  - [ ] Matching considers document type and location proximity
  - [ ] Match notifications contain relevant details
  - [ ] Users can dismiss or act on match notifications

### Feed Display
- [ ] **Lost Documents Feed**
  - [ ] Lost documents display in chronological order
  - [ ] Filter by document type works
  - [ ] Search functionality works across name/description/location
  - [ ] Contact button available for non-owners
  - [ ] Location button shows map when coordinates available

- [ ] **Found Documents Feed**
  - [ ] Found documents display correctly
  - [ ] Same filtering and search capabilities
  - [ ] "This is mine" button for potential owners
  - [ ] Privacy protection for sensitive information

## 💬 Real-time Chat

### Chat Initiation
- [ ] **Starting Conversations**
  - [ ] Contact button opens chat with document owner/finder
  - [ ] Chat modal displays correctly
  - [ ] Previous messages load when reopening chat
  - [ ] Chat works between owner and finder only

### Messaging
- [ ] **Message Exchange**
  - [ ] Messages send successfully
  - [ ] Messages appear in real-time for both users
  - [ ] Message timestamps are accurate
  - [ ] Long messages wrap properly
  - [ ] Message history persists across sessions
  - [ ] Typing indicators work (if implemented)

- [ ] **Message Display**
  - [ ] Own messages align right with different styling
  - [ ] Other user messages align left
  - [ ] Sender names/avatars display correctly
  - [ ] Chat scrolls to newest messages
  - [ ] Message status indicators work

### Chat Management
- [ ] **Multiple Chats**
  - [ ] Users can have multiple active chats
  - [ ] Chat list shows all conversations
  - [ ] Unread message indicators work
  - [ ] Chat notifications work across tabs

## 🗺️ Map Integration

### Map Display
- [ ] **Basic Functionality**
  - [ ] Map loads correctly in location modals
  - [ ] Default location (Maputo, Mozambique) displays
  - [ ] Map tiles load properly
  - [ ] Zoom controls work
  - [ ] Pan functionality works

### Location Selection
- [ ] **Interactive Features**
  - [ ] Click to select location works
  - [ ] Selected location shows marker
  - [ ] Coordinate display updates on selection
  - [ ] Location confirmation saves coordinates
  - [ ] Cancel button discards selection

### Location Display
- [ ] **Viewing Locations**
  - [ ] Location buttons open map showing document location
  - [ ] Markers display at correct coordinates
  - [ ] Map centers on document location
  - [ ] Multiple documents show different markers

## 👤 User Profile

### Profile Display
- [ ] **User Information**
  - [ ] Profile shows user name and email
  - [ ] Avatar displays correctly (default or uploaded)
  - [ ] Account status (Free/Premium) displays
  - [ ] Statistics show accurate counts (documents, points, helped)
  - [ ] Join date displays correctly

### Profile Management
- [ ] **Avatar Upload**
  - [ ] Camera button opens file selector
  - [ ] Image files can be uploaded
  - [ ] File size limits are enforced
  - [ ] Upload progress is shown
  - [ ] New avatar displays immediately
  - [ ] Avatar updates across the app

- [ ] **Profile Actions**
  - [ ] Backup button initiates data export
  - [ ] Notification settings can be accessed
  - [ ] Security settings are available
  - [ ] Upgrade button shows premium options

## 🎨 User Interface & Experience

### Theme Support
- [ ] **Light/Dark Mode**
  - [ ] Theme toggle switches between light and dark
  - [ ] Theme preference persists across sessions
  - [ ] All components support both themes
  - [ ] System theme detection works
  - [ ] Theme transitions are smooth

### Language Support
- [ ] **Portuguese/English Toggle**
  - [ ] Language toggle switches all text
  - [ ] Language preference persists
  - [ ] All UI elements translate correctly
  - [ ] Date/number formatting respects locale
  - [ ] Form validation messages translate

### Responsive Design
- [ ] **Mobile Devices**
  - [ ] App works on phone screens (375px+)
  - [ ] Touch targets are appropriately sized (44px+)
  - [ ] Bottom navigation works on mobile
  - [ ] Modals are mobile-friendly
  - [ ] Text is readable at mobile sizes
  - [ ] Landscape orientation works

- [ ] **Tablet Devices**
  - [ ] Layout adapts appropriately for tablets
  - [ ] Touch interactions work properly
  - [ ] Content utilizes available space effectively

- [ ] **Desktop Devices**
  - [ ] Top navigation displays on larger screens
  - [ ] Hover states work properly
  - [ ] Keyboard navigation functions correctly
  - [ ] Focus indicators are visible

### Accessibility
- [ ] **Keyboard Navigation**
  - [ ] All interactive elements are focusable
  - [ ] Tab order is logical
  - [ ] Focus indicators are clearly visible
  - [ ] Escape key closes modals
  - [ ] Enter/Space activate buttons

- [ ] **Screen Reader Support**
  - [ ] All images have alt text
  - [ ] Form inputs have proper labels
  - [ ] ARIA attributes are used appropriately
  - [ ] Page structure uses semantic HTML
  - [ ] Status messages are announced

- [ ] **Visual Accessibility**
  - [ ] Color contrast meets WCAG AA standards
  - [ ] Text scales up to 200% without breaking
  - [ ] Focus indicators have sufficient contrast
  - [ ] Icons have text alternatives

## 🔒 Security & Privacy

### Data Protection
- [ ] **Sensitive Information**
  - [ ] Document numbers are masked in UI
  - [ ] Personal information is not logged
  - [ ] File uploads are validated for security
  - [ ] User inputs are sanitized

### Authentication Security
- [ ] **Password Security**
  - [ ] Password requirements are enforced
  - [ ] Passwords are not visible in network requests
  - [ ] Session tokens are handled securely
  - [ ] Authentication tokens expire appropriately

## 💳 Premium Features

### Plan Restrictions
- [ ] **Free Plan Limitations**
  - [ ] Document limit enforced (1 document)
  - [ ] Document type restrictions enforced (BI only)
  - [ ] Upgrade prompts appear at appropriate times
  - [ ] Feature restrictions are clearly communicated

### Premium Access
- [ ] **Premium Benefits**
  - [ ] Unlimited document storage
  - [ ] All document types available
  - [ ] Priority chat features work
  - [ ] Premium badge/indicators display

## 🔔 Notifications

### In-App Notifications
- [ ] **Toast Messages**
  - [ ] Success actions show green toasts
  - [ ] Error conditions show red toasts
  - [ ] Warning messages show yellow toasts
  - [ ] Info messages show blue toasts
  - [ ] Toasts auto-dismiss after appropriate time
  - [ ] Toasts can be manually dismissed

### Real-time Notifications
- [ ] **Live Updates**
  - [ ] New chat messages trigger notifications
  - [ ] Document matches create notifications
  - [ ] Feed updates appear in real-time
  - [ ] Notification badges update correctly

## 🚫 Error Handling

### Network Errors
- [ ] **Connectivity Issues**
  - [ ] Offline state is handled gracefully
  - [ ] Network errors show appropriate messages
  - [ ] Retry mechanisms work for failed requests
  - [ ] Loading states display during network requests

### Application Errors
- [ ] **Error Boundaries**
  - [ ] JavaScript errors are caught and displayed
  - [ ] Error boundaries show recovery options
  - [ ] Page refresh option is available
  - [ ] Errors are logged appropriately (without PII)

### Form Validation
- [ ] **Input Validation**
  - [ ] Required fields show validation messages
  - [ ] Format validation works (email, phone)
  - [ ] File type validation prevents invalid uploads
  - [ ] API validation errors are displayed

## ⚡ Performance

### Loading Performance
- [ ] **Initial Load**
  - [ ] App loads within reasonable time (< 3s)
  - [ ] Loading spinners display during wait times
  - [ ] Code splitting reduces initial bundle size
  - [ ] Critical resources load first

### Runtime Performance
- [ ] **Smooth Interactions**
  - [ ] Scrolling is smooth
  - [ ] Animations are performant
  - [ ] Form inputs respond immediately
  - [ ] Navigation transitions are quick

### Data Loading
- [ ] **API Performance**
  - [ ] Data loads efficiently
  - [ ] Caching reduces redundant requests
  - [ ] Background refresh works
  - [ ] Optimistic updates feel responsive

## 🌐 Cross-Platform Testing

### Browser Compatibility
- [ ] **Chrome** (Latest)
  - [ ] All features work correctly
  - [ ] Performance is acceptable
  - [ ] No console errors

- [ ] **Firefox** (Latest)
  - [ ] Feature parity with Chrome
  - [ ] Styling renders correctly
  - [ ] JavaScript functionality works

- [ ] **Safari** (Latest)
  - [ ] iOS Safari compatibility
  - [ ] macOS Safari compatibility
  - [ ] WebKit-specific features work

- [ ] **Edge** (Latest)
  - [ ] Microsoft Edge compatibility
  - [ ] Windows-specific features work

### Mobile Browsers
- [ ] **iOS Safari**
  - [ ] iPhone compatibility
  - [ ] iPad compatibility
  - [ ] Touch gestures work
  - [ ] Safe area handling works

- [ ] **Android Chrome**
  - [ ] Various Android devices
  - [ ] Different screen densities
  - [ ] Touch interactions work
  - [ ] Back button handling

## 📊 Business Logic Validation

### Document Lifecycle
- [ ] **Status Transitions**
  - [ ] Normal → Lost transition works
  - [ ] Lost documents appear in public feed
  - [ ] Found document matching works
  - [ ] Status changes trigger appropriate notifications

### Points System
- [ ] **Point Allocation**
  - [ ] Users earn points for reporting found documents
  - [ ] Point values are correct (50 points for found reports)
  - [ ] Points display accurately in profile
  - [ ] Point history is maintained

### Premium Gating
- [ ] **Business Rules**
  - [ ] Free plan restrictions are enforced consistently
  - [ ] Premium benefits are immediately available after upgrade
  - [ ] Plan changes are reflected throughout the app
  - [ ] Billing integration works (if implemented)

---

## ✅ QA Sign-off

**Tester Name**: ________________  
**Date**: ________________  
**Browser/Device**: ________________  
**Build Version**: ________________  

**Overall Assessment**:
- [ ] All critical features work correctly
- [ ] No blocking bugs identified
- [ ] Performance is acceptable
- [ ] Security checks passed
- [ ] Accessibility requirements met

**Notes/Issues**:
_________________________________
_________________________________
_________________________________

**Recommendation**:
- [ ] ✅ Approved for production release
- [ ] ⚠️ Approved with minor issues noted
- [ ] ❌ Requires fixes before release
