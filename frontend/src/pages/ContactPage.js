import React, { useState } from 'react';
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
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Facebook,
  Twitter,
  Instagram,
  Youtube
} from 'lucide-react';

const contactInfo = [
  {
    icon: Mail,
    title: 'Email',
    content: 'info@magicalkenyaopen.com',
    href: 'mailto:info@magicalkenyaopen.com'
  },
  {
    icon: Phone,
    title: 'Phone',
    content: '+254 20 xxx xxxx',
    href: 'tel:+254200000000'
  },
  {
    icon: MapPin,
    title: 'Address',
    content: 'Nairobi, Kenya',
    href: null
  },
  {
    icon: Clock,
    title: 'Office Hours',
    content: 'Mon - Fri: 9:00 AM - 5:00 PM EAT',
    href: null
  }
];

const socialLinks = [
  { icon: Facebook, name: 'Facebook', href: 'https://facebook.com' },
  { icon: Twitter, name: 'Twitter', href: 'https://twitter.com' },
  { icon: Instagram, name: 'Instagram', href: 'https://instagram.com' },
  { icon: Youtube, name: 'YouTube', href: 'https://youtube.com' }
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`${API}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Message sent successfully! We\'ll get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-testid="contact-page">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container-custom">
          <Badge className="bg-accent text-accent-foreground mb-4 px-4 py-2">
            Get In Touch
          </Badge>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Contact Us
          </h1>
          <p className="text-primary-foreground/80 text-lg font-body max-w-2xl">
            Have questions about the Magical Kenya Open? We're here to help.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-spacing">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="card-default" data-testid="contact-form">
              <CardHeader>
                <CardTitle className="font-heading text-2xl">Send us a Message</CardTitle>
                <CardDescription className="font-body">
                  Fill in the form below and we'll get back to you shortly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        data-testid="contact-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        data-testid="contact-email"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Select 
                      value={formData.subject}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                    >
                      <SelectTrigger data-testid="contact-subject">
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Enquiry</SelectItem>
                        <SelectItem value="tickets">Tickets & Hospitality</SelectItem>
                        <SelectItem value="media">Media & Press</SelectItem>
                        <SelectItem value="sponsorship">Sponsorship</SelectItem>
                        <SelectItem value="volunteer">Volunteering</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      required
                      rows={6}
                      data-testid="contact-message"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full btn-primary h-12"
                    disabled={submitting}
                    data-testid="contact-submit"
                  >
                    {submitting ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div>
              <h2 className="font-heading text-2xl font-bold mb-6">Contact Information</h2>
              
              <div className="space-y-4 mb-8">
                {contactInfo.map((info, i) => (
                  <Card key={i} className="card-default" data-testid={`contact-info-${i}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 flex items-center justify-center">
                        <info.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{info.title}</p>
                        {info.href ? (
                          <a 
                            href={info.href} 
                            className="font-body font-medium hover:text-primary transition-colors"
                          >
                            {info.content}
                          </a>
                        ) : (
                          <p className="font-body font-medium">{info.content}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Social Links */}
              <h3 className="font-subheading font-semibold uppercase tracking-wider text-sm mb-4">
                Follow Us
              </h3>
              <div className="flex gap-3">
                {socialLinks.map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                    data-testid={`social-${social.name.toLowerCase()}`}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>

              {/* Quick Contact */}
              <Card className="card-feature mt-8">
                <CardContent className="p-6">
                  <h3 className="font-heading text-xl font-bold text-white mb-4">
                    Need Immediate Assistance?
                  </h3>
                  <p className="text-primary-foreground/80 font-body text-sm mb-4">
                    For urgent matters during the tournament, please contact our operations team.
                  </p>
                  <p className="text-white font-body font-medium">
                    Tournament Hotline: +254 xxx xxx xxx
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="bg-muted py-16">
        <div className="container-custom">
          <h2 className="font-heading text-2xl font-bold mb-8 text-center">Tournament Venue</h2>
          <Card className="card-default overflow-hidden">
            <div className="aspect-[16/6] bg-primary/10 flex items-center justify-center">
              <div className="text-center p-8">
                <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-heading text-xl font-bold mb-2">Karen Country Club</h3>
                <p className="text-muted-foreground font-body">
                  Karen Road, Nairobi, Kenya
                </p>
                <a 
                  href="https://maps.google.com/?q=Karen+Country+Club+Nairobi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4"
                >
                  <Button variant="outline" size="sm">
                    View on Google Maps
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
