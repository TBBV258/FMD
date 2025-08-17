// English translations - preserving existing keys from translations.js
export const enTranslations = {
  // Navigation
  nav: {
    home: 'Home',
    my_docs: 'My Docs',
    lost: 'Lost',
    found: 'Found',
    profile: 'Profile',
    report_lost: 'Report Lost',
    report_found: 'Report Found',
    reset: 'Reset',
    logout: 'Logout',
    upgrade: 'Premium',
    feed: 'Feed',
  },

  // Login & Auth
  login: {
    title: 'FindMyDocs',
    subtitle: 'Lost and found document management system',
    email: 'Email',
    password: 'Password',
    login_button: 'Login',
    signup_button: 'Create Account',
    google_button: 'Continue with Google',
  },

  // Signup
  signup: {
    title: 'Create Account',
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    password: 'Password (min. 6 characters)',
    create_button: 'Create Account',
  },

  // Welcome
  welcome: {
    title: 'Welcome!',
    tips_title: 'Tips for Using FindMyDocs',
    points: 'Points',
    activity_points: 'Your Activity Points',
    earn_points: 'Earn 100 more points for a free document verification!',
    help_others: 'Earn points by helping others find their lost documents.',
    learn_more: 'Learn more',
    free_plan: 'Free Plan',
    current: 'Current',
    plan_description: 'Only ID card storage available',
    upgrade: 'Upgrade',
    add_document: 'Add New Document',
  },

  // Tips
  tip: {
    safe_location: {
      title: 'Meet in Safe Locations',
      description: 'Always meet at police stations, government buildings, or public places when exchanging documents.',
    },
    verify_ownership: {
      title: 'Verify Ownership',
      description: 'Ask for additional identification to verify ownership before returning documents.',
    },
  },

  // Documents
  documents: {
    title: 'Your Documents',
    add: 'Add Document',
    total: 'total',
    no_documents: 'No documents added yet',
    add_first: 'Click "Add Document" to get started',
    view: 'View',
    edit: 'Edit',
    mark_lost: 'Mark as Lost',
    contact: 'Contact',
  },

  // Document Modal
  document: {
    modal_title: 'Add Document',
    type: 'Document Type',
    name: 'Document Name',
    number: 'Document Number',
    description: 'Description (optional)',
    upload_image: 'Upload File',
    upload_text: 'Click to upload or drag and drop files',
    upload_camera_hint: 'You can take a photo using your camera',
    cancel: 'Cancel',
    save: 'Save Document',
  },

  // Lost Documents
  lost: {
    modal_title: 'Report Lost',
    document_type: 'Document Type',
    document_name: 'Document Name',
    where_lost: 'Where was it lost?',
    location_placeholder: 'Enter the location where it was lost',
    additional_details: 'Additional details',
    description_placeholder: 'Describe the document',
    contact_info: 'Your contact information',
    report_button_submit: 'Report Lost',
    all_types: 'All Types',
    search_placeholder: 'Search documents...',
    no_documents: 'No lost documents',
    be_first: 'Be the first to report',
    upload_camera_hint: 'You can take a photo using your camera',
  },

  // Found Documents
  found: {
    modal_title: 'Report Found',
    document_type: 'Document Type',
    document_name: 'Document Name',
    where_found: 'Where did you find it?',
    location_placeholder: 'Enter the location where you found it',
    additional_details: 'Additional details',
    description_placeholder: 'Describe the found document',
    finder_contact: 'Your contact information',
    upload_image: 'Upload image (optional)',
    report_button_submit: 'Submit Found Report',
    no_documents: 'No found documents',
    help_others: 'Help others by reporting documents you found.',
    upload_camera_hint: 'You can take a photo using your camera',
  },

  // Document Types
  type: {
    bi: 'ID Card',
    passaporte: 'Passport',
    carta: 'Driver\'s License',
    outros: 'Others',
  },

  // Status
  status: {
    active: 'Active',
    normal: 'Normal',
    lost: 'Lost',
    found: 'Found',
  },

  // Chat
  chat: {
    title: 'Chat',
    placeholder: 'Type your message...',
    send: 'Send',
  },

  // Location
  location: {
    title: 'Select Location',
    click_map: 'Click on the map to select a location',
    confirm: 'Confirm Location',
  },

  // Upgrade
  upgrade: {
    title: 'Upgrade to Premium',
    free_plan: 'Free Plan',
    premium_plan: 'Premium',
    free_feature1: '1 document (ID card only)',
    free_feature2: 'Basic search',
    premium_feature1: 'Unlimited documents',
    premium_feature2: 'All document types',
    premium_feature3: 'Priority chat',
    premium_feature4: 'Push notifications',
    button: 'Upgrade Now',
  },

  // Messages
  message: {
    document_added: 'Document added successfully!',
    document_marked_lost: 'Document marked as lost successfully!',
    lost_reported: 'Lost document reported successfully!',
    found_reported: 'Found document reported successfully! Thank you for helping!',
    fill_required: 'Please fill in all required fields.',
    login_success: 'Login successful!',
    confirm_mark_lost: 'Are you sure you want to mark this document as lost? This will make it visible in the public lost documents feed.',
  },

  // Profile
  profile: {
    title: 'User Profile',
    status: {
      active: 'Active',
    },
    stats: {
      documents: 'Documents',
      points: 'Points',
      helped: 'Helped',
    },
    actions: {
      backup: {
        title: 'Data Backup',
        description: 'Backup your documents',
      },
      notifications: {
        title: 'Notifications',
        description: 'Manage your preferences',
      },
    },
  },

  // Common
  common: {
    select_type: 'Select type',
    loading: 'Loading...',
    cancel: 'Cancel',
    location: 'Location',
  },

  // Placeholders
  placeholder: {
    phone: 'e.g. 555 123 4567',
  },
} as const;
