import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Trophy,
  CheckCircle2, 
  Loader2,
  Upload,
  FileText,
  X,
  AlertCircle,
  User,
  Phone,
  Building2,
  Target,
  Calendar,
  Utensils,
  Heart
} from 'lucide-react';

const KOGL_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/ft1exgdt_KOGL.png";

const shirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export default function ProAmRegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Personal Details
    full_name: '',
    email: '',
    phone: '',
    nationality: '',
    passport_id: '',
    date_of_birth: '',
    gender: '',
    
    // Golf Details
    handicap: '',
    handicap_type: 'WHS', // World Handicap System
    home_club: '',
    club_membership_number: '',
    playing_experience_years: '',
    
    // Company/Sponsor
    company_name: '',
    company_position: '',
    
    // Pro-Am Specific
    preferred_date: 'wednesday',
    previous_proams: '',
    guest_count: '0',
    guest_names: '',
    
    // Requirements
    dietary_requirements: '',
    special_requests: '',
    shirt_size: '',
    
    // Emergency Contact
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    
    // Payment
    payment_method: '',
    
    // Consent
    terms_accepted: false,
    data_consent: false,
    photo_consent: false
  });

  const [documents, setDocuments] = useState({
    handicap_certificate: null,
    id_document: null,
    payment_proof: null
  });

  const [uploading, setUploading] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);
  const [handicapError, setHandicapError] = useState('');

  const fileInputRefs = {
    handicap_certificate: useRef(null),
    id_document: useRef(null),
    payment_proof: useRef(null)
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate handicap in real-time
    if (field === 'handicap') {
      const handicap = parseFloat(value);
      const gender = formData.gender;
      if (!isNaN(handicap)) {
        if (gender === 'male' && handicap > 24.0) {
          setHandicapError('Men\'s handicap must be 24.0 or lower');
        } else if (gender === 'female' && handicap > 32.0) {
          setHandicapError('Ladies\' handicap must be 32.0 or lower');
        } else {
          setHandicapError('');
        }
      }
    }
    
    if (field === 'gender') {
      // Re-validate handicap when gender changes
      const handicap = parseFloat(formData.handicap);
      if (!isNaN(handicap)) {
        if (value === 'male' && handicap > 24.0) {
          setHandicapError('Men\'s handicap must be 24.0 or lower');
        } else if (value === 'female' && handicap > 32.0) {
          setHandicapError('Ladies\' handicap must be 32.0 or lower');
        } else {
          setHandicapError('');
        }
      }
    }
  };

  const handleFileSelect = async (docType, file) => {
    if (!file) return;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, or PDF files are allowed');
      return;
    }

    setUploading(prev => ({ ...prev, [docType]: true }));

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('document_type', docType);

      const response = await fetch(`${API}/pro-am/upload-document`, {
        method: 'POST',
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(prev => ({ ...prev, [docType]: { name: file.name, url: data.file_url, id: data.file_id } }));
        toast.success(`${docType.replace('_', ' ')} uploaded successfully`);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setUploading(prev => ({ ...prev, [docType]: false }));
    }
  };

  const removeDocument = (docType) => {
    setDocuments(prev => ({ ...prev, [docType]: null }));
    if (fileInputRefs[docType]?.current) {
      fileInputRefs[docType].current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const requiredFields = [
      'full_name', 'email', 'phone', 'nationality', 'passport_id', 'gender',
      'handicap', 'home_club', 'shirt_size',
      'emergency_contact_name', 'emergency_contact_phone'
    ];

    const missingFields = requiredFields.filter(f => !formData[f]);
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Handicap validation
    if (handicapError) {
      toast.error(handicapError);
      return;
    }

    // Document validation
    if (!documents.handicap_certificate) {
      toast.error('Please upload your handicap certificate');
      return;
    }

    if (!documents.id_document) {
      toast.error('Please upload your ID/Passport');
      return;
    }

    // Consent validation
    if (!formData.terms_accepted) {
      toast.error('Please accept the Terms of Competition');
      return;
    }

    if (!formData.data_consent) {
      toast.error('Please accept the data protection consent');
      return;
    }

    setSubmitting(true);

    try {
      const submitData = {
        ...formData,
        handicap: parseFloat(formData.handicap),
        guest_count: parseInt(formData.guest_count) || 0,
        playing_experience_years: parseInt(formData.playing_experience_years) || 0,
        documents: {
          handicap_certificate: documents.handicap_certificate?.id,
          id_document: documents.id_document?.id,
          payment_proof: documents.payment_proof?.id
        }
      };

      const response = await fetch(`${API}/pro-am/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (response.ok) {
        setRegistrationId(data.registration_id);
        setSubmitted(true);
        toast.success('Registration submitted successfully!');
      } else {
        toast.error(data.detail || 'Registration failed');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-muted" data-testid="proam-register-success">
        <section className="bg-primary text-primary-foreground py-12">
          <div className="container mx-auto px-4 text-center">
            <img src={KOGL_LOGO} alt="KOGL" className="h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold">Registration Submitted</h1>
          </div>
        </section>
        
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="text-center">
              <CardContent className="py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Thank You for Registering!</h2>
                <p className="text-muted-foreground mb-6">
                  Your Pro-Am registration has been submitted successfully.
                </p>
                
                <div className="bg-muted p-4 rounded-lg mb-6 text-left">
                  <p className="font-semibold mb-2">Registration ID: {registrationId}</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Please save this ID for your records.
                  </p>
                  
                  <h4 className="font-semibold mb-2">Next Steps:</h4>
                  <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
                    <li>Our team will review your registration and documents</li>
                    <li>You will receive a confirmation email within 3-5 business days</li>
                    <li>If approved, payment instructions will be sent to your email</li>
                    <li>Your spot is confirmed once payment is received</li>
                  </ol>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6 text-left">
                  <p className="text-sm text-amber-800">
                    <strong>Entry Fee:</strong> KES 30,000 per player<br />
                    Payment details will be provided in your confirmation email.
                  </p>
                </div>

                <Button onClick={() => navigate('/pro-am')}>
                  Return to Pro-Am Page
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted" data-testid="proam-register-page">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src={KOGL_LOGO} alt="KOGL" className="h-14" />
          </div>
          <div className="text-center">
            <Badge className="bg-accent text-accent-foreground mb-4 px-4 py-2">
              <Trophy className="w-4 h-4 mr-2" />
              MKO 2026
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Pro-Am Registration</h1>
            <p className="text-primary-foreground/80">
              Entry Fee: KES 30,000 per player
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="full_name">Full Name (as on ID) *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
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
                  />
                </div>
                <div>
                  <Label htmlFor="nationality">Nationality *</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => handleChange('nationality', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="passport_id">Passport/ID Number *</Label>
                  <Input
                    id="passport_id"
                    value={formData.passport_id}
                    onChange={(e) => handleChange('passport_id', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Gender *</Label>
                  <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Golf Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Golf Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="handicap">Handicap Index *</Label>
                  <Input
                    id="handicap"
                    type="number"
                    step="0.1"
                    value={formData.handicap}
                    onChange={(e) => handleChange('handicap', e.target.value)}
                    placeholder="e.g., 12.5"
                    required
                    className={handicapError ? 'border-red-500' : ''}
                  />
                  {handicapError && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {handicapError}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Max: Men 24.0 | Ladies 32.0
                  </p>
                </div>
                <div>
                  <Label htmlFor="home_club">Home Golf Club *</Label>
                  <Input
                    id="home_club"
                    value={formData.home_club}
                    onChange={(e) => handleChange('home_club', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="club_membership_number">Club Membership Number</Label>
                  <Input
                    id="club_membership_number"
                    value={formData.club_membership_number}
                    onChange={(e) => handleChange('club_membership_number', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="playing_experience_years">Years Playing Golf</Label>
                  <Input
                    id="playing_experience_years"
                    type="number"
                    value={formData.playing_experience_years}
                    onChange={(e) => handleChange('playing_experience_years', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="previous_proams">Previous Pro-Am Experience</Label>
                  <Textarea
                    id="previous_proams"
                    value={formData.previous_proams}
                    onChange={(e) => handleChange('previous_proams', e.target.value)}
                    placeholder="List any Pro-Am events you have participated in"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Company/Sponsor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company / Sponsor (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company/Organization Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="company_position">Position/Title</Label>
                  <Input
                    id="company_position"
                    value={formData.company_position}
                    onChange={(e) => handleChange('company_position', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pro-Am Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Pro-Am Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Preferred Pro-Am Date</Label>
                  <Select value={formData.preferred_date} onValueChange={(v) => handleChange('preferred_date', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wednesday">Wednesday (Main Pro-Am)</SelectItem>
                      <SelectItem value="tuesday">Tuesday (Practice Round)</SelectItem>
                      <SelectItem value="either">Either Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="shirt_size">Polo Shirt Size *</Label>
                  <Select value={formData.shirt_size} onValueChange={(v) => handleChange('shirt_size', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {shirtSizes.map(size => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="guest_count">Number of Guests</Label>
                  <Input
                    id="guest_count"
                    type="number"
                    min="0"
                    max="4"
                    value={formData.guest_count}
                    onChange={(e) => handleChange('guest_count', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="guest_names">Guest Names (if any)</Label>
                  <Input
                    id="guest_names"
                    value={formData.guest_names}
                    onChange={(e) => handleChange('guest_names', e.target.value)}
                    placeholder="Separate names with commas"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Special Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="w-5 h-5" />
                  Special Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="dietary_requirements">Dietary Requirements</Label>
                  <Input
                    id="dietary_requirements"
                    value={formData.dietary_requirements}
                    onChange={(e) => handleChange('dietary_requirements', e.target.value)}
                    placeholder="e.g., Vegetarian, Halal, Allergies"
                  />
                </div>
                <div>
                  <Label htmlFor="special_requests">Special Requests or Accommodations</Label>
                  <Textarea
                    id="special_requests"
                    value={formData.special_requests}
                    onChange={(e) => handleChange('special_requests', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="emergency_contact_name">Contact Name *</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_contact_phone">Contact Phone *</Label>
                  <Input
                    id="emergency_contact_phone"
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_contact_relation">Relationship</Label>
                  <Input
                    id="emergency_contact_relation"
                    value={formData.emergency_contact_relation}
                    onChange={(e) => handleChange('emergency_contact_relation', e.target.value)}
                    placeholder="e.g., Spouse, Parent"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Document Uploads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Required Documents
                </CardTitle>
                <CardDescription>
                  Upload your documents (JPEG, PNG, or PDF, max 5MB each)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Handicap Certificate */}
                <div>
                  <Label className="flex items-center gap-2">
                    Handicap Certificate *
                    {documents.handicap_certificate && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </Label>
                  {documents.handicap_certificate ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mt-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="flex-1 text-sm truncate">{documents.handicap_certificate.name}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeDocument('handicap_certificate')}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRefs.handicap_certificate.current?.click()}
                    >
                      {uploading.handicap_certificate ? (
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Click to upload handicap certificate</p>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRefs.handicap_certificate}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect('handicap_certificate', e.target.files?.[0])}
                  />
                </div>

                {/* ID Document */}
                <div>
                  <Label className="flex items-center gap-2">
                    ID / Passport Copy *
                    {documents.id_document && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </Label>
                  {documents.id_document ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mt-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="flex-1 text-sm truncate">{documents.id_document.name}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeDocument('id_document')}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRefs.id_document.current?.click()}
                    >
                      {uploading.id_document ? (
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Click to upload ID or Passport</p>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRefs.id_document}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect('id_document', e.target.files?.[0])}
                  />
                </div>

                {/* Payment Proof (Optional) */}
                <div>
                  <Label className="flex items-center gap-2">
                    Payment Proof (Optional)
                    {documents.payment_proof && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    You can upload payment proof now or after receiving payment instructions
                  </p>
                  {documents.payment_proof ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="flex-1 text-sm truncate">{documents.payment_proof.name}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeDocument('payment_proof')}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRefs.payment_proof.current?.click()}
                    >
                      {uploading.payment_proof ? (
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Click to upload payment proof</p>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRefs.payment_proof}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect('payment_proof', e.target.files?.[0])}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Consent */}
            <Card>
              <CardHeader>
                <CardTitle>Terms & Consent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <Checkbox
                    id="terms_accepted"
                    checked={formData.terms_accepted}
                    onCheckedChange={(checked) => handleChange('terms_accepted', checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="terms_accepted" className="text-sm leading-relaxed cursor-pointer">
                    I have read and accept the <a href="/pro-am" target="_blank" className="text-primary underline">Terms of Competition</a>. 
                    I confirm that I am an amateur golfer and my handicap is within the eligibility limits. *
                  </Label>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <Checkbox
                    id="data_consent"
                    checked={formData.data_consent}
                    onCheckedChange={(checked) => handleChange('data_consent', checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="data_consent" className="text-sm leading-relaxed cursor-pointer">
                    I consent to KOGL processing my personal data for the purpose of administering this event 
                    and contacting me regarding tournament matters. *
                  </Label>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <Checkbox
                    id="photo_consent"
                    checked={formData.photo_consent}
                    onCheckedChange={(checked) => handleChange('photo_consent', checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="photo_consent" className="text-sm leading-relaxed cursor-pointer">
                    I consent to being photographed/filmed during the event and for these images to be used 
                    for promotional purposes by KOGL and the Magical Kenya Open.
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Button 
              type="submit" 
              className="w-full h-14 text-lg"
              disabled={submitting || handicapError}
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
        </div>
      </section>
    </div>
  );
}
