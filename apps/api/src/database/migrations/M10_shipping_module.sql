-- M10: Shipping Module
-- Handles shipment tracking for exchanges

CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_id UUID NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
