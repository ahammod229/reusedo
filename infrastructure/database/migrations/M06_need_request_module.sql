-- M06: Need Request Module

-- 1. Create need_status enum
CREATE TYPE need_status AS ENUM ('draft', 'published', 'fulfilled', 'expired', 'archived', 'deleted');

-- 2. Create Need Requests table
CREATE TABLE IF NOT EXISTS public.need_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
