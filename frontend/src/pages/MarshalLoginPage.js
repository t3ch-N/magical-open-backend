import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Shield, Loader2, Lock, User, ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet';

const KOGL_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/ft1exgdt_KOGL.png";

export default function MarshalLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in via localStorage
    const session = localStorage.getItem('marshal_session');
    if (session) {
      fetch(`${API}/marshal/me`, {
        headers: { 'Authorization': `Bearer ${session}` }
      })
        .then(r => {
          if (r.ok) {
            navigate('/marshal-dashboard');
          } else {
            localStorage.removeItem('marshal_session');
            localStorage.removeItem('marshal_user');
          }
        })
        .catch(() => {
          localStorage.removeItem('marshal_session');
          localStorage.removeItem('marshal_user');
        })
        .finally(() => setCheckingAuth(false));
    } else {
      setCheckingAuth(false);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting login for:', username);
      const response = await fetch(`${API}/marshal/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok && data.success) {
        // Store session in localStorage for SPA navigation
        localStorage.setItem('marshal_session', data.session_id);
        localStorage.setItem('marshal_user', JSON.stringify(data.user));
        toast.success(`Welcome, ${data.user.full_name}!`);
        navigate('/marshal-dashboard');
      } else {
        toast.error(data.detail || 'Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4" data-testid="marshal-login-page">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Marshal Login | MKO 2026</title>
      </Helmet>
      
      <Card className="w-full max-w-md card-default" data-testid="login-card">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <img src={KOGL_LOGO} alt="KOGL" className="h-16" />
          </div>
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-heading text-2xl">Marshal Dashboard</CardTitle>
          <CardDescription className="font-body">
            Magical Kenya Open 2026 - Volunteer Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="pl-10"
                  autoComplete="username"
                  data-testid="input-username"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10"
                  autoComplete="current-password"
                  data-testid="input-password"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full btn-primary h-12"
              disabled={loading}
              data-testid="login-button"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-border text-center space-y-4">
            <p className="text-xs text-muted-foreground">
              This is a restricted area. Unauthorized access is prohibited.
            </p>
            <Link to="/">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-primary" data-testid="back-to-home-btn">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
