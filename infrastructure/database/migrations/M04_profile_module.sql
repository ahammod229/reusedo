-- M04 Profile Module Database Migration

-- 1. Extend the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS upazila TEXT,
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS join_date TIMESTAMPTZ DEFAULT NOW();

-- 2. User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    public_profile_visibility BOOLEAN DEFAULT true,
    show_email BOOLEAN DEFAULT false,
    show_phone BOOLEAN DEFAULT false,
    show_location BOOLEAN DEFAULT true,
    allow_direct_messages BOOLEAN DEFAULT true,
    search_engine_visibility BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    exchange_updates BOOLEAN DEFAULT true,
    messages BOOLEAN DEFAULT true,
    need_requests BOOLEAN DEFAULT true,
    product_activity BOOLEAN DEFAULT true,
    marketing BOOLEAN DEFAULT false,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Addresses Table
CREATE TABLE IF NOT EXISTS public.user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    label TEXT NOT NULL, -- e.g., 'Home', 'Office', 'Other'
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    district TEXT NOT NULL,
    upazila TEXT NOT NULL,
    area TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    landmark TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- RLS Policies (Assuming RLS is enabled)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- Only owners can view/edit their own settings
CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT USING (auth.uid() = (SELECT firebase_uid FROM profiles WHERE id = user_id));
CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = (SELECT firebase_uid FROM profiles WHERE id = user_id));
CREATE POLICY "Users can insert their own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = (SELECT firebase_uid FROM profiles WHERE id = user_id));

-- Only owners can view/edit their notification preferences
CREATE POLICY "Users can view their own notifications" ON public.notification_preferences FOR SELECT USING (auth.uid() = (SELECT firebase_uid FROM profiles WHERE id = user_id));
CREATE POLICY "Users can update their own notifications" ON public.notification_preferences FOR UPDATE USING (auth.uid() = (SELECT firebase_uid FROM profiles WHERE id = user_id));
CREATE POLICY "Users can insert their own notifications" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = (SELECT firebase_uid FROM profiles WHERE id = user_id));

-- Only owners can view/edit their own addresses
CREATE POLICY "Users can view their own addresses" ON public.user_addresses FOR SELECT USING (auth.uid() = (SELECT firebase_uid FROM profiles WHERE id = user_id));
CREATE POLICY "Users can update their own addresses" ON public.user_addresses FOR UPDATE USING (auth.uid() = (SELECT firebase_uid FROM profiles WHERE id = user_id));
CREATE POLICY "Users can insert their own addresses" ON public.user_addresses FOR INSERT WITH CHECK (auth.uid() = (SELECT firebase_uid FROM profiles WHERE id = user_id));
CREATE POLICY "Users can delete their own addresses" ON public.user_addresses FOR DELETE USING (auth.uid() = (SELECT firebase_uid FROM profiles WHERE id = user_id));
