import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(location.state?.user ? true : null);

  useEffect(() => {
    // Skip if user data was passed from AuthCallback
    if (location.state?.user) {
      setIsAuthenticated(true);
      return;
    }

    if (!loading) {
      if (!user) {
        setIsAuthenticated(false);
        navigate('/registration', { replace: true });
      } else if (requireAdmin && (user.role !== 'admin' || user.role_status !== 'approved')) {
        setIsAuthenticated(false);
        navigate('/', { replace: true });
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [user, loading, navigate, requireAdmin, location.state]);

  if (loading || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground font-body">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
