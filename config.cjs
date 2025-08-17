// Supabase Configuration
// IMPORTANT: You need to create a .env file in your project root with your actual credentials
// The .env file should contain:
// FMD_URL=https://your-actual-project-id.supabase.co
// FMD_ANON_KEY=your-actual-anon-key-here

// Load environment variables from .env file
require('dotenv').config();

module.exports = {
    SUPABASE_URL: process.env.FMD_URL || 'https://your-project-id.supabase.co',
    SUPABASE_ANON_KEY: process.env.FMD_ANON_KEY || 'your-anon-key-here',
    PORT: process.env.PORT || 9000,
    NODE_ENV: process.env.NODE_ENV || 'development'
};
