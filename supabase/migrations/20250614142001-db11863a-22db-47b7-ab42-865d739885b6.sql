
-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Create storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add avatar_url column to profiles table
ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;

-- Create function to generate avatar pattern based on username
CREATE OR REPLACE FUNCTION public.generate_avatar_pattern(username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    hash_value BIGINT;
    pattern TEXT;
BEGIN
    -- Generate hash from username
    hash_value := hashtextextended(username, 0);
    
    -- Create a simple pattern identifier based on hash
    pattern := 'pattern_' || (abs(hash_value) % 100)::TEXT;
    
    RETURN pattern;
END;
$$;
