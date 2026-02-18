import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Trophy, 
  Users, 
  ArrowRight,
  Play,
  Clock,
  ChevronLeft,
  ChevronRight,
  Video,
  Camera,
  Star,
  Briefcase,
  UserPlus,
  ClipboardList,
  BadgeCheck
} from 'lucide-react';

// Logo URLs
const MKO_LOGO = "https://customer-assets.emergentagent.com/job_kenya-golf-tourney/artifacts/n9g48emm_MKO%20logo.jpeg";
const DP_WORLD_TOUR_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/71ky16t3_DPWORLD%20TOUR.png"; // European Tour logo
const KOGL_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/ft1exgdt_KOGL.png"; // Kenya Open Golf Ltd

// Partner & Sponsor Logos
const MINISTRY_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/q0qxyns1_MINISTRY.png";
const DPWORLD_SPONSOR_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/h2va547a_DPWORLD%20LOGO.jpg"; // DP World sponsor (blue)
const ABSA_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/2h0ry18x_ABSA%20KENYA.jpg";
const JOHNNIE_WALKER_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/0cc2631j_JOHNYWALKER%20LOGO.jpg";
// Avenue Healthcare logo
const AVENUE_HEALTHCARE_LOGO = "https://customer-assets.emergentagent.com/job_mkopen-dashboard/artifacts/vi1xdwkv_anenue.png";

// User provided photos
const KAREN_PHOTO = "https://customer-assets.emergentagent.com/job_accredit-kenya/artifacts/x1hpcjaa_karen%20photo.jpeg";
const CHEQUE_PRESENTATION = "https://customer-assets.emergentagent.com/job_accredit-kenya/artifacts/ovuu5vyt_cheque%20presentation.jpeg";
const JUNAID_MANJI_PHOTO = "https://customer-assets.emergentagent.com/job_mkopen-dashboard/artifacts/nvneo69q_junaid.jpeg";

// Hero backgrounds
const HERO_IMAGES = [
  KAREN_PHOTO,
  CHEQUE_PRESENTATION,
  JUNAID_MANJI_PHOTO,
  "https://images.unsplash.com/photo-1768396747921-5a18367415d2?w=1920&q=80"
];

// Featured content carousel items
const featuredContent = [
  {
    id: 1,
    type: 'gallery',
    title: 'MKO 2026 Launch Event',
    subtitle: 'Officials and dignitaries at the tournament launch',
    image: KAREN_PHOTO,
    category: 'PHOTOS'
  },
  {
    id: 2,
    type: 'gallery',
    title: 'Prize Cheque Presentation',
    subtitle: 'Celebrating our champions and sponsors',
    image: CHEQUE_PRESENTATION,
    category: 'PHOTOS'
  },
  {
    id: 3,
    type: 'player',
    title: 'Junaid Manji - QUALIFIED',
    subtitle: 'Junior Golf Foundation Kenya player qualifies for MKO 2026',
    image: JUNAID_MANJI_PHOTO,
    category: 'PLAYERS'
  },
  {
    id: 4,
    type: 'video',
    title: '2025 Highlights: Best Shots',
    subtitle: 'Relive the magic moments from last year',
    image: 'https://images.pexels.com/photos/3692901/pexels-photo-3692901.jpeg',
    category: 'VIDEO',
    duration: '4:32'
  },
  {
    id: 5,
    type: 'article',
    title: 'Meet the 2026 Field',
    subtitle: 'World-class players descend on Karen Country Club',
    image: 'https://images.unsplash.com/photo-1766206096984-5b13b0f1eedd?w=800&q=80',
    category: 'PLAYERS'
  },
  {
    id: 6,
    type: 'gallery',
    title: 'Karen Country Club Gallery',
    subtitle: 'Stunning views of the championship course',
    image: 'https://www.karencountryclub.org/getmedia/3d060c0f-c792-4a0b-9245-1eea0962a8ad/DJI_1;.aspx?ext=.jpg',
    category: 'PHOTOS'
  },
  {
    id: 7,
    type: 'video',
    title: 'The Kenya Experience',
    subtitle: 'Golf, safari, and unforgettable adventures',
    image: 'https://images.unsplash.com/photo-1740048264207-ad890ed15fd4?w=800&q=80',
    category: 'VIDEO',
    duration: '3:15'
  },
  {
    id: 8,
    type: 'article',
    title: 'Junior Golf Initiative',
    subtitle: 'Developing the next generation of Kenyan golfers',
    image: 'https://images.unsplash.com/photo-1727122383197-71ec73d9a6cc?w=800&q=80',
    category: 'COMMUNITY'
  }
];

// Player spotlight data - Past Kenya Open Winners (User-provided correct images)
const playerSpotlight = [
  {
    name: 'Jacques Kruyswijk',
    country: 'South Africa',
    countryCode: 'RSA',
    title: '2025 Champion',
    year: 2025,
    image: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/0inn5gc9_jacques.jpg'
  },
  {
    name: 'Darius van Driel',
    country: 'Netherlands',
    countryCode: 'NED',
    title: '2024 Champion',
    year: 2024,
    image: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/kn3ad6e2_darisu.jpg'
  },
  {
    name: 'Jorge Campillo',
    country: 'Spain',
    countryCode: 'ESP',
    title: '2023 Champion',
    year: 2023,
    image: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/9hbmwdut_campelo.jpg'
  },
  {
    name: 'Wu Ashun',
    country: 'China',
    countryCode: 'CHN',
    title: '2022 Champion',
    year: 2022,
    image: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/5skp20ed_ashun.jpg'
  },
  {
    name: 'Justin Harding',
    country: 'South Africa',
    countryCode: 'RSA',
    title: '2021 Champion',
    year: 2021,
    image: 'https://customer-assets.emergentagent.com/job_3abca89a-875f-4d6d-ae25-9400a3d5967a/artifacts/myt5kbim_harding.jpg'
  },
  {
    name: 'Guido Migliozzi',
    country: 'Italy',
    countryCode: 'ITA',
    title: '2019 Champion',
    year: 2019,
    image: 'https://customer-assets.emergentagent.com/job_mkopen-dashboard/artifacts/iebc4u2r_Guido.jpg'
  }
];

// Countdown timer component
function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-3 md:gap-6" data-testid="countdown-timer">
      {Object.entries(timeLeft).map(([key, value]) => (
        <div key={key} className="text-center bg-black/30 backdrop-blur-sm px-3 py-2 md:px-5 md:py-3">
          <div className="font-subheading text-3xl md:text-5xl font-bold text-white">
            {String(value).padStart(2, '0')}
          </div>
          <div className="text-[10px] md:text-xs uppercase tracking-widest text-white/70 mt-1">
            {key}
          </div>
        </div>
      ))}
    </div>
  );
}

// Featured Content Carousel
function FeaturedCarousel({ items }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, items.length]);

  const goTo = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setIsAutoPlaying(false);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setIsAutoPlaying(false);
  };

  const currentItem = items[currentIndex];

  return (
    <div className="relative group" data-testid="featured-carousel">
      {/* Main featured item */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <img 
          src={currentItem.image} 
          alt={currentItem.title}
          className="w-full h-full object-cover object-center transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <Badge className={`mb-3 ${currentItem.type === 'video' ? 'bg-secondary' : 'bg-primary'}`}>
            {currentItem.type === 'video' && <Play className="w-3 h-3 mr-1" />}
            {currentItem.type === 'gallery' && <Camera className="w-3 h-3 mr-1" />}
            {currentItem.category}
            {currentItem.duration && <span className="ml-2">{currentItem.duration}</span>}
          </Badge>
          <h2 className="font-heading text-2xl md:text-4xl font-bold text-white mb-2">
            {currentItem.title}
          </h2>
          <p className="text-white/80 font-body text-sm md:text-base max-w-2xl">
            {currentItem.subtitle}
          </p>
          <Button className="mt-4 btn-secondary" data-testid="watch-now-btn">
            {currentItem.type === 'video' ? 'Watch Now' : 'View More'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Navigation arrows */}
        <button 
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 mt-2 overflow-x-auto pb-2 no-scrollbar">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => goTo(index)}
            className={`relative flex-shrink-0 w-32 md:w-48 h-20 md:h-28 overflow-hidden transition-all ${
              index === currentIndex ? 'ring-2 ring-secondary' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
            {item.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="absolute bottom-1 left-1 right-1">
              <p className="text-white text-[10px] md:text-xs font-body truncate">{item.title}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [news, setNews] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [tournamentInfo, setTournamentInfo] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [siteConfig, setSiteConfig] = useState(null);

  useEffect(() => {
    // Fetch data including site config for dynamic sponsors
    Promise.all([
      fetch(`${API}/news?limit=3`).then(r => r.json()).catch(() => []),
      fetch(`${API}/leaderboard/live?top=5`).then(r => r.json()).catch(() => ({ entries: [] })),
      fetch(`${API}/tournament/info`).then(r => r.json()).catch(() => null),
      fetch(`${API}/site-config`).then(r => r.json()).catch(() => null)
    ]).then(([newsData, leaderboardData, infoData, configData]) => {
      setNews(newsData);
      // Handle new API response format
      const entries = leaderboardData.entries || leaderboardData || [];
      setLeaderboard(Array.isArray(entries) ? entries.slice(0, 5) : []);
      setTournamentInfo(infoData);
      setSiteConfig(configData);
    });

    // Hero image rotation
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div data-testid="home-page">
      {/* Top Banner with DP World Tour and KOGL */}
      <div className="bg-white border-b border-border/40 py-3">
        <div className="container-custom flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={DP_WORLD_TOUR_LOGO} alt="DP World Tour" className="h-10 md:h-14 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <img src={KOGL_LOGO} alt="Kenya Open Golf Limited" className="h-10 md:h-14 w-auto object-contain" />
          </div>
        </div>
      </div>

      {/* Hero Section - Improved hierarchy and responsiveness */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden" data-testid="hero-section">
        {HERO_IMAGES.map((img, i) => (
          <div 
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === heroIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            <img 
              src={img} 
              alt="Hero" 
              className="w-full h-full object-cover object-top"
            />
          </div>
        ))}
        <div className="hero-overlay absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        
        <div className="relative z-10 container-custom text-center py-24">
          <div className="animate-fade-in">
            <div className="flex items-center justify-center gap-4 mb-8">
              <Badge className="bg-[#D50032] text-white px-5 py-2.5 text-xs uppercase tracking-widest font-bold">
                DP World Tour
              </Badge>
            </div>
            
            <h1 className="font-heading text-5xl md:text-7xl lg:text-9xl font-bold text-white mb-2 tracking-tight">
              <span className="text-[#D50032] italic">Magical</span>
            </h1>
            <h1 className="font-heading text-5xl md:text-7xl lg:text-9xl font-bold text-white mb-8 tracking-tight">
              Kenya Open
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-3 text-white/90 text-lg md:text-xl font-body mb-10">
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{tournamentInfo?.dates || 'February 19-22, 2026'}</span>
              </span>
              <span className="hidden sm:inline mx-2">•</span>
              <span className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{tournamentInfo?.venue || 'Karen Country Club'}</span>
              </span>
            </div>

            {/* Countdown */}
            <div className="mb-12 flex justify-center">
              <CountdownTimer targetDate="2026-02-19T07:00:00" />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/tickets">
                <Button className="btn-cta min-w-[200px]" data-testid="hero-tickets-btn">
                  Get Tickets
                </Button>
              </Link>
              <Link to="/tournament">
                <Button variant="outline" className="h-16 px-12 text-base border-2 border-white text-white hover:bg-white hover:text-[#373A36] uppercase tracking-widest font-bold min-w-[200px]" data-testid="hero-leaderboard-btn">
                  Tournament Info
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-7 h-12 border-2 border-white/60 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-4 bg-white/60 rounded-full" />
          </div>
        </div>
      </section>

      {/* Featured Content Section - CMS Driven */}
      <section className="bg-foreground py-8" data-testid="featured-section">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-subheading text-white text-sm uppercase tracking-widest">Featured Content</h2>
            <Link to="/gallery" className="text-white/70 hover:text-white text-sm flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <FeaturedCarousel items={siteConfig?.featured_content?.length > 0 ? siteConfig.featured_content : featuredContent} />
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-primary text-primary-foreground py-8" data-testid="quick-stats">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Trophy, value: '$2,700,000', label: 'Prize Fund' },
              { icon: Users, value: '144', label: 'Players' },
              { icon: MapPin, value: 'Karen CC', label: 'Venue' },
              { icon: Calendar, value: '4', label: 'Days' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-accent" />
                <div className="font-subheading text-2xl md:text-3xl font-bold">{stat.value}</div>
                <div className="text-xs uppercase tracking-wider text-primary-foreground/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get Involved - Quick Access Tabs */}
      <section className="py-12 bg-background border-b" data-testid="get-involved-section">
        <div className="container-custom">
          <div className="text-center mb-8">
            <Badge className="bg-secondary text-secondary-foreground mb-2">Get Involved</Badge>
            <h2 className="font-heading text-3xl md:text-4xl font-bold">Join MKO 2026</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              Be part of Africa's premier golf tournament. Multiple opportunities available.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Volunteer */}
            <Link to="/volunteer-register" className="group">
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-[#D50032]" data-testid="quick-link-volunteer">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-[#D50032]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#D50032] transition-colors">
                    <Users className="w-8 h-8 text-[#D50032] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">Volunteer</h3>
                  <p className="text-muted-foreground text-sm mb-4">Marshal & Scorer positions</p>
                  <span className="text-[#D50032] text-sm font-bold flex items-center justify-center gap-1 group-hover:gap-2 transition-all uppercase tracking-wider">
                    Apply <ArrowRight className="w-4 h-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>

            {/* Jobs */}
            <Link to="/apply/jobs" className="group">
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-[#D50032]" data-testid="quick-link-jobs">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-[#373A36]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#373A36] transition-colors">
                    <UserPlus className="w-8 h-8 text-[#373A36] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">Jobs</h3>
                  <p className="text-muted-foreground text-sm mb-4">Employment opportunities</p>
                  <span className="text-[#373A36] text-sm font-bold flex items-center justify-center gap-1 group-hover:gap-2 transition-all uppercase tracking-wider">
                    Apply <ArrowRight className="w-4 h-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>

            {/* Procurement */}
            <Link to="/apply/procurement" className="group">
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-[#D50032]" data-testid="quick-link-procurement">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-[#D50032]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#D50032] transition-colors">
                    <ClipboardList className="w-8 h-8 text-[#D50032] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">Procurement</h3>
                  <p className="text-muted-foreground text-sm mb-4">Tenders & contracts</p>
                  <span className="text-[#D50032] text-sm font-bold flex items-center justify-center gap-1 group-hover:gap-2 transition-all uppercase tracking-wider">
                    Apply <ArrowRight className="w-4 h-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>

            {/* Accreditation */}
            <Link to="/apply" className="group">
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-[#D50032]" data-testid="quick-link-accreditation">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-[#373A36]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#373A36] transition-colors">
                    <BadgeCheck className="w-8 h-8 text-[#373A36] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">Accreditation</h3>
                  <p className="text-muted-foreground text-sm mb-4">Vendors, Media, Pro-Am</p>
                  <span className="text-[#373A36] text-sm font-bold flex items-center justify-center gap-1 group-hover:gap-2 transition-all uppercase tracking-wider">
                    View All <ArrowRight className="w-4 h-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Player Spotlight - Past Winners */}
      <section className="section-spacing bg-[#F2F1F2]" data-testid="player-spotlight">
        <div className="container-custom">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
            <div>
              <Badge className="bg-[#D50032] text-white mb-3">Past Champions</Badge>
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-[#373A36]">Kenya Open Winners</h2>
            </div>
            <Link to="/hall-of-fame">
              <Button className="btn-outline gap-2">
                Hall of Fame <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {playerSpotlight.map((player, i) => (
              <Card key={i} className="card-default group overflow-hidden hover-lift" data-testid={`player-card-${i}`}>
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img 
                    src={player.image} 
                    alt={player.name}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-white/90 text-foreground text-xs">{player.countryCode}</Badge>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-accent text-xs uppercase tracking-wider mb-0.5">{player.title}</p>
                    <h3 className="font-heading text-sm md:text-base font-bold text-white leading-tight">{player.name}</h3>
                    <p className="text-white/70 text-xs">{player.country}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Live Leaderboard Section - Hidden until data available 
      <section className="section-spacing bg-background" data-testid="leaderboard-preview">
        ... custom leaderboard code preserved but hidden ...
      </section>
      */}

      {/* European Tour Widget - Compact Badge */}
      <section className="py-6 bg-muted/30" data-testid="et-widget-section">
        <div className="container-custom">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a 
              href="https://www.europeantour.com/dpworld-tour/magical-kenya-open-2025/leaderboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 bg-[#003087] hover:bg-[#002060] text-white rounded-lg transition-colors shadow-md"
            >
              <Trophy className="w-5 h-5" />
              <span className="font-semibold">DP World Tour Live Leaderboard</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            {/* Hidden iframe - kept for when European Tour enables embedding */}
            <iframe
              id="etLeaderboardWidget"
              src="https://www.europeantour.com/data/leaderboard/widgets/en/top10/"
              className="hidden"
              title="European Tour Live Leaderboard"
            />
          </div>
        </div>
      </section>

      {/* The Course - Karen Country Club */}
      <section className="section-spacing bg-[#373A36] text-white" data-testid="course-section">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-[#D50032] text-white mb-4">The Venue</Badge>
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white">Karen Country Club</h2>
              <p className="text-white/80 font-body mb-8 leading-relaxed text-lg">
                Established in 1937, Karen Country Club is one of Kenya's most prestigious golf courses. 
                Located in the beautiful Karen suburb of Nairobi, at the foot of the Ngong Hills, the club 
                offers a championship-caliber test of golf in stunning surroundings.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-10">
                <div className="text-center p-5 bg-white/10 rounded">
                  <div className="font-subheading text-3xl font-bold text-white">72</div>
                  <div className="text-sm text-white/70 uppercase tracking-wider">Par</div>
                </div>
                <div className="text-center p-5 bg-white/10 rounded">
                  <div className="font-subheading text-3xl font-bold text-white">6,818</div>
                  <div className="text-sm text-white/70 uppercase tracking-wider">Yards</div>
                </div>
                <div className="text-center p-5 bg-white/10 rounded">
                  <div className="font-subheading text-3xl font-bold text-white">1937</div>
                  <div className="text-sm text-white/70 uppercase tracking-wider">Est.</div>
                </div>
              </div>
              <Link to="/tournament">
                <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-[#373A36] h-14 px-8 uppercase tracking-widest font-bold">
                  Explore The Course <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <img 
                src="https://www.karencountryclub.org/getmedia/3d060c0f-c792-4a0b-9245-1eea0962a8ad/DJI_1;.aspx?ext=.jpg"
                alt="Karen Country Club Golf Course"
                className="w-full h-[450px] object-cover rounded"
              />
              <div className="absolute -bottom-6 -left-6 bg-[#D50032] text-white p-6 hidden md:block rounded">
                <div className="font-heading text-4xl font-bold">2026</div>
                <div className="text-sm uppercase tracking-wider">Host Venue</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News */}
      {news.length > 0 && (
        <section className="section-spacing bg-background" data-testid="latest-news">
          <div className="container-custom">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-3xl md:text-4xl font-bold">Latest News</h2>
              <Link to="/news">
                <Button variant="ghost" className="gap-2">
                  All News <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {news.map((article) => (
                <Link key={article.news_id || article.article_id} to={`/news/${article.news_id || article.article_id}`}>
                  <Card className="card-default group hover-lift h-full overflow-hidden" data-testid={`news-card-${article.news_id || article.article_id}`}>
                    {(article.image_url || article.featured_image) && (
                      <div className="aspect-video overflow-hidden bg-muted">
                        <img 
                          src={article.image_url || article.featured_image} 
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <Badge variant="outline" className="mb-3">{article.category}</Badge>
                      <h3 className="font-heading text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-muted-foreground font-body text-sm line-clamp-2">
                        {article.summary || article.excerpt || article.content?.substring(0, 100) + '...'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                        <Clock className="w-3 h-3" />
                        {new Date(article.created_at || article.published_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Experience Kenya CTA */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden" data-testid="kenya-experience">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1740048264207-ad890ed15fd4?w=1920&q=80)` }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center px-4">
          <Badge className="bg-accent text-accent-foreground mb-4">Beyond Golf</Badge>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4">
            Experience Magical Kenya
          </h2>
          <p className="text-white/80 font-body max-w-2xl mx-auto mb-8">
            Combine world-class golf with unforgettable safari adventures. Discover why Kenya is called "Magical".
          </p>
          <Link to="/travel">
            <Button className="btn-secondary h-12 px-8">
              Plan Your Trip <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Partners & Sponsors - CMS Driven */}
      <section className="py-16 bg-white border-t border-border/40" data-testid="sponsors-section">
        <div className="container-custom">
          {/* Main Partner */}
          <h3 className="font-subheading text-xs uppercase tracking-widest text-muted-foreground text-center mb-4">
            Main Partner
          </h3>
          <div className="flex justify-center mb-10">
            <img 
              src={siteConfig?.partner_logos?.main_partner?.logo_url || MINISTRY_LOGO} 
              alt={siteConfig?.partner_logos?.main_partner?.name || "Main Partner"}
              className="h-20 md:h-28 w-auto object-contain"
            />
          </div>
          
          {/* Official Partners */}
          <h3 className="font-subheading text-xs uppercase tracking-widest text-muted-foreground text-center mb-6">
            Official Partners
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 mb-10">
            {siteConfig?.partner_logos?.official_partners?.length > 0 ? (
              siteConfig.partner_logos.official_partners.map((partner, i) => (
                <img 
                  key={i}
                  src={partner.logo_url} 
                  alt={partner.name}
                  className="h-12 md:h-16 w-auto object-contain"
                />
              ))
            ) : (
              <>
                <img src={DP_WORLD_TOUR_LOGO} alt="DP World Tour" className="h-12 md:h-16 w-auto object-contain" />
                <img src={MKO_LOGO} alt="Magical Kenya Open" className="h-14 md:h-20 w-auto object-contain" />
              </>
            )}
          </div>

          {/* Tournament Sponsors */}
          <h3 className="font-subheading text-xs uppercase tracking-widest text-muted-foreground text-center mb-6">
            Tournament Sponsors
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14">
            {siteConfig?.partner_logos?.tournament_sponsors?.length > 0 ? (
              siteConfig.partner_logos.tournament_sponsors.map((sponsor, i) => (
                <img 
                  key={i}
                  src={sponsor.logo_url} 
                  alt={sponsor.name}
                  className="h-12 md:h-16 w-auto object-contain"
                />
              ))
            ) : (
              <>
                <img src={DPWORLD_SPONSOR_LOGO} alt="DP World" className="h-12 md:h-16 w-auto object-contain" />
                <img src={ABSA_LOGO} alt="ABSA Kenya" className="h-12 md:h-16 w-auto object-contain" />
                <img src={JOHNNIE_WALKER_LOGO} alt="Johnnie Walker" className="h-16 md:h-24 w-auto object-contain" />
                <img src={AVENUE_HEALTHCARE_LOGO} alt="Avenue Healthcare" className="h-10 md:h-14 w-auto object-contain" />
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
