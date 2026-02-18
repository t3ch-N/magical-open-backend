import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from 'sonner';
import { 
  User,
  Camera,
  Users,
  Store,
  GraduationCap,
  CheckCircle2,
  Clock,
  XCircle,
  LogIn
} from 'lucide-react';

const roleOptions = [
  { 
    value: 'media', 
    label: 'Media / Press', 
    icon: Camera, 
    description: 'Journalists, photographers, and broadcast professionals' 
  },
  { 
    value: 'volunteer', 
    label: 'Volunteer', 
    icon: Users, 
    description: 'Support tournament operations and guest services' 
  },
  { 
    value: 'vendor', 
    label: 'Vendor / Supplier', 
    icon: Store, 
    description: 'Food, merchandise, and service providers' 
  },
  { 
    value: 'junior_golf', 
    label: 'Junior Golf Program', 
    icon: GraduationCap, 
    description: 'Participants in the junior golf development program' 
  }
];

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending Review' },
  approved: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' }
};

export default function RegistrationPage() {
  const { user, login, loading } = useAuth();
  const [formData, setFormData] = useState({
    requested_role: '',
    organization: '',
    phone: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.requested_role) {
      toast.error('Please select a role');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API}/auth/request-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Registration request submitted! You will be notified once reviewed.');
        // Refresh page to show updated status
        window.location.reload();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to submit request');
      }
    } catch (error) {
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div data-testid="registration-page">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container-custom">
          <Badge className="bg-accent text-accent-foreground mb-4 px-4 py-2">
            Restricted Access
          </Badge>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Registrations & Accreditation
          </h1>
          <p className="text-primary-foreground/80 text-lg font-body max-w-2xl">
            Register for accreditation as media, volunteer, vendor, or junior golf participant.
          </p>
        </div>
      </section>

      <section className="section-spacing">
        <div className="container-custom">
          {!user ? (
            // Registration temporarily disabled
            <Card className="max-w-xl mx-auto card-default" data-testid="login-card">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="font-heading text-2xl">Registration Coming Soon</CardTitle>
                <CardDescription className="font-body">
                  Online registration will be available shortly. Please check back later or contact us for more information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground font-body mb-2">
                    For immediate assistance, please contact:
                  </p>
                  <p className="font-subheading font-semibold text-primary">
                    info@magicalkenyaopen.com
                  </p>
                </div>
                <p className="text-center text-muted-foreground text-sm font-body">
                  We're working to bring you a seamless registration experience.
                </p>
              </CardContent>
            </Card>
          ) : user.requested_role || user.role !== 'public' ? (
            // Has already requested or has a role - show status
            <Card className="max-w-xl mx-auto card-default" data-testid="status-card">
              <CardHeader className="text-center">
                <div className="flex items-center gap-3 justify-center mb-4">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-16 h-16 rounded-full" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                      {user.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <CardTitle className="font-heading text-2xl">{user.name}</CardTitle>
                <CardDescription className="font-body">{user.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Display */}
                <div className={`p-4 ${statusConfig[user.role_status]?.bg || 'bg-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    {React.createElement(statusConfig[user.role_status]?.icon || Clock, {
                      className: `w-6 h-6 ${statusConfig[user.role_status]?.color || 'text-gray-600'}`
                    })}
                    <div>
                      <p className="font-subheading font-semibold">
                        {statusConfig[user.role_status]?.label || 'Unknown Status'}
                      </p>
                      <p className="text-sm text-muted-foreground font-body">
                        Role: {user.requested_role || user.role}
                      </p>
                    </div>
                  </div>
                </div>

                {user.role_status === 'pending' && (
                  <p className="text-center text-muted-foreground font-body">
                    Your application is being reviewed. You will receive an email once a decision has been made.
                  </p>
                )}

                {user.role_status === 'approved' && (
                  <div className="text-center">
                    <p className="text-green-600 font-body mb-4">
                      Your accreditation has been approved! You can now access restricted areas based on your role.
                    </p>
                    {user.role === 'admin' && (
                      <Button className="btn-primary" asChild>
                        <a href="/admin">Go to Admin Dashboard</a>
                      </Button>
                    )}
                  </div>
                )}

                {user.role_status === 'rejected' && (
                  <p className="text-center text-red-600 font-body">
                    Unfortunately, your application was not approved. Please contact us if you have any questions.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            // Logged in, no role yet - show registration form
            <div className="max-w-2xl mx-auto">
              {/* User info */}
              <Card className="card-default mb-8" data-testid="user-info-card">
                <CardContent className="p-6 flex items-center gap-4">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {user.name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-body font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge className="ml-auto">Signed In</Badge>
                </CardContent>
              </Card>

              {/* Role Selection */}
              <Card className="card-default" data-testid="role-selection-card">
                <CardHeader>
                  <CardTitle className="font-heading text-2xl">Select Your Role</CardTitle>
                  <CardDescription className="font-body">
                    Choose the category that best describes your participation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {roleOptions.map((role) => (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, requested_role: role.value }))}
                          className={`p-4 text-left border-2 transition-all ${
                            formData.requested_role === role.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          data-testid={`role-${role.value}`}
                        >
                          <role.icon className={`w-6 h-6 mb-2 ${
                            formData.requested_role === role.value ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                          <h4 className="font-subheading font-semibold">{role.label}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                        </button>
                      ))}
                    </div>

                    {formData.requested_role && (
                      <div className="space-y-4 pt-4 border-t border-border/40 animate-fade-in">
                        <div>
                          <Label htmlFor="organization">Organization / Company</Label>
                          <Input
                            id="organization"
                            value={formData.organization}
                            onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                            placeholder="Enter your organization name"
                            data-testid="organization-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+254 xxx xxx xxx"
                            data-testid="phone-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="reason">Reason for Registration</Label>
                          <Textarea
                            id="reason"
                            value={formData.reason}
                            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="Please describe why you're requesting accreditation..."
                            rows={4}
                            data-testid="reason-input"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full btn-primary h-12"
                          disabled={submitting}
                          data-testid="submit-registration"
                        >
                          {submitting ? 'Submitting...' : 'Submit Registration Request'}
                        </Button>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
