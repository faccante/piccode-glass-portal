
-- Create storage bucket for JAR files
INSERT INTO storage.buckets (id, name, public)
VALUES ('jar-files', 'jar-files', true);

-- Create storage policies for jar-files bucket
CREATE POLICY "JAR files are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'jar-files');

CREATE POLICY "Authenticated users can upload JAR files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'jar-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own JAR files" ON storage.objects
FOR UPDATE USING (bucket_id = 'jar-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own JAR files" ON storage.objects
FOR DELETE USING (bucket_id = 'jar-files' AND auth.role() = 'authenticated');
