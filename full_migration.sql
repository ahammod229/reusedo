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
-- M05: Product Catalog Foundation

-- 1. Create product_status enum
CREATE TYPE product_status AS ENUM ('draft', 'published', 'archived', 'hidden', 'deleted');

-- 2. Create Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES public.categories(id),
    condition VARCHAR(50) NOT NULL,
    exchange_preference VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    upazila VARCHAR(100) NOT NULL,
    images JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of strings/URLs
    brand VARCHAR(100),
    model VARCHAR(100),
    color VARCHAR(50),
    purchase_year INTEGER,
    estimated_value NUMERIC(10, 2),
    tags TEXT[] DEFAULT '{}',
    status product_status NOT NULL DEFAULT 'draft',
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for products search and filtering
CREATE INDEX idx_products_owner_id ON public.products(owner_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_district ON public.products(district);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Categories RLS
-- Anyone can view categories
CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (true);

-- Products RLS
-- Anyone can view published products
CREATE POLICY "Published products are viewable by everyone" ON public.products
    FOR SELECT USING (status = 'published');

-- Owners can view all their own products (including drafts, archived)
CREATE POLICY "Users can view their own products" ON public.products
    FOR SELECT USING (auth.uid() = owner_id);

-- Owners can insert products
CREATE POLICY "Users can create products" ON public.products
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own products
CREATE POLICY "Users can update their own products" ON public.products
    FOR UPDATE USING (auth.uid() = owner_id);

-- Owners can delete their own products
CREATE POLICY "Users can delete their own products" ON public.products
    FOR DELETE USING (auth.uid() = owner_id);


-- 5. Seed Categories
INSERT INTO public.categories (name, slug) VALUES 
('Electronics', 'electronics'),
('Vehicles', 'vehicles'),
('Books & Stationery', 'books-stationery'),
('Home & Living', 'home-living'),
('Fashion & Beauty', 'fashion-beauty')
ON CONFLICT (slug) DO NOTHING;

-- Optionally, add some child categories
DO $$ 
DECLARE
  electronics_id UUID;
  vehicles_id UUID;
BEGIN
  SELECT id INTO electronics_id FROM public.categories WHERE slug = 'electronics';
  SELECT id INTO vehicles_id FROM public.categories WHERE slug = 'vehicles';
  
  IF electronics_id IS NOT NULL THEN
    INSERT INTO public.categories (name, slug, parent_id) VALUES 
    ('Mobile Phones', 'mobile-phones', electronics_id),
    ('Laptops & Computers', 'laptops-computers', electronics_id)
    ON CONFLICT (slug) DO NOTHING;
  END IF;

  IF vehicles_id IS NOT NULL THEN
    INSERT INTO public.categories (name, slug, parent_id) VALUES 
    ('Cars', 'cars', vehicles_id),
    ('Motorcycles', 'motorcycles', vehicles_id),
    ('Bicycles', 'bicycles', vehicles_id)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;


-- 6. Setup Storage for Product Images
-- Note: Requires Supabase pgjwt and storage schema, standard for Supabase projects
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Allow anyone to view public product images
CREATE POLICY "Product images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'products');

-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload product images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'products' AND 
        auth.role() = 'authenticated'
    );

-- Allow users to update/delete their own images
CREATE POLICY "Users can manage their uploaded images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'products' AND auth.uid() = owner)
    WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their uploaded images" ON storage.objects
    FOR DELETE USING (bucket_id = 'products' AND auth.uid() = owner);
-- M06: Need Request Module

-- 1. Create need_status enum
CREATE TYPE need_status AS ENUM ('draft', 'published', 'fulfilled', 'expired', 'archived', 'deleted');

-- 2. Create Need Requests table
CREATE TABLE IF NOT EXISTS public.need_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES public.categories(id),
    preferred_condition VARCHAR(50) NOT NULL,
    district VARCHAR(100) NOT NULL,
    upazila VARCHAR(100) NOT NULL,
    preferred_brand VARCHAR(100),
    preferred_model VARCHAR(100),
    estimated_value NUMERIC(10, 2),
    deadline TIMESTAMPTZ,
    images JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of strings/URLs
    status need_status NOT NULL DEFAULT 'draft',
    view_count INTEGER NOT NULL DEFAULT 0,
    offer_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for need_requests search and filtering
CREATE INDEX idx_need_requests_owner_id ON public.need_requests(owner_id);
CREATE INDEX idx_need_requests_category_id ON public.need_requests(category_id);
CREATE INDEX idx_need_requests_status ON public.need_requests(status);
CREATE INDEX idx_need_requests_district ON public.need_requests(district);
CREATE INDEX idx_need_requests_deadline ON public.need_requests(deadline);

-- 3. Create Offers table
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    need_id UUID NOT NULL REFERENCES public.need_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(need_id, product_id)
);

CREATE INDEX idx_offers_need_id ON public.offers(need_id);
CREATE INDEX idx_offers_user_id ON public.offers(user_id);
CREATE INDEX idx_offers_product_id ON public.offers(product_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.need_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Need Requests RLS
-- Anyone can view published needs
CREATE POLICY "Published needs are viewable by everyone" ON public.need_requests
    FOR SELECT USING (status = 'published');

-- Owners can view all their own needs (including drafts, archived)
CREATE POLICY "Users can view their own needs" ON public.need_requests
    FOR SELECT USING (auth.uid() = owner_id);

-- Owners can insert needs
CREATE POLICY "Users can create needs" ON public.need_requests
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own needs
CREATE POLICY "Users can update their own needs" ON public.need_requests
    FOR UPDATE USING (auth.uid() = owner_id);

-- Owners can delete their own needs
CREATE POLICY "Users can delete their own needs" ON public.need_requests
    FOR DELETE USING (auth.uid() = owner_id);


-- Offers RLS
-- Users can view offers made on their needs
CREATE POLICY "Users can view offers on their needs" ON public.offers
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM public.need_requests WHERE id = public.offers.need_id
        )
    );

-- Users can view their own offers
CREATE POLICY "Users can view their own offers" ON public.offers
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert offers if they own the product and the product is published
CREATE POLICY "Users can create offers" ON public.offers
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND 
        auth.uid() IN (
            SELECT owner_id FROM public.products 
            WHERE id = product_id AND status = 'published'
        )
    );

-- Users can delete their own offers
CREATE POLICY "Users can delete their own offers" ON public.offers
    FOR DELETE USING (auth.uid() = user_id);

-- Setup Storage for Need Images
INSERT INTO storage.buckets (id, name, public) VALUES ('needs', 'needs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Need images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'needs');

CREATE POLICY "Users can upload need images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'needs' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can manage their uploaded need images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'needs' AND auth.uid() = owner)
    WITH CHECK (bucket_id = 'needs' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their uploaded need images" ON storage.objects
    FOR DELETE USING (bucket_id = 'needs' AND auth.uid() = owner);
-- M07: Exchange Engine Module

-- 1. Create Exchange Status ENUM
CREATE TYPE exchange_status AS ENUM (
    'pending', 
    'counter_offered', 
    'accepted', 
    'rejected', 
    'cancelled', 
    'expired', 
    'ready_for_shipping'
);

-- 2. Create Exchange Event Type ENUM
CREATE TYPE exchange_event_type AS ENUM (
    'created', 
    'counter_offered', 
    'accepted', 
    'rejected', 
    'cancelled', 
    'expired'
);

-- 3. Create Exchanges table
CREATE TABLE IF NOT EXISTS public.exchanges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    offered_product_ids UUID[] NOT NULL DEFAULT '{}',
    requested_product_ids UUID[] NOT NULL DEFAULT '{}',
    status exchange_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + interval '7 days'),
    CONSTRAINT check_requester_recipient_diff CHECK (requester_id != recipient_id)
);

-- Create indexes for exchanges
CREATE INDEX idx_exchanges_requester_id ON public.exchanges(requester_id);
CREATE INDEX idx_exchanges_recipient_id ON public.exchanges(recipient_id);
CREATE INDEX idx_exchanges_status ON public.exchanges(status);

-- 4. Create Exchange Events table for the timeline
CREATE TABLE IF NOT EXISTS public.exchange_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_id UUID NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Can be null for system events like 'expired'
    action exchange_event_type NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for exchange_events
CREATE INDEX idx_exchange_events_exchange_id ON public.exchange_events(exchange_id);
CREATE INDEX idx_exchange_events_actor_id ON public.exchange_events(actor_id);
CREATE INDEX idx_exchange_events_created_at ON public.exchange_events(created_at);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_events ENABLE ROW LEVEL SECURITY;

-- Exchanges RLS
-- Users can view exchanges where they are either the requester or recipient
CREATE POLICY "Users can view their own exchanges" ON public.exchanges
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Users can insert an exchange if they are the requester
CREATE POLICY "Users can create exchanges" ON public.exchanges
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Users can update an exchange if they are either participant
CREATE POLICY "Users can update their own exchanges" ON public.exchanges
    FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Exchange Events RLS
-- Users can view events for exchanges they are part of
CREATE POLICY "Users can view events for their exchanges" ON public.exchange_events
    FOR SELECT USING (
        auth.uid() IN (
            SELECT requester_id FROM public.exchanges WHERE id = public.exchange_events.exchange_id
            UNION
            SELECT recipient_id FROM public.exchanges WHERE id = public.exchange_events.exchange_id
        )
    );

-- Users can insert events if they are the actor and part of the exchange
CREATE POLICY "Users can insert events" ON public.exchange_events
    FOR INSERT WITH CHECK (
        auth.uid() = actor_id AND
        auth.uid() IN (
            SELECT requester_id FROM public.exchanges WHERE id = public.exchange_events.exchange_id
            UNION
            SELECT recipient_id FROM public.exchanges WHERE id = public.exchange_events.exchange_id
        )
    );
-- =============================================================================
-- REUSEDO DATABASE MIGRATION
-- Milestone: M08 - Realtime Communication Module
-- =============================================================================

-- Enable uuid-ossp extension if not already enabled (usually enabled by Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. CONVERSATIONS
-- -----------------------------------------------------------------------------
-- Represents a single chat thread tied to a specific context
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  context_type VARCHAR(50) NOT NULL CHECK (context_type IN ('product', 'need', 'exchange', 'donation')),
  context_id UUID NOT NULL, -- The ID of the product, need, or exchange
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index on context_id for fast lookups (e.g. checking if a conversation already exists for an exchange)
CREATE INDEX IF NOT EXISTS idx_conversations_context_id ON public.conversations(context_id);

-- -----------------------------------------------------------------------------
-- 2. CONVERSATION PARTICIPANTS
-- -----------------------------------------------------------------------------
-- Maps users to conversations and tracks their individual state
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Using Supabase Auth user id or public.profiles id depending on architecture
  archived BOOLEAN DEFAULT false NOT NULL,
  muted BOOLEAN DEFAULT false NOT NULL,
  unread_count INTEGER DEFAULT 0 NOT NULL,
  last_read_message_id UUID, -- Will reference messages(id) later
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);

-- -----------------------------------------------------------------------------
-- 3. MESSAGES
-- -----------------------------------------------------------------------------
-- Individual chat messages within a conversation
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Null if system message
  type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'system', 'product_card', 'need_card', 'exchange_card')),
  content TEXT, -- For text messages or system message text
  metadata JSONB, -- For storing image URLs or card details
  status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Add foreign key constraint to conversation_participants now that messages table exists
ALTER TABLE public.conversation_participants 
  ADD CONSTRAINT fk_last_read_message 
  FOREIGN KEY (last_read_message_id) 
  REFERENCES public.messages(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 4. MESSAGE REACTIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reactions (
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  PRIMARY KEY (message_id, user_id)
);

-- -----------------------------------------------------------------------------
-- 5. SUPABASE REALTIME CONFIGURATION
-- -----------------------------------------------------------------------------
-- Add tables to the publication for Realtime subscriptions
DO $$
BEGIN
  -- Adding tables to supabase_realtime publication
  -- Only execute if the publication exists (Supabase standard)
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations';
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants';
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Handle case where tables are already in publication
  NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 6. TRIGGERS
-- -----------------------------------------------------------------------------
-- Update `updated_at` timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update conversation updated_at when a new message is inserted
CREATE OR REPLACE FUNCTION update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET updated_at = timezone('utc'::text, now())
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_conversation_on_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_new_message();

-- -----------------------------------------------------------------------------
-- 7. SUPABASE STORAGE (BUCKET)
-- -----------------------------------------------------------------------------
-- Insert bucket for chat_attachments if using standard Supabase Storage schema
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat_attachments', 'chat_attachments', true)
ON CONFLICT (id) DO NOTHING;
-- M09 Notification Module Schema

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'announcement')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    related_entity_type TEXT,
    related_entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (true); -- Usually inserts happen on backend with service role bypassing RLS, but if needed from authenticated user, we can allow it. We'll leave it as true for now.

CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON public.notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create fcm_tokens table
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    device_info TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- Enable RLS for fcm_tokens
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own fcm tokens"
    ON public.fcm_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fcm tokens"
    ON public.fcm_tokens
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fcm tokens"
    ON public.fcm_tokens
    FOR DELETE
    USING (auth.uid() = user_id);

-- Alter notification_preferences to add new columns
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.notification_preferences ADD COLUMN reviews BOOLEAN NOT NULL DEFAULT TRUE;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.notification_preferences ADD COLUMN browser_notifications BOOLEAN NOT NULL DEFAULT TRUE;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- Let's create an index for quick queries on unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable realtime for notifications
alter publication supabase_realtime add table public.notifications;
-- M10: Shipping Module
-- Handles shipment tracking for exchanges

CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_id UUID NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled', 'returned')),
    tracking_number TEXT,
    carrier TEXT,
    estimated_delivery_date TIMESTAMPTZ,
    shipping_address JSONB NOT NULL,
    shipping_cost DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    UNIQUE(exchange_id)
);

-- Enable RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Policies for shipments
CREATE POLICY "Users can view their own shipments (sender or receiver)"
    ON public.shipments FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create shipments for their exchanges"
    ON public.shipments FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their shipments"
    ON public.shipments FOR UPDATE
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Triggers for updated_at
CREATE TRIGGER update_shipments_updated_at
    BEFORE UPDATE ON public.shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
-- M11 Trust, Reviews & Verification System Migration

-- 1. Modify Profiles Table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 2. Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_id UUID NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    positive_tags TEXT[] DEFAULT '{}',
    negative_tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_exchange_reviewer UNIQUE(exchange_id, reviewer_id)
);

-- Enable RLS for Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
    ON public.reviews FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = reviewer_id);

-- 3. Create Verifications Table
CREATE TYPE verification_document_type AS ENUM ('national_id', 'passport', 'driving_license');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected', 'expired');

CREATE TABLE IF NOT EXISTS public.verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    document_type verification_document_type NOT NULL,
    document_front_url TEXT NOT NULL,
    document_back_url TEXT,
    status verification_status NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for Verifications
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verifications"
    ON public.verifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own verifications"
    ON public.verifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending verifications"
    ON public.verifications FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending');

-- 4. Create Reports Table
CREATE TYPE report_entity_type AS ENUM ('product', 'need', 'user', 'review', 'message');
CREATE TYPE report_reason AS ENUM ('spam', 'fraud', 'abuse', 'fake_item', 'inappropriate', 'other');
CREATE TYPE report_status AS ENUM ('open', 'investigating', 'resolved', 'dismissed');

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    entity_type report_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    reason report_reason NOT NULL,
    description TEXT,
    status report_status NOT NULL DEFAULT 'open',
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for Reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
    ON public.reports FOR SELECT
    USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
    ON public.reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

-- 5. Create Appeals Table
CREATE TYPE appeal_target_type AS ENUM ('verification', 'report');
CREATE TYPE appeal_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS public.appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type appeal_target_type NOT NULL,
    target_id UUID NOT NULL,
    description TEXT NOT NULL,
    status appeal_status NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for Appeals
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own appeals"
    ON public.appeals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create appeals"
    ON public.appeals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 6. Add Triggers for updated_at

CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_reviews_updated_at();

CREATE OR REPLACE FUNCTION update_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_verifications_updated_at
BEFORE UPDATE ON public.verifications
FOR EACH ROW EXECUTE FUNCTION update_verifications_updated_at();

CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION update_reports_updated_at();

CREATE OR REPLACE FUNCTION update_appeals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_appeals_updated_at
BEFORE UPDATE ON public.appeals
FOR EACH ROW EXECUTE FUNCTION update_appeals_updated_at();
-- M12 Administration & CMS Module Database Migration

-- 1. Create admin role enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role_type') THEN
        CREATE TYPE admin_role_type AS ENUM ('super_admin', 'admin', 'moderator', 'support_agent', 'content_manager');
    END IF;
END$$;

-- 2. Add role to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS admin_role admin_role_type;

-- 3. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    previous_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- 4. CMS Pages
CREATE TABLE IF NOT EXISTS public.cms_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    is_published BOOLEAN DEFAULT false,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON public.cms_pages(slug);

-- 5. Platform Settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Feature Flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    scheduled_activation TIMESTAMPTZ,
    internal_notes TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags(key);

-- RLS Policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write these (We'll enforce read/write with service roles for backend for now)
-- The backend uses the service role for admin tasks.
-- So we can just leave it as closed for anon/authenticated (unless they have admin_role, but doing it in the service layer is fine too).
CREATE POLICY "Admins can view audit_logs" ON public.audit_logs FOR SELECT USING (
    (SELECT admin_role FROM public.profiles WHERE id = (SELECT id FROM public.profiles WHERE firebase_uid = auth.uid())) IS NOT NULL
);

CREATE POLICY "Anyone can view published cms_pages" ON public.cms_pages FOR SELECT USING (
    is_published = true OR (SELECT admin_role FROM public.profiles WHERE id = (SELECT id FROM public.profiles WHERE firebase_uid = auth.uid())) IS NOT NULL
);

CREATE POLICY "Admins can view platform_settings" ON public.platform_settings FOR SELECT USING (
    (SELECT admin_role FROM public.profiles WHERE id = (SELECT id FROM public.profiles WHERE firebase_uid = auth.uid())) IS NOT NULL
);

CREATE POLICY "Admins can view feature_flags" ON public.feature_flags FOR SELECT USING (
    (SELECT admin_role FROM public.profiles WHERE id = (SELECT id FROM public.profiles WHERE firebase_uid = auth.uid())) IS NOT NULL
);
-- Migration: M13_search_module
-- Description: Search, Discovery & Recommendation Engine Schema and FTS Indexes

-- Enable pg_trgm extension for trigram matching (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Saved Searches
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    query TEXT,
    filters JSONB DEFAULT '{}'::JSONB,
    type TEXT NOT NULL, -- 'global', 'products', 'needs', 'users'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Recent Searches
CREATE TABLE IF NOT EXISTS recent_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    type TEXT DEFAULT 'global',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Recently Viewed
CREATE TABLE IF NOT EXISTS recently_viewed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, -- 'product', 'need', 'user'
    item_id UUID NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- We can enforce uniqueness to update viewed_at instead of duplicating
    UNIQUE (user_id, item_type, item_id)
);

-- 4. Search Analytics
CREATE TABLE IF NOT EXISTS search_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Null for anonymous
    keyword TEXT NOT NULL,
    result_count INTEGER DEFAULT 0,
    clicked_item_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Full-Text Search Indexes

-- Products FTS Index (title and description)
ALTER TABLE products ADD COLUMN IF NOT EXISTS fts_tsvector TSVECTOR
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) STORED;

CREATE INDEX IF NOT EXISTS products_fts_idx ON products USING GIN (fts_tsvector);

-- Products tags array FTS/GIN index (useful for overlap operations)
-- (Assuming tags is already TEXT[])
CREATE INDEX IF NOT EXISTS products_tags_idx ON products USING GIN (tags);

-- Needs FTS Index (title and description)
ALTER TABLE needs ADD COLUMN IF NOT EXISTS fts_tsvector TSVECTOR
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) STORED;

CREATE INDEX IF NOT EXISTS needs_fts_idx ON needs USING GIN (fts_tsvector);

-- Profiles Trigram Index (for partial matching on names)
CREATE INDEX IF NOT EXISTS profiles_display_name_trgm_idx ON profiles USING GIN (display_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_username_trgm_idx ON profiles USING GIN (username gin_trgm_ops);

-- RLS Policies

-- saved_searches
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved searches" ON saved_searches
    FOR ALL USING (auth.uid() = user_id);

-- recent_searches
ALTER TABLE recent_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own recent searches" ON recent_searches
    FOR ALL USING (auth.uid() = user_id);

-- recently_viewed
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own recently viewed items" ON recently_viewed
    FOR ALL USING (auth.uid() = user_id);

-- search_analytics
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
-- Insert allowed by anyone, read only by admins (we'll keep read closed to public)
CREATE POLICY "Anyone can insert search analytics" ON search_analytics
    FOR INSERT WITH CHECK (true);
-- M14: Analytics & Business Intelligence Module
-- This module contains read-only RPCs for dashboard aggregations.

-- 1. User Dashboard Summary
CREATE OR REPLACE FUNCTION get_user_dashboard_summary(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_active_exchanges INT;
  v_my_products INT;
  v_my_needs INT;
  v_unread_notifications INT;
  v_trust_score INT;
BEGIN
  -- Count active exchanges (status = 'pending' or 'accepted' or 'shipping')
  SELECT COUNT(*) INTO v_active_exchanges 
  FROM exchanges 
  WHERE (proposer_id = p_user_id OR receiver_id = p_user_id) 
    AND status IN ('pending', 'accepted', 'shipping');

  -- Count published products
  SELECT COUNT(*) INTO v_my_products 
  FROM products 
  WHERE owner_id = p_user_id AND status = 'published';

  -- Count open needs
  SELECT COUNT(*) INTO v_my_needs 
  FROM needs 
  WHERE owner_id = p_user_id AND status = 'open';

  -- Count unread notifications
  SELECT COUNT(*) INTO v_unread_notifications
  FROM notifications
  WHERE user_id = p_user_id AND is_read = false;

  -- Get trust score
  SELECT trust_score INTO v_trust_score
  FROM profiles
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'active_exchanges', v_active_exchanges,
    'my_products', v_my_products,
    'my_needs', v_my_needs,
    'unread_notifications', v_unread_notifications,
    'trust_score', COALESCE(v_trust_score, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Admin KPI Dashboard Summary
CREATE OR REPLACE FUNCTION get_admin_kpi_summary()
RETURNS JSONB AS $$
DECLARE
  v_total_users INT;
  v_active_users INT;
  v_total_products INT;
  v_total_needs INT;
  v_total_exchanges INT;
  v_completed_exchanges INT;
  v_success_rate NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM profiles;
  
  SELECT COUNT(*) INTO v_active_users FROM profiles WHERE is_verified = true;

  SELECT COUNT(*) INTO v_total_products FROM products;
  SELECT COUNT(*) INTO v_total_needs FROM needs;
  SELECT COUNT(*) INTO v_total_exchanges FROM exchanges;
  SELECT COUNT(*) INTO v_completed_exchanges FROM exchanges WHERE status = 'completed';

  IF v_total_exchanges > 0 THEN
    v_success_rate := ROUND((v_completed_exchanges::NUMERIC / v_total_exchanges::NUMERIC) * 100, 2);
  ELSE
    v_success_rate := 0;
  END IF;

  RETURN jsonb_build_object(
    'total_users', v_total_users,
    'active_users', v_active_users,
    'total_products', v_total_products,
    'total_needs', v_total_needs,
    'total_exchanges', v_total_exchanges,
    'completed_exchanges', v_completed_exchanges,
    'success_rate', v_success_rate
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
