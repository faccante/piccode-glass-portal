
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import UserDashboard from '@/components/UserDashboard';
import ModeratorDashboard from '@/components/ModeratorDashboard';

const Dashboard: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      // Not authenticated, redirect to login
      navigate('/login');
      return;
    }

    if (!loading && profile) {
      // Check user role and redirect accordingly
      if (profile.role === 'manager') {
        navigate('/manager-dashboard');
        return;
      }
      // For regular users and moderators, stay on this page
    }
  }, [user, profile, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not authenticated, show nothing (will redirect)
  if (!user) {
    return null;
  }

  // If it's a manager, show nothing (will redirect to manager dashboard)
  if (profile?.role === 'manager') {
    return null;
  }

  // Show appropriate dashboard based on role
  if (profile?.role === 'moderator') {
    return <ModeratorDashboard />;
  }

  // Show user dashboard for regular users
  return <UserDashboard />;
};

export default Dashboard;
