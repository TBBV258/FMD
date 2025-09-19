# FindMyDocs - Document Management System

## Overview

FindMyDocs (FMD) is a mobile-first web application designed for managing lost and found documents in Maputo, Mozambique. The system helps users upload, track, and recover important documents like ID cards, DIRE certificates, passports, and bank documents. Built with HTML5, CSS3, and vanilla JavaScript, it connects to Supabase for authentication, database operations, storage, and real-time chat functionality.

The application features a freemium model where free users can store one document, while premium users have unlimited storage. The system is optimized for low-bandwidth environments and includes geolocation features, real-time chat between users, and document verification capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: Vanilla JavaScript (ES6), HTML5, CSS3 with mobile-first responsive design
- **Module Structure**: Modular JavaScript files with IIFE patterns to avoid global namespace pollution
- **Authentication Flow**: Client-side authentication state management with localStorage fallback and Supabase Auth integration
- **Routing**: Simple section-based navigation without a full SPA router - content sections are shown/hidden based on navigation state
- **Internationalization**: Translation system supporting Portuguese and English with dynamic language switching

### Backend Architecture
- **Database**: Supabase PostgreSQL with three main tables:
  - `user_profiles`: Extended user information including plan type and document counts
  - `documents`: Document metadata with status tracking (normal/lost/found) and geolocation data
  - `chats`: Real-time messaging system for document recovery coordination
- **Authentication**: Supabase Auth with email/password and session management
- **Storage**: Supabase Storage for document files with client-side image compression and watermarking
- **Real-time Features**: Supabase Realtime subscriptions for live chat functionality

### Data Flow and State Management
- **Client State**: Managed through vanilla JavaScript with localStorage persistence for offline capability
- **Session Handling**: Supabase session tokens with localStorage fallback for authentication persistence
- **Document Upload**: Client-side image compression → Supabase Storage → Database metadata insertion
- **Geolocation**: Browser Geolocation API with fallback to Maputo city center coordinates

### Security and Privacy
- **Authentication**: Supabase Row Level Security (RLS) policies implied for data isolation
- **Document Privacy**: Watermarking system adds "FMD – Identificação Apenas" to uploaded images
- **Data Masking**: Sensitive information (document numbers) are masked in public feeds
- **Secure Meetings**: Built-in recommendations for safe document exchange locations

## External Dependencies

### Core Infrastructure
- **Supabase**: Complete backend-as-a-service providing:
  - PostgreSQL database with real-time subscriptions
  - Authentication and user management
  - File storage with CDN distribution
  - Row-level security for data isolation

### Frontend Libraries
- **Font Awesome 6.0.0**: Icon library for UI elements
- **Google Fonts (Roboto)**: Typography with multiple font weights (300, 400, 500, 700)

### Browser APIs
- **Geolocation API**: For document location tracking and user positioning
- **FileReader API**: Client-side file processing for image uploads
- **Canvas API**: Image compression, resizing, and watermark application
- **LocalStorage API**: Offline data persistence and session management

### Third-Party Services
- **Google Maps**: External map service integration for location viewing (opens in new tabs)
- **Supabase CDN**: Content delivery for uploaded document images

### Development Configuration
- **Supabase Project**: 
  - URL: `https://amwkpnruxlxvgelgucit.supabase.co`
  - Anonymous key configured for client-side operations
  - Storage bucket: 'documents' for file uploads