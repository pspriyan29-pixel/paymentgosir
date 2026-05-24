import { createClient } from "@supabase/supabase-js";

// Check for environment variables
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "https://syxkloomvtudrnryvsly.supabase.co";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eGtsb29tdnR1ZHJucnl2c2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MjkwODcsImV4cCI6MjA5NTIwNTA4N30.U-8dySV5RgABov49ZYBslpaxHnAJK9Rk1kARtFAsC6c";

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
