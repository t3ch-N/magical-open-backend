import React, { useState, useEffect } from 'react';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { toast } from 'sonner';
import { 
  Ticket,
  Crown,
  Users,
  Star,
  Check,
  ArrowRight,
  Mail
} from 'lucide-react';

const HOSPITALITY_BG = "https://images.pexels.com/photos/1766957/pexels-photo-1766957.jpeg";

// HustleSasa ticket links - Kenya Open specific event URL
const HUSTLESASA_BASE_URL = "http://kenyaopen.hustlesasa.shop/";
const HUSTLESASA_TICKETS = {
  'daily-thu-fri': HUSTLESASA_BASE_URL,
  'daily-sat-sun': HUSTLESASA_BASE_URL,
  'season-ticket': HUSTLESASA_BASE_URL,
};

const defaultPackages = [
  {
    package_id: 'day-1-thursday',
    name: 'Day 1 - Thursday Pass',
    description: 'Opening Round - Experience the excitement as the tournament begins.',
    price_range: 'KES 1,000',
    price: 1000,
    category: 'daily',
    can_buy_online: true,
    features: [
      'Single day tournament access',
      'Opening Round action',
      'General viewing areas',
      'Food & beverage outlets',
      'Official merchandise shop'
    ],
    image_url: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/1lactcxo_MKO2026%20-%20Day%201%20Pass%20Visual%20%28Hustlesasa%29.png'
  },
  {
    package_id: 'day-2-friday',
    name: 'Day 2 - Friday Pass',
    description: 'Cut Day - Watch as players battle to make the weekend rounds.',
    price_range: 'KES 1,500',
    price: 1500,
    category: 'daily',
    can_buy_online: true,
    features: [
      'Single day tournament access',
      'Cut Day drama',
      'General viewing areas',
      'Food & beverage outlets',
      'Official merchandise shop'
    ],
    image_url: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/ahh2didl_MKO2026%20-%20Day%202%20Pass%20Visual%20%28Hustlesasa%29.png'
  },
  {
    package_id: 'day-3-saturday',
    name: 'Day 3 - Saturday Pass',
    description: 'Moving Day - The leaderboard takes shape as contenders make their move.',
    price_range: 'KES 2,500',
    price: 2500,
    category: 'daily',
    can_buy_online: true,
    features: [
      'Single day tournament access',
      'Moving Day excitement',
      'General viewing areas',
      'Food & beverage outlets',
      'Official merchandise shop'
    ],
    image_url: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/xadj7hrh_MKO2026%20-%20Day%203%20Pass%20Visual%20%28Hustlesasa%29.png'
  },
  {
    package_id: 'day-4-sunday',
    name: 'Day 4 - Sunday Pass',
    description: 'Final Round - Witness the crowning of the 2026 champion.',
    price_range: 'KES 2,500',
    price: 2500,
    category: 'daily',
    can_buy_online: true,
    features: [
      'Single day tournament access',
      'Final Round drama',
      'General viewing areas',
      'Trophy presentation access',
      'Official merchandise shop'
    ],
    image_url: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/yhbzq8dm_MKO2026%20-%20Day%204%20Pass%20Visual%20%28Hustlesasa%29.png'
  },
  {
    package_id: 'season-ticket',
    name: 'Season Pass',
    description: 'Best value! Full access for all four days of the tournament.',
    price_range: 'KES 6,000',
    price: 6000,
    category: 'weekly',
    is_best_deal: true,
    can_buy_online: true,
    features: [
      'All 4 days tournament access',
      'Priority entry lanes',
      'Reserved viewing areas',
      'Tournament program included',
      'Food & beverage discounts',
      'Exclusive merchandise offers'
    ],
    image_url: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/9og5qbik_MKO2026%20-%20Season%20Pass%20Visual%20%28Hustlesasa%29.png'
  },
];

export default function TicketsPage() {
  const [packages, setPackages] = useState(defaultPackages);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    enquiry_type: 'tickets',
    package_id: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [buyingPackage, setBuyingPackage] = useState(null);

  useEffect(() => {
    fetch(`${API}/tickets/packages`)
      .then(r => r.json())
      .then(data => {
        if (data.length > 0) setPackages(data);
      })
      .catch(() => {});
  }, []);

  const handleBuyTicket = (pkg) => {
    setBuyingPackage(pkg);
    setBuyModalOpen(true);
  };

  const handleEnquiry = (pkg) => {
    setSelectedPackage(pkg);
    setFormData(prev => ({
      ...prev,
      package_id: pkg?.package_id || '',
      enquiry_type: pkg?.category === 'hospitality' ? 'hospitality' : 'tickets'
    }));
    setEnquiryOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`${API}/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Enquiry submitted successfully! We\'ll be in touch soon.');
        setEnquiryOpen(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          enquiry_type: 'tickets',
          package_id: '',
          message: ''
        });
      } else {
        toast.error('Failed to submit enquiry. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to submit enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'hospitality': return Crown;
      case 'weekly': return Users;
      default: return Ticket;
    }
  };

  const dailyPackages = packages.filter(p => p.category === 'daily');
  const weeklyPackages = packages.filter(p => p.category === 'weekly');
  const hospitalityPackages = packages.filter(p => p.category === 'hospitality');

  return (
    <div data-testid="tickets-page">
      {/* Hero - Compact */}
      <section className="relative h-[35vh] min-h-[280px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HOSPITALITY_BG} alt="Hospitality" className="w-full h-full object-cover object-top" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative z-10 container-custom text-center">
          <Badge className="bg-[#D50032] text-white mb-3 px-4 py-2 font-bold">
            Tickets Available
          </Badge>
          <h1 className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-3">
            Tickets & Hospitality
          </h1>
          <p className="text-white/90 text-base md:text-lg font-body max-w-2xl mx-auto">
            Experience the Magical Kenya Open with our range of ticket options.
          </p>
        </div>
      </section>

      {/* Ticket Options */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {/* Daily & Weekly Passes - Horizontal Layout */}
          <div className="mb-12">
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-2 text-[#373A36]">General Admission</h2>
            <p className="text-muted-foreground font-body mb-8 text-base">
              Daily passes and season ticket options
            </p>
            
            <div className="space-y-4 max-w-4xl mx-auto">
              {[...dailyPackages, ...weeklyPackages].map((pkg) => {
                const Icon = getCategoryIcon(pkg.category);
                return (
                  <Card key={pkg.package_id} className={`card-default overflow-hidden group ${pkg.is_best_deal ? 'ring-2 ring-[#D50032]' : ''}`} data-testid={`package-${pkg.package_id}`}>
                    <div className="grid grid-cols-1 md:grid-cols-5 h-full">
                      {/* Image on Left - Takes 2 columns */}
                      <div className="md:col-span-2 h-36 md:h-40 overflow-hidden">
                        <img 
                          src={pkg.image_url} 
                          alt={pkg.name}
                          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      {/* Details on Right - Takes 3 columns */}
                      <CardContent className="md:col-span-3 p-4 md:p-5 flex flex-col justify-center">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="border-[#D50032] text-[#D50032] text-xs">
                                {pkg.is_best_deal ? 'Season Pass' : 'Daily Pass'}
                              </Badge>
                              {pkg.is_best_deal && (
                                <Badge className="bg-[#D50032] text-white text-xs">BEST DEAL</Badge>
                              )}
                            </div>
                            <h3 className="font-heading text-lg md:text-xl font-bold text-[#373A36]">{pkg.name}</h3>
                          </div>
                          <Icon className="w-5 h-5 text-[#D50032] hidden md:block" />
                        </div>
                        <p className="text-muted-foreground font-body text-sm mb-3 line-clamp-2">
                          {pkg.description}
                        </p>
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <div className="font-subheading text-lg font-bold text-[#D50032]">
                            {pkg.price_range}
                          </div>
                          <Button 
                            onClick={() => handleBuyTicket(pkg)}
                            className="btn-cta text-sm px-4 py-2"
                            data-testid={`buy-${pkg.package_id}`}
                          >
                            <Ticket className="w-3.5 h-3.5 mr-1.5" />
                            Buy Now
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* JGF Card Holders - Special Access Section */}
          <div className="mb-12 max-w-4xl mx-auto">
            <Card className="card-default overflow-hidden border-2 border-dashed border-[#D50032]/40 bg-[#D50032]/5" data-testid="jgf-free-entry">
              <CardContent className="p-6 md:p-8 text-center">
                <div className="w-14 h-14 bg-[#D50032]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-7 h-7 text-[#D50032]" />
                </div>
                <Badge className="bg-[#D50032] text-white mb-3">FREE ENTRY</Badge>
                <h3 className="font-heading text-xl md:text-2xl font-bold text-[#373A36] mb-2">
                  JGF Card Holders
                </h3>
                <p className="text-muted-foreground font-body text-base mb-4 max-w-md mx-auto">
                  Junior Golf Foundation members enjoy complimentary access to all four days.
                </p>
                <div className="flex flex-wrap justify-center gap-3 mb-4">
                  <div className="flex items-center gap-1.5 text-sm font-body">
                    <Check className="w-4 h-4 text-[#D50032]" />
                    Valid JGF card required
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-body">
                    <Check className="w-4 h-4 text-[#D50032]" />
                    All 4 days access
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-body">
                    <Check className="w-4 h-4 text-[#D50032]" />
                    Present card at gate
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Supporting youth golf development in Kenya
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section - Compact */}
      <section className="bg-[#373A36] text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-3">
            Need Help Choosing?
          </h2>
          <p className="text-white/80 font-body mb-6 max-w-xl mx-auto text-base">
            Our team is here to help you find the perfect ticket package.
          </p>
          <Button 
            onClick={() => handleEnquiry(null)}
            variant="outline"
            className="border-2 border-white text-white hover:bg-white hover:text-[#373A36] h-12 px-8 uppercase tracking-wider font-bold"
            data-testid="general-enquiry-btn"
          >
            <Mail className="w-4 h-4 mr-2" />
            Contact Our Team
          </Button>
        </div>
      </section>

      {/* Enquiry Dialog */}
      <Dialog open={enquiryOpen} onOpenChange={setEnquiryOpen}>
        <DialogContent className="max-w-md" data-testid="enquiry-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {selectedPackage ? `Enquire About ${selectedPackage.name}` : 'General Enquiry'}
            </DialogTitle>
            <DialogDescription className="font-body">
              Fill in your details and we&apos;ll get back to you shortly.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                data-testid="enquiry-name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                data-testid="enquiry-email"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                data-testid="enquiry-phone"
              />
            </div>
            <div>
              <Label htmlFor="enquiry_type">Enquiry Type</Label>
              <Select 
                value={formData.enquiry_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, enquiry_type: value }))}
              >
                <SelectTrigger data-testid="enquiry-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tickets">Tickets</SelectItem>
                  <SelectItem value="hospitality">Hospitality</SelectItem>
                  <SelectItem value="general">General</SelectItem>
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
                rows={4}
                data-testid="enquiry-message"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full btn-primary"
              disabled={submitting}
              data-testid="enquiry-submit"
            >
              {submitting ? 'Submitting...' : 'Submit Enquiry'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Buy Ticket Modal - HustleSasa Integration */}
      <Dialog open={buyModalOpen} onOpenChange={setBuyModalOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          {buyingPackage && (
            <>
              {/* Ticket Image */}
              <div className="w-full h-48 overflow-hidden">
                <img 
                  src={buyingPackage.image_url} 
                  alt={buyingPackage.name}
                  className="w-full h-full object-cover object-center"
                />
              </div>
              
              <div className="p-4">
                <div className="space-y-3">
                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold">{buyingPackage.name}</h3>
                    <p className="text-xl font-bold text-[#D50032]">{buyingPackage.price_range}</p>
                  </div>

                  {/* Payment Info - Compact */}
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Secure payment via M-Pesa or card. E-ticket sent to email.
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setBuyModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1 bg-[#D50032] hover:bg-[#D50032]/90"
                      onClick={() => {
                        const ticketUrl = HUSTLESASA_TICKETS[buyingPackage.package_id] || HUSTLESASA_BASE_URL;
                        window.open(ticketUrl, '_blank', 'noopener,noreferrer');
                        toast.success('Opening secure checkout...');
                        setBuyModalOpen(false);
                      }}
                      data-testid="proceed-payment"
                    >
                      <Ticket className="w-4 h-4 mr-2" />
                      Buy Now
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
