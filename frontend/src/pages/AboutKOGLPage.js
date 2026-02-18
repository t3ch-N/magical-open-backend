import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { API } from '../App';
import { 
  Building2,
  Target,
  Users,
  Globe,
  Award,
  Mail,
  FileText,
  Shield,
  Scale,
  BookOpen,
  Briefcase,
  ChevronRight,
  Download,
  ExternalLink
} from 'lucide-react';

const KOGL_BG = "https://images.pexels.com/photos/1325744/pexels-photo-1325744.jpeg";
const KOGL_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/ft1exgdt_KOGL.png";

// Board Members with photos
const boardMembers = [
  { 
    name: 'Patrick Obath', 
    role: 'Chairman', 
    bio: 'Leading the strategic direction of KOGL with extensive experience in sports administration and business leadership.',
    image: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/griywsas_ptrcik%20obath.jpg'
  },
  { 
    name: 'Lucas Maranga', 
    role: 'Tournament Director', 
    bio: 'Overseeing tournament operations and ensuring world-class delivery of the Magical Kenya Open.',
    image: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/xt421cfd_lucasmaranga.jpg'
  },
  { 
    name: 'Francis Okwara', 
    role: 'Tournament Director - Safari Tour', 
    bio: 'Managing the Safari Tour circuit and regional golf development initiatives.',
    image: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/gv47en1e_francis%20okwara.jpeg'
  },
  { 
    name: 'Collins Ojiambo', 
    role: 'Technology & Innovation Director', 
    bio: 'Driving digital transformation and technology integration across tournament operations.',
    image: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/eehs3dfr_collins.jpg'
  },
  { 
    name: 'Ronald Meru', 
    role: 'Commercial Director', 
    bio: 'Responsible for commercial partnerships, sponsorships, and revenue generation.',
    image: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/3a1adffw_Ronald%20meru.jpg'
  },
  { 
    name: 'Zuhura Odhiamba', 
    role: 'PR & Marketing', 
    bio: 'Managing public relations, communications, and marketing strategies.',
    image: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/yzs3uiq8_zuhura.jpg'
  },
  { 
    name: 'Regina Gachora', 
    role: 'Hospitality & Liaison', 
    bio: 'Coordinating hospitality services and stakeholder relations.',
    image: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/ljwqc7bo_regina%20Gachora.jpg'
  },
  { 
    name: 'Peter Mungai', 
    role: 'Finance Director', 
    bio: 'Overseeing financial management, budgeting, and fiscal accountability for KOGL operations.',
    image: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/izvnvsi1_peter%20mungai.jpg'
  },
  { 
    name: 'Faith Kanaga', 
    role: 'Legal Director', 
    bio: 'Managing legal affairs, contracts, and regulatory compliance for the organization.',
    image: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/emueub5g_faith%20kanaga.jpg'
  },
  { 
    name: 'Chris Kinuthia', 
    role: 'Chairman - KGU', 
    bio: 'Representing the Kenya Golf Union and ensuring alignment with national golf development.',
    image: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/hnidy6j9_chris%20kinuthia.jpg'
  },
  { 
    name: 'Brian Akun', 
    role: 'Vice Chairman - KGU', 
    bio: 'Supporting KGU initiatives and promoting amateur golf in Kenya.',
    image: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/xqxqo29k_Biran%20akun.jpg'
  }
];

// Governance Structure
const governanceStructure = [
  {
    title: 'Board of Directors',
    description: 'The Board provides strategic oversight, ensuring KOGL operates with integrity and achieves its mission of promoting golf in Kenya.',
    icon: Users
  },
  {
    title: 'Tournament Committee',
    description: 'Responsible for the planning, execution, and delivery of the Magical Kenya Open to world-class standards.',
    icon: Award
  },
  {
    title: 'Finance & Audit Committee',
    description: 'Ensures financial transparency, compliance, and responsible stewardship of resources.',
    icon: Scale
  },
  {
    title: 'Marketing Committee',
    description: 'Manages brand positioning, sponsorship acquisition, and promotional activities.',
    icon: Globe
  }
];

// Policies
const policies = [
  {
    title: 'Code of Conduct',
    description: 'Standards of behavior expected from all stakeholders, officials, and participants.',
    icon: Shield
  },
  {
    title: 'Anti-Doping Policy',
    description: 'Commitment to clean sport in accordance with WADA and DP World Tour regulations.',
    icon: FileText
  },
  {
    title: 'Safeguarding Policy',
    description: 'Protection of children and vulnerable adults in all KOGL activities.',
    icon: Users
  },
  {
    title: 'Environmental Policy',
    description: 'Commitment to sustainable practices and environmental responsibility.',
    icon: Globe
  },
  {
    title: 'Diversity & Inclusion Policy',
    description: 'Promoting equal opportunity and diversity in all aspects of operations.',
    icon: Award
  },
  {
    title: 'Privacy Policy',
    description: 'How we collect, use, and protect personal data.',
    icon: Shield
  }
];

// Partners
const partners = [
  'DP World Tour',
  'Magical Kenya',
  'Kenya Tourism Board',
  'Professional Golfers of Kenya',
  'Kenya Golf Union'
];

export default function AboutKOGLPage() {
  const [uploadedPolicies, setUploadedPolicies] = useState([]);

  useEffect(() => {
    // Fetch uploaded policies from API
    fetch(`${API}/policies`)
      .then(r => r.json())
      .then(data => setUploadedPolicies(data))
      .catch(() => setUploadedPolicies([]));
  }, []);

  // Combine default policies with uploaded ones
  const allPolicies = uploadedPolicies.length > 0 
    ? uploadedPolicies.map(p => ({
        ...p,
        icon: p.category === 'governance' ? Scale : 
              p.category === 'compliance' ? Shield : 
              p.category === 'conduct' ? Users : FileText
      }))
    : policies;

  return (
    <div data-testid="about-kogl-page">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${KOGL_BG})` }}
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative z-10 container-custom text-center">
          <Badge className="bg-accent text-accent-foreground mb-4 px-4 py-2">
            The Organization
          </Badge>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-4">
            Kenya Open Golf Limited
          </h1>
          <p className="text-white/80 text-lg font-body max-w-2xl mx-auto">
            Delivering excellence in golf tournament management since 1967
          </p>
        </div>
      </section>

      {/* About */}
      <section className="section-spacing">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* KOGL Logo */}
              <img 
                src={KOGL_LOGO} 
                alt="Kenya Open Golf Limited" 
                className="h-24 md:h-32 w-auto object-contain mb-8"
              />
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
                About KOGL
              </h2>
              <div className="prose prose-lg font-body text-muted-foreground">
                <p className="mb-4">
                  Kenya Open Golf Limited (KOGL) is the organization responsible for staging 
                  the Magical Kenya Open, one of Africa's most prestigious golf tournaments 
                  and a proud member of the DP World Tour.
                </p>
                <p className="mb-4">
                  Founded with the mission to elevate Kenyan golf to international standards, 
                  KOGL works in close partnership with the DP World Tour, Kenya Tourism Board, 
                  and various stakeholders to deliver a world-class tournament experience.
                </p>
                <p>
                  Beyond organizing the annual tournament, KOGL is committed to developing 
                  golf at all levels in Kenya, from grassroots junior programs to professional 
                  player development initiatives.
                </p>
              </div>
            </div>
            <div>
              <Card className="card-feature">
                <CardContent className="p-8">
                  <Building2 className="w-12 h-12 text-accent mb-6" />
                  <h3 className="font-heading text-2xl font-bold text-white mb-4">Our Mission</h3>
                  <p className="text-primary-foreground/80 font-body">
                    To deliver a world-class golf tournament that showcases Kenya's 
                    potential as a premier sporting destination while developing the 
                    next generation of Kenyan golfers.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="section-spacing bg-muted">
        <div className="container-custom">
          <Tabs defaultValue="governance" className="w-full">
            <TabsList className="w-full justify-start mb-8 bg-white overflow-x-auto flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="governance" className="font-subheading uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white">
                <Scale className="w-4 h-4 mr-2" />
                Governance
              </TabsTrigger>
              <TabsTrigger value="board" className="font-subheading uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white">
                <Users className="w-4 h-4 mr-2" />
                Board
              </TabsTrigger>
              <TabsTrigger value="policies" className="font-subheading uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white">
                <FileText className="w-4 h-4 mr-2" />
                Policies
              </TabsTrigger>
              <TabsTrigger value="partners" className="font-subheading uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white">
                <Briefcase className="w-4 h-4 mr-2" />
                Partners
              </TabsTrigger>
            </TabsList>

            {/* Governance Tab */}
            <TabsContent value="governance" data-testid="tab-governance">
              <div className="mb-8">
                <h2 className="font-heading text-3xl font-bold mb-4">Governance Structure</h2>
                <p className="text-muted-foreground font-body max-w-3xl">
                  KOGL operates under a robust governance framework that ensures transparency, 
                  accountability, and effective decision-making at all levels of the organization.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {governanceStructure.map((item, i) => (
                  <Card key={i} className="card-default hover-lift" data-testid={`governance-${i}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-heading text-lg font-bold mb-2">{item.title}</h3>
                          <p className="text-muted-foreground font-body text-sm">{item.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="card-default mt-8">
                <CardContent className="p-6">
                  <h3 className="font-heading text-xl font-bold mb-4">Our Values</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4">
                      <div className="w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3">
                        <Shield className="w-6 h-6" />
                      </div>
                      <h4 className="font-subheading font-semibold mb-2">Integrity</h4>
                      <p className="text-muted-foreground text-sm font-body">
                        Operating with honesty and transparency in all dealings
                      </p>
                    </div>
                    <div className="text-center p-4">
                      <div className="w-12 h-12 bg-secondary text-secondary-foreground flex items-center justify-center mx-auto mb-3">
                        <Award className="w-6 h-6" />
                      </div>
                      <h4 className="font-subheading font-semibold mb-2">Excellence</h4>
                      <p className="text-muted-foreground text-sm font-body">
                        Striving for the highest standards in everything we do
                      </p>
                    </div>
                    <div className="text-center p-4">
                      <div className="w-12 h-12 bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="font-subheading font-semibold mb-2">Inclusivity</h4>
                      <p className="text-muted-foreground text-sm font-body">
                        Welcoming everyone to experience the joy of golf
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Board Tab */}
            <TabsContent value="board" data-testid="tab-board">
              <div className="mb-8">
                <h2 className="font-heading text-3xl font-bold mb-4">Board of Directors</h2>
                <p className="text-muted-foreground font-body max-w-3xl">
                  Our Board comprises experienced professionals dedicated to advancing 
                  the mission of KOGL and promoting golf development in Kenya.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {boardMembers.map((member, i) => (
                  <Card key={i} className="card-default hover-lift" data-testid={`board-member-${i}`}>
                    <CardContent className="p-6 text-center">
                      {member.image ? (
                        <img 
                          src={member.image} 
                          alt={member.name}
                          className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-primary/20 shadow-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-10 h-10 text-primary" />
                        </div>
                      )}
                      <h3 className="font-heading text-lg font-bold">{member.name}</h3>
                      <Badge variant="outline" className="mt-2 mb-3">{member.role}</Badge>
                      <p className="text-muted-foreground font-body text-sm">{member.bio}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Policies Tab */}
            <TabsContent value="policies" data-testid="tab-policies">
              <div className="mb-8">
                <h2 className="font-heading text-3xl font-bold mb-4">Policies & Guidelines</h2>
                <p className="text-muted-foreground font-body max-w-3xl">
                  KOGL maintains comprehensive policies to ensure responsible governance, 
                  ethical conduct, and compliance with international sporting standards.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allPolicies.map((policy, i) => {
                  const IconComponent = policy.icon || FileText;
                  const hasDownload = policy.file_url;
                  
                  return (
                    <Card key={policy.policy_id || i} className="card-default hover-lift group" data-testid={`policy-${i}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 bg-primary/10 flex items-center justify-center mb-4">
                            <IconComponent className="w-5 h-5 text-primary" />
                          </div>
                          {hasDownload && (
                            <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          )}
                        </div>
                        <h3 className="font-heading text-lg font-bold mb-2">{policy.title}</h3>
                        <p className="text-muted-foreground font-body text-sm">{policy.description}</p>
                        {hasDownload ? (
                          <a href={policy.file_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="mt-4 p-0 h-auto text-primary hover:text-primary/80">
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </Button>
                          </a>
                        ) : (
                          <Button variant="ghost" size="sm" className="mt-4 p-0 h-auto text-muted-foreground" disabled>
                            <Download className="w-4 h-4 mr-2" />
                            Coming Soon
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="card-default mt-8 bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <BookOpen className="w-8 h-8 text-primary" />
                    <div>
                      <h4 className="font-heading font-bold">Annual Reports</h4>
                      <p className="text-muted-foreground text-sm font-body">
                        Access our annual reports for detailed information on KOGL's activities and financial performance.
                      </p>
                    </div>
                    <Button variant="outline" className="ml-auto">
                      View Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Partners Tab */}
            <TabsContent value="partners" data-testid="tab-partners">
              <div className="mb-8">
                <h2 className="font-heading text-3xl font-bold mb-4">Our Partners</h2>
                <p className="text-muted-foreground font-body max-w-3xl">
                  Working together with leading organizations to deliver excellence in golf
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
                {partners.map((partner, i) => (
                  <Card key={i} className="card-default hover-lift">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-muted flex items-center justify-center mx-auto mb-3">
                        <Globe className="w-8 h-8 text-primary" />
                      </div>
                      <p className="font-subheading font-semibold text-sm">{partner}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="card-feature">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                      <h3 className="font-heading text-2xl font-bold text-white mb-4">
                        Become a Partner
                      </h3>
                      <p className="text-primary-foreground/80 font-body mb-6">
                        Join us in showcasing Kenya to the world through world-class golf. 
                        We offer various partnership and sponsorship opportunities.
                      </p>
                      <Link to="/contact">
                        <Button className="btn-secondary">
                          <Mail className="w-4 h-4 mr-2" />
                          Enquire About Partnerships
                        </Button>
                      </Link>
                    </div>
                    <div className="hidden md:flex justify-center">
                      <div className="w-32 h-32 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                        <Briefcase className="w-16 h-16 text-accent" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Objectives */}
      <section className="section-spacing">
        <div className="container-custom">
          <h2 className="font-heading text-3xl font-bold mb-12 text-center">Our Strategic Objectives</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-default hover-lift">
              <CardContent className="p-6 text-center">
                <Target className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-heading text-lg font-bold mb-2">Tournament Excellence</h3>
                <p className="text-muted-foreground font-body text-sm">
                  Deliver a best-in-class tournament experience for players and spectators
                </p>
              </CardContent>
            </Card>
            <Card className="card-default hover-lift">
              <CardContent className="p-6 text-center">
                <Globe className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-heading text-lg font-bold mb-2">Global Visibility</h3>
                <p className="text-muted-foreground font-body text-sm">
                  Showcase Kenya to a worldwide audience through international broadcast
                </p>
              </CardContent>
            </Card>
            <Card className="card-default hover-lift">
              <CardContent className="p-6 text-center">
                <Users className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-heading text-lg font-bold mb-2">Youth Development</h3>
                <p className="text-muted-foreground font-body text-sm">
                  Nurture young talent through comprehensive junior golf programs
                </p>
              </CardContent>
            </Card>
            <Card className="card-default hover-lift">
              <CardContent className="p-6 text-center">
                <Award className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-heading text-lg font-bold mb-2">Legacy Building</h3>
                <p className="text-muted-foreground font-body text-sm">
                  Create lasting impact on Kenyan golf and sports tourism
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container-custom text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Get In Touch
          </h2>
          <p className="text-primary-foreground/80 font-body mb-8 max-w-2xl mx-auto">
            Interested in sponsorship, partnerships, or have questions about KOGL? We'd love to hear from you.
          </p>
          <Link to="/contact">
            <Button variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary gap-2">
              <Mail className="w-4 h-4" />
              Contact Us
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
