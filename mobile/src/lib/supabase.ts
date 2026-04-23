import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://ofemyysfdxgsqqcxoiel.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZW15eXNmZHhnc3FxY3hvaWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MDE4OTAsImV4cCI6MjA5MjQ3Nzg5MH0.-7T6i4dc9SrhssG3V6jv0qStoSjS3HogwPROj0Lne9Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};
