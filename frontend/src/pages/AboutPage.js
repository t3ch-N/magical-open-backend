import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Trophy,
  MapPin,
  Calendar,
  Star,
  ArrowRight
} from 'lucide-react';

const ABOUT_BG = "https://images.pexels.com/photos/6256827/pexels-photo-6256827.jpeg";

const milestones = [
  { year: '1967', title: 'First Kenya Open', description: 'Tournament established, won by Maurice Bembridge' },
  { year: '1991', title: 'Safari Tour Era', description: 'Kenya Open becomes part of the Safari Tour circuit' },
  { year: '2019', title: 'European Tour Status', description: 'Tournament elevated to European Tour co-sanctioned event' },
  { year: '2021', title: 'DP World Tour', description: 'Continues as part of the newly rebranded DP World Tour' },
  { year: '2025', title: 'Present Day', description: 'One of Africa\'s premier golf events' }
];

export default function AboutPage() {
  return (
    <div data-testid="about-page">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${ABOUT_BG})` }}
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative z-10 container-custom text-center">
          <Badge className="bg-accent text-accent-foreground mb-4 px-4 py-2">
            Our Story
          </Badge>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-4">
            About the Tournament
          </h1>
          <p className="text-white/80 text-lg font-body max-w-2xl mx-auto">
            A rich history of world-class golf in the heart of Kenya
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="section-spacing">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
                Kenya's Premier Golf Event
              </h2>
              <div className="prose prose-lg font-body text-muted-foreground">
                <p className="mb-4">
                  The Magical Kenya Open is one of Africa's most prestigious golf tournaments 
                  and a proud member of the DP World Tour. Since its inception in 1967, the 
                  tournament has grown to become a highlight of the international golfing calendar.
                </p>
                <p className="mb-4">
                  Hosted at the prestigious Karen Country Club in Nairobi, the event combines 
                  world-class competitive golf with the unique charm and beauty of Kenya, 
                  offering players and spectators an unforgettable experience.
                </p>
                <p>
                  The tournament serves as a platform for showcasing Kenyan golf talent, 
                  promoting tourism, and inspiring the next generation of golfers through 
                  various community and youth programs.
                </p>
              </div>
              <div className="flex gap-4 mt-8">
                <Link to="/tournament">
                  <Button className="btn-primary gap-2">
                    Tournament Info <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="card-default">
                <CardContent className="p-6 text-center">
                  <Trophy className="w-10 h-10 text-accent mx-auto mb-3" />
                  <div className="font-subheading text-3xl font-bold text-primary">50+</div>
                  <div className="text-sm text-muted-foreground">Years of History</div>
                </CardContent>
              </Card>
              <Card className="card-default">
                <CardContent className="p-6 text-center">
                  <Star className="w-10 h-10 text-accent mx-auto mb-3" />
                  <div className="font-subheading text-3xl font-bold text-primary">$2.7M</div>
                  <div className="text-sm text-muted-foreground">Prize Fund</div>
                </CardContent>
              </Card>
              <Card className="card-default">
                <CardContent className="p-6 text-center">
                  <MapPin className="w-10 h-10 text-accent mx-auto mb-3" />
                  <div className="font-subheading text-3xl font-bold text-primary">1</div>
                  <div className="text-sm text-muted-foreground">Iconic Venue</div>
                </CardContent>
              </Card>
              <Card className="card-default">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-10 h-10 text-accent mx-auto mb-3" />
                  <div className="font-subheading text-3xl font-bold text-primary">4</div>
                  <div className="text-sm text-muted-foreground">Days of Action</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* History Timeline */}
      <section className="section-spacing bg-muted">
        <div className="container-custom">
          <h2 className="font-heading text-3xl font-bold mb-12 text-center">Our Journey</h2>
          
          <div className="max-w-3xl mx-auto">
            {milestones.map((milestone, i) => (
              <div key={i} className="flex gap-6 mb-8 last:mb-0" data-testid={`milestone-${milestone.year}`}>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-primary text-primary-foreground flex items-center justify-center font-subheading font-bold text-lg">
                    {milestone.year}
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="w-0.5 h-full bg-primary/20 my-2" />
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <h3 className="font-heading text-xl font-bold mb-2">{milestone.title}</h3>
                  <p className="text-muted-foreground font-body">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="section-spacing">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold mb-4">Beyond the Course</h2>
            <p className="text-muted-foreground font-body max-w-2xl mx-auto">
              The Magical Kenya Open is more than just a golf tournament
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="card-default hover-lift">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-bold mb-2">Tourism Promotion</h3>
                <p className="text-muted-foreground font-body text-sm">
                  Showcasing Kenya as a world-class destination to millions of viewers 
                  through international broadcast coverage.
                </p>
              </CardContent>
            </Card>
            <Card className="card-default hover-lift">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-bold mb-2">Youth Development</h3>
                <p className="text-muted-foreground font-body text-sm">
                  Supporting junior golf programs and inspiring the next generation 
                  of Kenyan golfers through clinics and scholarships.
                </p>
              </CardContent>
            </Card>
            <Card className="card-default hover-lift">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-bold mb-2">Economic Impact</h3>
                <p className="text-muted-foreground font-body text-sm">
                  Generating significant economic benefits for local businesses, 
                  hotels, and the broader Kenyan economy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container-custom text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Be Part of the Magic
          </h2>
          <p className="text-primary-foreground/80 font-body mb-8 max-w-2xl mx-auto">
            Join us at the 2025 Magical Kenya Open and experience world-class golf in one of 
            Africa's most beautiful settings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/tickets">
              <Button className="btn-secondary">Get Tickets</Button>
            </Link>
            <Link to="/about-kogl">
              <Button variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                About KOGL
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
