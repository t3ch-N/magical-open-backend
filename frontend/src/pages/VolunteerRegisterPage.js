import React, { useState, useEffect } from 'react';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from 'sonner';
import { 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  User,
  Mail,
  Phone,
  Flag,
  IdCard,
  Loader2
} from 'lucide-react';

const KOGL_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/ft1exgdt_KOGL.png";

const availabilityOptions = [
  { value: 'all_day', label: 'All Day' },
  { value: 'morning', label: 'Morning Only' },
  { value: 'afternoon', label: 'Afternoon Only' },
  { value: 'not_available', label: 'Not Available' }
];

const tournamentDays = [
  { key: 'thursday', date: 'Thursday, 19th February 2026', field: 'availability_thursday' },
  { key: 'friday', date: 'Friday, 20th February 2026', field: 'availability_friday' },
  { key: 'saturday', date: 'Saturday, 21st February 2026', field: 'availability_saturday' },
  { key: 'sunday', date: 'Sunday, 22nd February 2026', field: 'availability_sunday' }
];

export default function VolunteerRegisterPage() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    nationality: '',
    identification_number: '',
    golf_club: '',
    email: '',
    phone: '',
    role: '',
    volunteered_before: false,
    availability_thursday: 'not_available',
    availability_friday: 'not_available',
    availability_saturday: 'not_available',
    availability_sunday: 'not_available',
    photo_attached: false,
    consent_given: false
  });
  const [stats, setStats] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Fetch volunteer stats
    fetch(`${API}/volunteers/stats`)
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone || !formData.role || !formData.golf_club) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!formData.consent_given) {
      toast.error('You must agree to the terms and conditions');
      return;
    }

    // Check at least one day available
    const hasAvailability = tournamentDays.some(day => formData[day.field] !== 'not_available');
    if (!hasAvailability) {
      toast.error('Please select at least one day you are available');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API}/volunteers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setSubmitted(true);
        toast.success('Registration submitted successfully!');
      } else {
        toast.error(data.detail || 'Registration failed. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div data-testid="volunteer-register-page">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container-custom text-center">
            <img src={KOGL_LOGO} alt="KOGL" className="h-20 mx-auto mb-6" />
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
              Registration Complete
            </h1>
          </div>
        </section>
        
        <section className="section-spacing">
          <div className="container-custom max-w-2xl">
            <Card className="card-default text-center" data-testid="success-card">
              <CardContent className="py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="font-heading text-2xl font-bold mb-4">Thank You for Registering!</h2>
                <p className="text-muted-foreground font-body mb-6">
                  Your volunteer registration has been submitted successfully. Our team will review your application and contact you via email with further instructions.
                </p>
                <div className="bg-muted p-4 rounded-lg mb-6">
                  <p className="text-sm font-body">
                    <strong>What happens next?</strong><br />
                    You will receive a confirmation email shortly. Once your application is approved, you will receive details about your assignment, training sessions, and tournament credentials.
                  </p>
                </div>
                <Button onClick={() => window.location.href = '/'} className="btn-primary">
                  Return to Homepage
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div data-testid="volunteer-register-page">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container-custom">
          <div className="flex items-center justify-center gap-6 mb-6">
            <img src={KOGL_LOGO} alt="KOGL" className="h-16 md:h-20" />
          </div>
          <div className="text-center">
            <Badge className="bg-accent text-accent-foreground mb-4 px-4 py-2">
              MKO 2026
            </Badge>
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
              Volunteer Registration
            </h1>
            <p className="text-primary-foreground/80 text-lg font-body max-w-2xl mx-auto">
              Join us at the Magical Kenya Open 2026 as a volunteer marshal or scorer. Be part of Africa's premier golf tournament!
            </p>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      {stats && (
        <section className="bg-muted py-6 border-b">
          <div className="container-custom">
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              <div className="text-center">
                <div className="font-subheading text-2xl font-bold text-primary">
                  {stats.marshals.current} / {stats.marshals.target}
                </div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Marshals Registered</div>
              </div>
              <div className="text-center">
                <div className="font-subheading text-2xl font-bold text-primary">
                  {stats.scorers.current} / {stats.scorers.target}
                </div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Scorers Registered</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Registration Form */}
      <section className="section-spacing">
        <div className="container-custom max-w-3xl">
          <Card className="card-default" data-testid="registration-form">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Registration Form</CardTitle>
              <CardDescription className="font-body">
                Please fill in all required fields (*) to complete your registration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div>
                  <h3 className="font-subheading text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => handleChange('first_name', e.target.value)}
                        placeholder="Enter your first name"
                        required
                        data-testid="input-first-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => handleChange('last_name', e.target.value)}
                        placeholder="Enter your last name"
                        required
                        data-testid="input-last-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nationality">Nationality *</Label>
                      <Input
                        id="nationality"
                        value={formData.nationality}
                        onChange={(e) => handleChange('nationality', e.target.value)}
                        placeholder="e.g., Kenyan"
                        required
                        data-testid="input-nationality"
                      />
                    </div>
                    <div>
                      <Label htmlFor="identification_number">ID/Passport Number *</Label>
                      <Input
                        id="identification_number"
                        value={formData.identification_number}
                        onChange={(e) => handleChange('identification_number', e.target.value)}
                        placeholder="National ID or Passport number"
                        required
                        data-testid="input-id-number"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="font-subheading text-lg font-semibold mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="your.email@example.com"
                        required
                        data-testid="input-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+254 7XX XXX XXX"
                        required
                        data-testid="input-phone"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="golf_club">Golf Club *</Label>
                      <Input
                        id="golf_club"
                        value={formData.golf_club}
                        onChange={(e) => handleChange('golf_club', e.target.value)}
                        placeholder="e.g., Karen Country Club"
                        required
                        data-testid="input-golf-club"
                      />
                    </div>
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <h3 className="font-subheading text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Volunteer Role
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Select Your Preferred Role *</Label>
                      <Select value={formData.role} onValueChange={(v) => handleChange('role', v)}>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Choose a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="marshal">Marshal</SelectItem>
                          <SelectItem value="scorer">Scorer</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Target: 300 Marshals and 300 Scorers. Registration is open.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="volunteered_before"
                        checked={formData.volunteered_before}
                        onCheckedChange={(checked) => handleChange('volunteered_before', checked)}
                        data-testid="checkbox-volunteered-before"
                      />
                      <Label htmlFor="volunteered_before" className="text-sm cursor-pointer">
                        I have volunteered at the Magical Kenya Open before
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <h3 className="font-subheading text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Availability
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Please indicate your availability for each tournament day.
                  </p>
                  <div className="space-y-4">
                    {tournamentDays.map((day) => (
                      <div key={day.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-muted rounded-lg">
                        <span className="font-body font-medium min-w-[200px]">{day.date}</span>
                        <Select 
                          value={formData[day.field]} 
                          onValueChange={(v) => handleChange(day.field, v)}
                        >
                          <SelectTrigger className="w-full sm:w-48" data-testid={`select-${day.key}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availabilityOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Photo Upload Notice */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="photo_attached"
                    checked={formData.photo_attached}
                    onCheckedChange={(checked) => handleChange('photo_attached', checked)}
                    data-testid="checkbox-photo"
                  />
                  <Label htmlFor="photo_attached" className="text-sm cursor-pointer">
                    I will provide a passport-sized photo for my accreditation badge
                  </Label>
                </div>

                {/* Consent */}
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="consent"
                      checked={formData.consent_given}
                      onCheckedChange={(checked) => handleChange('consent_given', checked)}
                      className="mt-1"
                      data-testid="checkbox-consent"
                    />
                    <Label htmlFor="consent" className="text-sm cursor-pointer leading-relaxed">
                      I confirm that all information provided is accurate. I agree to the terms and conditions of volunteering at the Magical Kenya Open 2026, including adhering to the code of conduct, attending required training sessions, and fulfilling my assigned duties during the tournament. I understand that my personal data will be processed in accordance with KOGL's privacy policy.
                    </Label>
                  </div>
                </div>

                {/* Submit */}
                <Button 
                  type="submit" 
                  className="w-full btn-primary h-14"
                  disabled={submitting}
                  data-testid="submit-button"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Registration'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
