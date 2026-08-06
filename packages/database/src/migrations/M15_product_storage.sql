-- Create product_images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product_images', 'product_images', true)
ON CONFLICT (id) DO NOTHING;
