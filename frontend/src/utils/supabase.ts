import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://amwkpnruxlxvgelgucit.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtd2twbnJ1eGx4dmdlbGd1Y2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MjQyNzksImV4cCI6MjA3MTEwMDI3OX0.Aig88y-2xy4isACVB6zQ4n3zUrTAG_ZuwRFisqplG4U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

