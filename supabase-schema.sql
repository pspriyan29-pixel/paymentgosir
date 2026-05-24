-- SQL Script to set up tables in your Supabase SQL Editor
-- Copy and paste this script into: https://supabase.com/dashboard/project/syxkloomvtudrnryvsly/sql

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    api_key TEXT NOT NULL UNIQUE,
    webhook_url TEXT,
    redirect_url TEXT,
    qris_only BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Allow authenticated users to insert projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Allow authenticated users to update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Allow authenticated users to delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);


-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    project_slug TEXT NOT NULL,
    order_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    fee NUMERIC NOT NULL,
    net_amount NUMERIC NOT NULL,
    status TEXT NOT NULL, -- PENDING, COMPLETED, CANCELLED, EXPIRED
    method TEXT NOT NULL, -- qris, va_mandiri, va_bri, etc.
    payment_code TEXT NOT NULL,
    customer_name TEXT,
    customer_email TEXT,
    notes TEXT,
    webhook_sent BOOLEAN DEFAULT false NOT NULL,
    webhook_status TEXT DEFAULT 'idle' NOT NULL,
    webhook_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);


-- 5. Webhook Logs Table
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id TEXT PRIMARY KEY,
    transaction_id TEXT,
    order_id TEXT NOT NULL,
    project_slug TEXT NOT NULL,
    url TEXT NOT NULL,
    payload TEXT NOT NULL,
    response TEXT,
    status INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Webhook Logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Webhook logs are viewable" ON public.webhook_logs FOR SELECT USING (true);


-- 6. Withdrawals Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    fee NUMERIC NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    status TEXT NOT NULL, -- PENDING, SUCCESS
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Withdrawals
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can request withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
