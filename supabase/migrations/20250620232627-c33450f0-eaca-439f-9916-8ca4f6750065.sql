
-- Enable real-time updates for all dashboard tables
-- First, set replica identity to FULL to capture complete row data during updates
ALTER TABLE public.scans REPLICA IDENTITY FULL;
ALTER TABLE public.weather_logs REPLICA IDENTITY FULL;
ALTER TABLE public.ai_chats REPLICA IDENTITY FULL;
ALTER TABLE public.disease_stats REPLICA IDENTITY FULL;

-- Add all tables to the supabase_realtime publication to enable real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.scans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weather_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.disease_stats;

-- Create storage bucket for maize images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('maize_images', 'maize_images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the maize_images bucket
CREATE POLICY "Allow public access to maize images" ON storage.objects
FOR ALL USING (bucket_id = 'maize_images');
