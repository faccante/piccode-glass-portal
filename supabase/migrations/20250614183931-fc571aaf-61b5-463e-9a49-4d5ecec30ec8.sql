
-- Drop the existing check constraint that's blocking moderator role updates
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add a new check constraint that includes the moderator role
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'manager', 'moderator'));
