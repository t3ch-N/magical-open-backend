import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  Loader2,
  Upload,
  FileText,
  X,
  Briefcase,
  Camera,
  Trophy,
  ClipboardList,
  UserPlus,
  AlertCircle
} from 'lucide-react';

const KOGL_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/ft1exgdt_KOGL.png";

// Module configurations with form fields
const moduleConfigs = {
  vendors: {
    icon: Briefcase,
    title: "Vendor & Supplier Accreditation",
    description: "Apply for vendor/supplier accreditation at the Magical Kenya Open 2026",
    fields: [
      { name: 'company_name', label: 'Company/Business Name', type: 'text', required: true },
      { name: 'business_type', label: 'Type of Business', type: 'select', required: true, options: [
        'Food & Beverage', 'Merchandise', 'Equipment Rental', 'Event Services', 
        'Transportation', 'Hospitality', 'Security', 'Cleaning Services', 'Other'
      ]},
      { name: 'contact_person', label: 'Contact Person Name', type: 'text', required: true },
      { name: 'contact_title', label: 'Contact Person Title/Position', type: 'text', required: true },
      { name: 'email', label: 'Email Address', type: 'email', required: true },
      { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
      { name: 'physical_address', label: 'Physical Address', type: 'textarea', required: true },
      { name: 'postal_address', label: 'Postal Address', type: 'text', required: false },
      { name: 'kra_pin', label: 'KRA PIN Number', type: 'text', required: true },
      { name: 'business_registration', label: 'Business Registration Number', type: 'text', required: true },
      { name: 'years_in_business', label: 'Years in Business', type: 'number', required: true },
      { name: 'previous_events', label: 'Previous Major Events Serviced', type: 'textarea', required: false, placeholder: 'List major events you have previously provided services for' },
      { name: 'products_services', label: 'Products/Services Offered', type: 'textarea', required: true, placeholder: 'Describe the products or services you wish to offer at the tournament' },
      { name: 'staff_count', label: 'Number of Staff to be Deployed', type: 'number', required: true },
      { name: 'space_requirements', label: 'Space/Setup Requirements', type: 'textarea', required: false },
      { name: 'insurance_coverage', label: 'Do you have liability insurance?', type: 'select', required: true, options: ['Yes', 'No', 'Will Obtain'] },
      { name: 'health_certificate', label: 'Health Certificate (for F&B)', type: 'select', required: false, options: ['Yes', 'No', 'Not Applicable'] },
    ]
  },
  media: {
    icon: Camera,
    title: "Media Accreditation",
    description: "Apply for media/press accreditation to cover the Magical Kenya Open 2026",
    fields: [
      { name: 'full_name', label: 'Full Name', type: 'text', required: true },
      { name: 'media_type', label: 'Media Type', type: 'select', required: true, options: [
        'Print Journalist', 'Broadcast Journalist (TV)', 'Broadcast Journalist (Radio)', 
        'Photographer', 'Videographer', 'Online/Digital Media', 'Sports Blogger', 'Freelance'
      ]},
      { name: 'organization', label: 'Media Organization/Outlet', type: 'text', required: true },
      { name: 'job_title', label: 'Job Title/Role', type: 'text', required: true },
      { name: 'email', label: 'Email Address', type: 'email', required: true },
      { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
      { name: 'nationality', label: 'Nationality', type: 'text', required: true },
      { name: 'passport_id', label: 'Passport/ID Number', type: 'text', required: true },
      { name: 'organization_address', label: 'Organization Address', type: 'textarea', required: true },
      { name: 'organization_website', label: 'Organization Website', type: 'text', required: false },
      { name: 'social_media', label: 'Social Media Handles', type: 'text', required: false, placeholder: '@handle or profile URLs' },
      { name: 'coverage_plan', label: 'Coverage Plan', type: 'textarea', required: true, placeholder: 'Describe your planned coverage of the tournament' },
      { name: 'equipment', label: 'Equipment to be Used', type: 'textarea', required: false, placeholder: 'List camera equipment, recording devices, etc.' },
      { name: 'previous_golf_coverage', label: 'Previous Golf Event Coverage', type: 'textarea', required: false, placeholder: 'List golf events you have previously covered' },
      { name: 'accreditation_days', label: 'Days Requiring Accreditation', type: 'select', required: true, options: [
        'All Days (Thu-Sun)', 'Thursday Only', 'Friday Only', 'Saturday Only', 'Sunday Only',
        'Thursday & Friday', 'Saturday & Sunday', 'Practice Days Only'
      ]},
      { name: 'requires_parking', label: 'Parking Required?', type: 'select', required: true, options: ['Yes', 'No'] },
      { name: 'dietary_requirements', label: 'Dietary Requirements', type: 'text', required: false },
    ]
  },
  'pro-am': {
    icon: Trophy,
    title: "Pro-Am Registration",
    description: "Register to participate in the Magical Kenya Open 2026 Pro-Am Tournament",
    fields: [
      { name: 'full_name', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email Address', type: 'email', required: true },
      { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
      { name: 'nationality', label: 'Nationality', type: 'text', required: true },
      { name: 'passport_id', label: 'Passport/ID Number', type: 'text', required: true },
      { name: 'handicap', label: 'Official Golf Handicap', type: 'number', required: true, placeholder: 'Enter your handicap index' },
      { name: 'home_club', label: 'Home Golf Club', type: 'text', required: true },
      { name: 'handicap_certificate', label: 'Can you provide handicap certificate?', type: 'select', required: true, options: ['Yes', 'No'] },
      { name: 'company_name', label: 'Company/Organization Name', type: 'text', required: false },
      { name: 'company_position', label: 'Position/Title', type: 'text', required: false },
      { name: 'playing_experience', label: 'Golf Playing Experience (Years)', type: 'number', required: true },
      { name: 'previous_proams', label: 'Previous Pro-Am Participations', type: 'textarea', required: false, placeholder: 'List Pro-Am events you have participated in' },
      { name: 'preferred_date', label: 'Preferred Pro-Am Date', type: 'select', required: true, options: [
        'Wednesday (Main Pro-Am)', 'Tuesday (Practice Round)', 'Either Day'
      ]},
      { name: 'guest_count', label: 'Number of Guests Attending', type: 'number', required: false },
      { name: 'special_requests', label: 'Special Requests or Requirements', type: 'textarea', required: false },
      { name: 'dietary_requirements', label: 'Dietary Requirements', type: 'text', required: false },
      { name: 'shirt_size', label: 'Polo Shirt Size', type: 'select', required: true, options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
      { name: 'emergency_contact', label: 'Emergency Contact Name', type: 'text', required: true },
      { name: 'emergency_phone', label: 'Emergency Contact Phone', type: 'tel', required: true },
    ]
  },
  procurement: {
    icon: ClipboardList,
    title: "Procurement & Tender Applications",
    description: "Submit your tender or procurement application for the Magical Kenya Open 2026",
    fields: [
      { name: 'company_name', label: 'Company Name', type: 'text', required: true },
      { name: 'tender_category', label: 'Tender Category', type: 'select', required: true, options: [
        'Catering Services', 'Security Services', 'Transportation', 'Event Equipment',
        'Tent & Marquee Rental', 'Furniture Rental', 'Audio Visual Equipment',
        'Waste Management', 'Cleaning Services', 'Medical Services', 
        'Printing & Branding', 'IT & Technology', 'Other'
      ]},
      { name: 'contact_person', label: 'Contact Person', type: 'text', required: true },
      { name: 'designation', label: 'Designation', type: 'text', required: true },
      { name: 'email', label: 'Email Address', type: 'email', required: true },
      { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
      { name: 'physical_address', label: 'Physical Address', type: 'textarea', required: true },
      { name: 'registration_number', label: 'Company Registration Number', type: 'text', required: true },
      { name: 'kra_pin', label: 'KRA PIN', type: 'text', required: true },
      { name: 'year_established', label: 'Year Established', type: 'number', required: true },
      { name: 'annual_turnover', label: 'Annual Turnover (KES)', type: 'select', required: true, options: [
        'Below 1 Million', '1-5 Million', '5-10 Million', '10-50 Million', 'Above 50 Million'
      ]},
      { name: 'employee_count', label: 'Number of Employees', type: 'number', required: true },
      { name: 'company_profile', label: 'Company Profile/Description', type: 'textarea', required: true },
      { name: 'relevant_experience', label: 'Relevant Experience & Past Projects', type: 'textarea', required: true },
      { name: 'certifications', label: 'Certifications & Accreditations', type: 'textarea', required: false },
      { name: 'proposed_solution', label: 'Proposed Solution/Approach', type: 'textarea', required: true, placeholder: 'Describe how you would deliver the required services' },
      { name: 'references', label: 'References (3 minimum)', type: 'textarea', required: true, placeholder: 'Provide contact details of at least 3 references' },
      { name: 'agpo_registered', label: 'AGPO Registered?', type: 'select', required: true, options: ['Yes', 'No'] },
      { name: 'women_youth_pwd', label: 'Women/Youth/PWD Owned?', type: 'select', required: false, options: ['Women Owned', 'Youth Owned', 'PWD Owned', 'Not Applicable'] },
    ]
  },
  jobs: {
    icon: UserPlus,
    title: "Job Applications",
    description: "Apply for employment opportunities at the Magical Kenya Open 2026",
    fields: [
      { name: 'full_name', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email Address', type: 'email', required: true },
      { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
      { name: 'nationality', label: 'Nationality', type: 'text', required: true },
      { name: 'id_number', label: 'National ID/Passport Number', type: 'text', required: true },
      { name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true },
      { name: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
      { name: 'physical_address', label: 'Physical Address', type: 'textarea', required: true },
      { name: 'position_applied', label: 'Position Applied For', type: 'select', required: true, options: [
        'Event Coordinator', 'Guest Services', 'Hospitality Staff', 'Security Personnel',
        'Transportation Coordinator', 'Media Liaison', 'VIP Services', 'Operations Assistant',
        'Registration Desk', 'Merchandise Sales', 'Food & Beverage Service', 'Driver',
        'Medical Staff', 'IT Support', 'General Support Staff', 'Other'
      ]},
      { name: 'employment_type', label: 'Employment Type Preferred', type: 'select', required: true, options: [
        'Full Tournament (All Days)', 'Part-Time', 'Specific Days Only'
      ]},
      { name: 'education_level', label: 'Highest Education Level', type: 'select', required: true, options: [
        'Primary', 'Secondary/High School', 'Certificate', 'Diploma', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD'
      ]},
      { name: 'field_of_study', label: 'Field of Study', type: 'text', required: false },
      { name: 'work_experience', label: 'Relevant Work Experience', type: 'textarea', required: true, placeholder: 'Describe your relevant work experience' },
      { name: 'event_experience', label: 'Previous Event Experience', type: 'textarea', required: false, placeholder: 'List any previous events you have worked at' },
      { name: 'skills', label: 'Key Skills', type: 'textarea', required: true, placeholder: 'List your key skills relevant to the position' },
      { name: 'languages', label: 'Languages Spoken', type: 'text', required: true, placeholder: 'e.g., English, Swahili, French' },
      { name: 'availability', label: 'Availability', type: 'select', required: true, options: [
        'Immediately Available', 'Available from Feb 2026', '1 Week Notice', '2 Weeks Notice', '1 Month Notice'
      ]},
      { name: 'expected_salary', label: 'Expected Daily Rate (KES)', type: 'number', required: false },
      { name: 'has_uniform', label: 'Do you have formal attire/uniform?', type: 'select', required: true, options: ['Yes', 'No'] },
      { name: 'emergency_contact', label: 'Emergency Contact Name', type: 'text', required: true },
      { name: 'emergency_phone', label: 'Emergency Contact Phone', type: 'tel', required: true },
      { name: 'how_heard', label: 'How did you hear about this opportunity?', type: 'select', required: false, options: [
        'Website', 'Social Media', 'Newspaper', 'Friend/Referral', 'Job Board', 'Other'
      ]},
      { name: 'additional_info', label: 'Additional Information', type: 'textarea', required: false },
    ]
  }
};

export default function PublicApplicationPage() {
  const { moduleSlug } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [moduleInfo, setModuleInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [consent, setConsent] = useState(false);

  const config = moduleConfigs[moduleSlug];

  useEffect(() => {
    // Check if module exists and is active
    const checkModule = async () => {
      try {
        const response = await fetch(`${API}/accreditation/modules/public`);
        if (response.ok) {
          const modules = await response.json();
          const module = modules.find(m => m.slug === moduleSlug);
          if (module && module.is_active) {
            setModuleInfo(module);
          }
        }
      } catch (error) {
        console.error('Failed to check module:', error);
      } finally {
        setLoading(false);
      }
    };
    checkModule();
  }, [moduleSlug]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!config) return;

    // Validate required fields
    const missingFields = config.fields
      .filter(f => f.required && !formData[f.name])
      .map(f => f.label);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.slice(0, 3).join(', ')}${missingFields.length > 3 ? '...' : ''}`);
      return;
    }

    if (!consent) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API}/accreditation/apply/${moduleSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_data: formData })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSubmitted(true);
        toast.success('Application submitted successfully!');
      } else {
        toast.error(data.detail || 'Submission failed. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Application Not Found</h2>
            <p className="text-muted-foreground mb-4">The application form you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/')}>Return to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!moduleInfo || !moduleInfo.is_active) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Applications Closed</h2>
            <p className="text-muted-foreground mb-4">
              {config.title} applications are currently not being accepted. Please check back later.
            </p>
            <Button onClick={() => navigate('/')}>Return to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    const Icon = config.icon;
    return (
      <div className="min-h-screen bg-muted" data-testid="application-success">
        <section className="bg-primary text-primary-foreground py-12">
          <div className="container mx-auto px-4 text-center">
            <img src={KOGL_LOGO} alt="KOGL" className="h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold">Application Submitted</h1>
          </div>
        </section>
        
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="text-center">
              <CardContent className="py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Thank You for Your Application!</h2>
                <p className="text-muted-foreground mb-6">
                  Your {config.title.toLowerCase()} application has been submitted successfully. 
                  Our team will review your application and contact you via email with further instructions.
                </p>
                <div className="bg-muted p-4 rounded-lg mb-6">
                  <p className="text-sm">
                    <strong>What happens next?</strong><br />
                    Your application will be reviewed by our team. You will receive an email notification 
                    once a decision has been made. This process typically takes 5-7 business days.
                  </p>
                </div>
                <Button onClick={() => navigate('/')}>Return to Homepage</Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-muted" data-testid={`application-page-${moduleSlug}`}>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src={KOGL_LOGO} alt="KOGL" className="h-14" />
          </div>
          <div className="text-center">
            <Badge className="bg-accent text-accent-foreground mb-4 px-4 py-2">
              MKO 2026
            </Badge>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Icon className="w-8 h-8" />
              <h1 className="text-3xl md:text-4xl font-bold">{config.title}</h1>
            </div>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto">
              {config.description}
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Application Form</CardTitle>
              <CardDescription>
                Please fill in all required fields (*) to submit your application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {config.fields.map((field) => (
                  <div key={field.name}>
                    <Label htmlFor={field.name}>
                      {field.label} {field.required && '*'}
                    </Label>
                    
                    {field.type === 'text' && (
                      <Input
                        id={field.name}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder || ''}
                        required={field.required}
                      />
                    )}
                    
                    {field.type === 'email' && (
                      <Input
                        id={field.name}
                        type="email"
                        value={formData[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder || 'email@example.com'}
                        required={field.required}
                      />
                    )}
                    
                    {field.type === 'tel' && (
                      <Input
                        id={field.name}
                        type="tel"
                        value={formData[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder || '+254 7XX XXX XXX'}
                        required={field.required}
                      />
                    )}
                    
                    {field.type === 'number' && (
                      <Input
                        id={field.name}
                        type="number"
                        value={formData[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder || ''}
                        required={field.required}
                      />
                    )}
                    
                    {field.type === 'date' && (
                      <Input
                        id={field.name}
                        type="date"
                        value={formData[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        required={field.required}
                      />
                    )}
                    
                    {field.type === 'textarea' && (
                      <Textarea
                        id={field.name}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder || ''}
                        required={field.required}
                        rows={3}
                      />
                    )}
                    
                    {field.type === 'select' && (
                      <Select
                        value={formData[field.name] || ''}
                        onValueChange={(value) => handleChange(field.name, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}

                {/* Consent */}
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="consent"
                      checked={consent}
                      onCheckedChange={setConsent}
                      className="mt-1"
                    />
                    <Label htmlFor="consent" className="text-sm cursor-pointer leading-relaxed">
                      I confirm that all information provided is accurate and complete. I understand that 
                      providing false information may result in disqualification. I agree to the terms and 
                      conditions of the Magical Kenya Open 2026 and consent to the processing of my personal 
                      data in accordance with KOGL's privacy policy.
                    </Label>
                  </div>
                </div>

                {/* Submit */}
                <Button 
                  type="submit" 
                  className="w-full h-14"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
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
