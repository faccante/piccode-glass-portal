
-- Create admin user by updating the existing user's role to 'manager'
UPDATE public.profiles 
SET role = 'manager' 
WHERE email = 'mfanakagama@gmail.com';

-- If the user doesn't exist yet, we'll need to insert them after they sign up
-- The trigger will create the profile with default 'user' role, then we can update it
