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
    (SELECT admin_role FROM public.profiles WHERE id = auth.uid()) IS NOT NULL
);

CREATE POLICY "Anyone can view published cms_pages" ON public.cms_pages FOR SELECT USING (
    is_published = true OR (SELECT admin_role FROM public.profiles WHERE id = auth.uid()) IS NOT NULL
);

CREATE POLICY "Admins can view platform_settings" ON public.platform_settings FOR SELECT USING (
    (SELECT admin_role FROM public.profiles WHERE id = auth.uid()) IS NOT NULL
);

CREATE POLICY "Admins can view feature_flags" ON public.feature_flags FOR SELECT USING (
    (SELECT admin_role FROM public.profiles WHERE id = auth.uid()) IS NOT NULL
);
