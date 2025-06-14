
-- Update the policy to allow anyone (including unauthenticated users) to view download analytics
DROP POLICY IF EXISTS "Anyone can view download analytics" ON public.download_analytics;

CREATE POLICY "Anyone can view download analytics" 
  ON public.download_analytics 
  FOR SELECT 
  USING (true);
