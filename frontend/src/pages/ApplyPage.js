import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Briefcase, 
  Camera, 
  Trophy, 
  ClipboardList, 
  UserPlus,
  Users,
  ArrowRight,
  Loader2,
  CheckCircle
} from 'lucide-react';

const KOGL_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/ft1exgdt_KOGL.png";

const moduleIcons = {
  vendors: Briefcase,
  media: Camera,
  'pro-am': Trophy,
  procurement: ClipboardList,
  jobs: UserPlus,
  volunteers: Users
};

const moduleDescriptions = {
  vendors: "Apply for vendor/supplier accreditation to offer products or services at the tournament venue.",
  media: "Request press credentials to cover the tournament as a journalist, photographer, or broadcaster.",
  'pro-am': "Register to participate in the Pro-Am tournament alongside professional golfers.",
  procurement: "Submit your tender or procurement application for tournament services and contracts.",
  jobs: "Apply for temporary employment opportunities during the tournament.",
  volunteers: "Join our volunteer team as a marshal or scorer and be part of this prestigious event."
};

const moduleColors = {
  vendors: "bg-blue-500",
  media: "bg-purple-500",
  'pro-am': "bg-amber-500",
  procurement: "bg-emerald-500",
  jobs: "bg-rose-500",
  volunteers: "bg-teal-500"
};

export default function ApplyPage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch(`${API}/accreditation/modules/public`);
        if (response.ok) {
          const data = await response.json();
          setModules(data);
        }
      } catch (error) {
        console.error('Failed to fetch modules:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, []);

  // Separate volunteers from other modules
  const volunteerModule = modules.find(m => m.slug === 'volunteers');
  const otherModules = modules.filter(m => m.slug !== 'volunteers');

  return (
    <div className="min-h-screen bg-muted" data-testid="apply-page">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-6 mb-6">
            <img src={KOGL_LOGO} alt="KOGL" className="h-16 md:h-20" />
          </div>
          <div className="text-center">
            <Badge className="bg-accent text-accent-foreground mb-4 px-4 py-2">
              MKO 2026
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Apply & Register
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
              Join the Magical Kenya Open 2026 as a vendor, media professional, Pro-Am participant, 
              job applicant, or volunteer. Select your category below to get started.
            </p>
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Main Application Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {otherModules.map((module) => {
                  const Icon = moduleIcons[module.slug] || Briefcase;
                  const description = moduleDescriptions[module.slug] || module.description;
                  const colorClass = moduleColors[module.slug] || "bg-gray-500";
                  const linkTo = module.slug === 'volunteers' ? '/volunteer-register' : `/apply/${module.slug}`;
                  
                  return (
                    <Card 
                      key={module.module_id} 
                      className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                      data-testid={`module-card-${module.slug}`}
                    >
                      <CardHeader className="pb-3">
                        <div className={`w-12 h-12 ${colorClass} rounded-lg flex items-center justify-center mb-3`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-xl">{module.name}</CardTitle>
                        <CardDescription className="text-sm min-h-[60px]">
                          {description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Link to={linkTo}>
                          <Button className="w-full group-hover:bg-primary" data-testid={`apply-btn-${module.slug}`}>
                            Apply Now
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Volunteer Section - Featured */}
              {volunteerModule && (
                <div className="mt-12">
                  <h2 className="text-2xl font-bold text-center mb-6">Volunteer With Us</h2>
                  <Card className="bg-gradient-to-r from-teal-600 to-teal-700 text-white" data-testid="volunteer-card">
                    <CardContent className="py-8">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <Users className="w-10 h-10" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <h3 className="text-2xl font-bold mb-2">Volunteer Registration</h3>
                          <p className="text-white/90 mb-4">
                            Be part of Africa's premier golf tournament! Join our team of dedicated volunteers 
                            as a marshal or scorer. Experience the excitement of the Magical Kenya Open 2026 
                            from the inside.
                          </p>
                          <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5" />
                              <span>150+ Marshals Needed</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5" />
                              <span>60 Scorer Positions</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5" />
                              <span>Feb 19-22, 2026</span>
                            </div>
                          </div>
                        </div>
                        <Link to="/volunteer-register" className="flex-shrink-0">
                          <Button 
                            size="lg" 
                            className="bg-white text-teal-700 hover:bg-white/90"
                            data-testid="apply-btn-volunteers"
                          >
                            Register as Volunteer
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Info Section */}
              <div className="mt-12 text-center">
                <Card className="bg-white/50">
                  <CardContent className="py-8">
                    <h3 className="text-xl font-semibold mb-3">Need Help?</h3>
                    <p className="text-muted-foreground mb-4">
                      If you have questions about the application process or need assistance, 
                      please contact our accreditation team.
                    </p>
                    <Link to="/contact">
                      <Button variant="outline">Contact Us</Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
