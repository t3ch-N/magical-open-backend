import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  CheckCircle2,
  FileText,
  Download,
  ArrowRight,
  Star,
  Award,
  Target,
  Info,
  AlertCircle
} from 'lucide-react';

const KOGL_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/ft1exgdt_KOGL.png";

// Past winners data
const pastWinners = [
  { year: 2025, team: "Team Safari", members: ["J. Smith", "K. Ochieng", "M. Patel", "A. Njoroge"], score: "-18" },
  { year: 2024, team: "Karen Eagles", members: ["R. Johnson", "P. Kimani", "D. Shah", "T. Mwangi"], score: "-16" },
  { year: 2023, team: "Savanna Stars", members: ["M. Williams", "J. Kamau", "S. Gupta", "L. Omondi"], score: "-15" },
];

// Eligibility rules
const eligibilityRules = [
  { icon: Target, title: "Men Handicap", description: "Maximum handicap index of 24.0" },
  { icon: Target, title: "Ladies Handicap", description: "Maximum handicap index of 32.0" },
  { icon: FileText, title: "Valid Certificate", description: "Current handicap certificate required" },
  { icon: Users, title: "Amateur Status", description: "Must hold amateur status" },
];

// Tournament format
const formatDetails = [
  { title: "Team Composition", description: "1 Professional + 3 Amateurs per team" },
  { title: "Format", description: "Team Scramble - best scores count" },
  { title: "Professional", description: "Plays own ball throughout" },
  { title: "Worst Score", description: "Net Par applies" },
];

// Tee information
const teeInfo = [
  { category: "Professionals", tees: "Championship Tees", color: "bg-black" },
  { category: "Amateur Men", tees: "White Tees", color: "bg-white border-2" },
  { category: "Amateur Ladies", tees: "Red Tees", color: "bg-red-500" },
];

export default function ProAmPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [spotsRemaining, setSpotsRemaining] = useState(null);

  useEffect(() => {
    // Check registration status
    const checkStatus = async () => {
      try {
        const response = await fetch(`${API}/pro-am/status`);
        if (response.ok) {
          const data = await response.json();
          setRegistrationOpen(data.registration_open);
          setSpotsRemaining(data.spots_remaining);
        }
      } catch (error) {
        console.error('Failed to fetch Pro-Am status:', error);
      }
    };
    checkStatus();
  }, []);

  return (
    <div className="min-h-screen bg-background" data-testid="pro-am-page">
      {/* Hero Section */}
      <section className="relative bg-primary text-primary-foreground py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-transparent to-primary" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-center gap-6 mb-6">
            <img src={KOGL_LOGO} alt="KOGL" className="h-16 md:h-20" />
          </div>
          <div className="text-center">
            <Badge className="bg-accent text-accent-foreground mb-4 px-4 py-2">
              <Trophy className="w-4 h-4 mr-2" />
              Official Tournament Event
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Pro-Am Tournament
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-6">
              Play alongside DP World Tour professionals at Africa's premier golf tournament
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <Calendar className="w-4 h-4" />
                <span>February 19, 2026</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <MapPin className="w-4 h-4" />
                <span>Karen Country Club</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <Users className="w-4 h-4" />
                <span>Limited Spots Available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start h-14 bg-transparent rounded-none border-0 p-0 gap-0">
              <TabsTrigger 
                value="overview" 
                className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6"
              >
                Register
              </TabsTrigger>
              <TabsTrigger 
                value="tee-times" 
                className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6"
              >
                Tee Times & Draw
              </TabsTrigger>
              <TabsTrigger 
                value="terms" 
                className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6"
              >
                Terms
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-12">
            {/* Experience Section */}
            <section>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-4">The Ultimate Pro-Am Experience</h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Join us for an unforgettable day of golf at the Magical Kenya Open Pro-Am. 
                    This exclusive event offers amateur golfers the rare opportunity to play alongside 
                    DP World Tour professionals on the championship course at Karen Country Club.
                  </p>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Experience the thrill of tournament golf, enjoy world-class hospitality, 
                    and create lasting memories with fellow golf enthusiasts from around the globe.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span>18 Holes with a Tour Pro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span>Premium Hospitality</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span>Tournament Gift Pack</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span>Prize Presentation</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&q=80"
                    alt="Pro-Am Golf"
                    className="rounded-lg shadow-lg w-full"
                  />
                  <div className="absolute -bottom-4 -right-4 bg-accent text-accent-foreground p-4 rounded-lg shadow-lg">
                    <p className="text-2xl font-bold">KES 30,000</p>
                    <p className="text-sm">Entry Fee</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Eligibility Section */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-center">Eligibility Requirements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {eligibilityRules.map((rule, i) => (
                  <Card key={i} className="text-center">
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <rule.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{rule.title}</h3>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Format Section */}
            <section className="bg-muted rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">Tournament Format</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {formatDetails.map((item, i) => (
                  <div key={i} className="text-center">
                    <h3 className="font-semibold text-primary mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <h3 className="font-semibold mb-4 text-center">Playing Tees</h3>
                <div className="flex flex-wrap justify-center gap-6">
                  {teeInfo.map((tee, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full ${tee.color}`}></div>
                      <div>
                        <p className="font-medium text-sm">{tee.category}</p>
                        <p className="text-xs text-muted-foreground">{tee.tees}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Past Winners */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-center">Past Winners</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pastWinners.map((winner, i) => (
                  <Card key={i} className={i === 0 ? 'border-accent border-2' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={i === 0 ? 'default' : 'outline'}>{winner.year}</Badge>
                        {i === 0 && <Award className="w-5 h-5 text-accent" />}
                      </div>
                      <CardTitle className="text-lg">{winner.team}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary mb-2">{winner.score}</p>
                      <p className="text-sm text-muted-foreground">
                        {winner.members.join(', ')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* CTA */}
            <section className="text-center py-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Play?</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Secure your spot in the Magical Kenya Open 2026 Pro-Am. Limited places available.
              </p>
              {registrationOpen ? (
                <Button size="lg" onClick={() => setActiveTab('register')} className="gap-2">
                  Register Now <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Badge variant="secondary" className="text-lg py-2 px-4">
                  Registration Closed
                </Badge>
              )}
            </section>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <div className="max-w-4xl mx-auto">
              {registrationOpen ? (
                <>
                  {/* Registration Info */}
                  <Card className="mb-6 bg-amber-50 border-amber-200">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800">Entry Fee: KES 30,000 per player</p>
                          <p className="text-sm text-amber-700">
                            Payment details will be provided upon registration approval. 
                            Proof of payment required to confirm your spot.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Eligibility Reminder */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Before You Register
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Confirm your handicap is within limits (Men ≤24.0, Ladies ≤32.0)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Have your valid handicap certificate ready to upload
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Prepare a copy of your ID/Passport
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Read and accept the Terms of Competition
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Registration Form Link */}
                  <div className="text-center py-8">
                    <Link to="/pro-am/register">
                      <Button size="lg" className="gap-2 h-14 px-8">
                        <FileText className="w-5 h-5" />
                        Complete Registration Form
                      </Button>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-4">
                      You will be redirected to the secure registration form
                    </p>
                  </div>
                </>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Registration Closed</h3>
                    <p className="text-muted-foreground mb-4">
                      Pro-Am registration is currently closed. Please check back later or contact us for availability.
                    </p>
                    <Link to="/contact">
                      <Button variant="outline">Contact Us</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tee Times Tab */}
          <TabsContent value="tee-times">
            <ProAmTeeTimes />
          </TabsContent>

          {/* Terms Tab */}
          <TabsContent value="terms">
            <div className="max-w-3xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Terms of Competition</CardTitle>
                  <CardDescription>
                    Please read and understand all terms before registering
                  </CardDescription>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <h3>1. Eligibility</h3>
                  <ul>
                    <li>Participants must be amateur golfers with a valid handicap</li>
                    <li>Maximum handicap: Men 24.0, Ladies 32.0</li>
                    <li>A valid handicap certificate must be presented at registration</li>
                  </ul>

                  <h3>2. Entry Fee</h3>
                  <ul>
                    <li>Entry fee is KES 30,000 per player</li>
                    <li>Fee includes green fees, cart, hospitality, and tournament gift pack</li>
                    <li>Fee is non-refundable except in case of event cancellation</li>
                  </ul>

                  <h3>3. Format</h3>
                  <ul>
                    <li>Team Scramble format with 1 Professional and 3 Amateurs</li>
                    <li>Professional plays own ball; amateur scores count towards team total</li>
                    <li>Worst score on any hole is Net Par</li>
                  </ul>

                  <h3>4. Playing Conditions</h3>
                  <ul>
                    <li>Professionals play from Championship tees</li>
                    <li>Amateur men play from White tees</li>
                    <li>Amateur ladies play from Red tees</li>
                  </ul>

                  <h3>5. Arrival Requirements</h3>
                  <ul>
                    <li>Players must arrive at the venue 45 minutes before tee time</li>
                    <li>Players must be at the tee 10 minutes before their allocated time</li>
                    <li>Late arrivals may be disqualified</li>
                  </ul>

                  <h3>6. Code of Conduct</h3>
                  <ul>
                    <li>Proper golf attire is required at all times</li>
                    <li>Mobile phones must be on silent during play</li>
                    <li>Pace of play guidelines must be followed</li>
                  </ul>

                  <div className="mt-8 p-4 bg-muted rounded-lg">
                    <Button className="w-full gap-2">
                      <Download className="w-4 h-4" />
                      Download Full Terms (PDF)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Tee Times Component
function ProAmTeeTimes() {
  const [teeTimes, setTeeTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [drawPublished, setDrawPublished] = useState(false);

  useEffect(() => {
    const fetchTeeTimes = async () => {
      try {
        const response = await fetch(`${API}/pro-am/tee-times/public`);
        if (response.ok) {
          const data = await response.json();
          setTeeTimes(data.tee_times || []);
          setDrawPublished(data.is_published || false);
        }
      } catch (error) {
        console.error('Failed to fetch tee times:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeeTimes();
  }, []);

  const filteredTeeTimes = teeTimes.filter(tt => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      tt.players?.some(p => p.name?.toLowerCase().includes(term)) ||
      tt.professional?.toLowerCase().includes(term) ||
      tt.tee_time?.includes(term)
    );
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading tee times...</p>
      </div>
    );
  }

  if (!drawPublished || teeTimes.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Draw Not Yet Published</h3>
          <p className="text-muted-foreground">
            The Pro-Am tee times and pairings will be published closer to the event date.
            Please check back later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by player name, professional, or tee time..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>

      {/* Tee Times Grid */}
      <div className="grid gap-4">
        {filteredTeeTimes.map((group, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center bg-primary text-primary-foreground px-4 py-2 rounded-lg min-w-[80px]">
                    <p className="text-lg font-bold">{group.tee_time}</p>
                    <p className="text-xs opacity-80">Tee {group.tee_number}</p>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-accent" />
                    <span className="font-semibold">{group.professional}</span>
                    <Badge variant="outline" className="text-xs">PRO</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.players?.map((player, j) => (
                      <Badge key={j} variant="secondary" className="text-sm">
                        {player.name} ({player.handicap})
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTeeTimes.length === 0 && searchTerm && (
        <div className="text-center py-8 text-muted-foreground">
          No results found for "{searchTerm}"
        </div>
      )}
    </div>
  );
}
