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
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Can be null for system events like 'expired'
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
