import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://agqpfpzsxqbrqyjiqtiy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFncXBmcHpzeHFicnF5amlxdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjc3MTksImV4cCI6MjA4MTY0MzcxOX0.keYcyd0FViLtxH2DvlH8Ce4EglzGoTSC7via74SE52o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

