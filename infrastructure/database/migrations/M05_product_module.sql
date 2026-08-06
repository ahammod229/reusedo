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
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
