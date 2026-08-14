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
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Using Supabase Auth user id or public.profiles id depending on architecture
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
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Null if system message
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
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
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
