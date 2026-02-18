import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use ref to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        navigate('/registration');
        return;
      }

      try {
        const response = await fetch(`${API}/auth/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          // Clear the hash and redirect to registration page with user data
          window.history.replaceState(null, '', '/registration');
          navigate('/registration', { state: { user: userData } });
        } else {
          console.error('Auth failed');
          navigate('/registration');
        }
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/registration');
      }
    };

    processAuth();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground font-body">Completing sign in...</p>
      </div>
    </div>
  );
}
