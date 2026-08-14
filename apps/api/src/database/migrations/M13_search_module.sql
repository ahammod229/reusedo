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
ALTER TABLE need_requests ADD COLUMN IF NOT EXISTS fts_tsvector TSVECTOR
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) STORED;

CREATE INDEX IF NOT EXISTS need_requests_fts_idx ON need_requests USING GIN (fts_tsvector);

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
