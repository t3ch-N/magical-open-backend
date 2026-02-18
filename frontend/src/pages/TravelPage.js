import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Plane,
  Hotel,
  Car,
  MapPin,
  Camera,
  Utensils,
  ExternalLink,
  Sun,
  Globe
} from 'lucide-react';

const SAFARI_BG = "https://images.pexels.com/photos/30752232/pexels-photo-30752232.jpeg";

const attractions = [
  {
    name: 'Nairobi National Park',
    description: 'The world\'s only national park within a capital city. See lions, rhinos, and giraffes just minutes from downtown.',
    icon: Camera,
    image: 'https://images.pexels.com/photos/1170504/pexels-photo-1170504.jpeg'
  },
  {
    name: 'David Sheldrick Wildlife Trust',
    description: 'Visit the famous elephant orphanage and witness the incredible work of wildlife conservation.',
    icon: Camera,
    image: 'https://images.pexels.com/photos/1054666/pexels-photo-1054666.jpeg'
  },
  {
    name: 'Giraffe Centre',
    description: 'Get up close with endangered Rothschild giraffes at this unique conservation center.',
    icon: Camera,
    image: 'https://images.pexels.com/photos/797643/pexels-photo-797643.jpeg'
  },
  {
    name: 'Karen Blixen Museum',
    description: 'Explore the former home of the famous author of "Out of Africa" at the foot of the Ngong Hills.',
    icon: Camera,
    image: 'https://images.pexels.com/photos/3889843/pexels-photo-3889843.jpeg'
  }
];

const travelTips = [
  {
    icon: Globe,
    title: 'Visa Information',
    description: 'Most visitors require a visa. Apply online through the eVisa portal before travel.'
  },
  {
    icon: Sun,
    title: 'Best Time to Visit',
    description: 'March weather is excellent - warm days (25-28°C) with occasional brief showers.'
  },
  {
    icon: Car,
    title: 'Getting Around',
    description: 'Taxis and ride-sharing apps (Uber, Bolt) are widely available in Nairobi.'
  },
  {
    icon: Utensils,
    title: 'Local Cuisine',
    description: 'Don\'t miss nyama choma (grilled meat) and ugali - traditional Kenyan favorites.'
  }
];

const hotels = [
  {
    name: 'Hemingways Nairobi',
    category: 'Luxury',
    location: 'Karen',
    description: 'Boutique luxury hotel with stunning views of the Ngong Hills.'
  },
  {
    name: 'Fairmont The Norfolk',
    category: 'Luxury',
    location: 'City Center',
    description: 'Historic 5-star hotel in the heart of Nairobi since 1904.'
  },
  {
    name: 'Tribe Hotel',
    category: 'Contemporary',
    location: 'Gigiri',
    description: 'Modern design hotel near the UN complex and Village Market.'
  },
  {
    name: 'Sarova Stanley',
    category: 'Classic',
    location: 'City Center',
    description: 'Iconic hotel famous for its Thorn Tree Café and central location.'
  }
];

export default function TravelPage() {
  return (
    <div data-testid="travel-page">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${SAFARI_BG})` }}
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative z-10 container-custom text-center">
          <Badge className="bg-accent text-accent-foreground mb-4 px-4 py-2">
            Discover Kenya
          </Badge>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-4">
            Travel & Experience
          </h1>
          <p className="text-white/80 text-lg font-body max-w-2xl mx-auto">
            Make the most of your visit to Kenya with world-class golf, incredible wildlife, and unforgettable experiences.
          </p>
        </div>
      </section>

      {/* Getting There */}
      <section className="section-spacing">
        <div className="container-custom">
          <h2 className="font-heading text-3xl font-bold mb-8">Getting to Nairobi</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="card-default hover-lift" data-testid="travel-by-air">
              <CardContent className="p-6 text-center">
                <Plane className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-heading text-xl font-bold mb-2">By Air</h3>
                <p className="text-muted-foreground font-body text-sm">
                  Jomo Kenyatta International Airport (NBO) serves direct flights from major cities worldwide including London, Dubai, Amsterdam, and Johannesburg.
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-default hover-lift" data-testid="travel-venue">
              <CardContent className="p-6 text-center">
                <MapPin className="w-10 h-10 text-secondary mx-auto mb-4" />
                <h3 className="font-heading text-xl font-bold mb-2">Tournament Venue</h3>
                <p className="text-muted-foreground font-body text-sm">
                  Karen Country Club is located just 20 minutes from the city center and 30 minutes from Jomo Kenyatta International Airport.
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-default hover-lift" data-testid="travel-transport">
              <CardContent className="p-6 text-center">
                <Car className="w-10 h-10 text-accent mx-auto mb-4" />
                <h3 className="font-heading text-xl font-bold mb-2">Local Transport</h3>
                <p className="text-muted-foreground font-body text-sm">
                  Taxi services, Uber, and Bolt are readily available. Many hotels offer airport transfers.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Travel Tips */}
          <div className="bg-muted p-8 mb-12">
            <h3 className="font-heading text-2xl font-bold mb-6">Travel Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {travelTips.map((tip, i) => (
                <div key={i} className="flex gap-4">
                  <tip.icon className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <h4 className="font-subheading font-semibold mb-1">{tip.title}</h4>
                    <p className="text-muted-foreground text-sm font-body">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Accommodation */}
      <section className="section-spacing bg-muted">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-8">
            <Hotel className="w-8 h-8 text-primary" />
            <h2 className="font-heading text-3xl font-bold">Recommended Hotels</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {hotels.map((hotel, i) => (
              <Card key={i} className="card-default hover-lift" data-testid={`hotel-${i}`}>
                <CardContent className="p-6">
                  <Badge variant="outline" className="mb-3">{hotel.category}</Badge>
                  <h3 className="font-heading text-lg font-bold mb-1">{hotel.name}</h3>
                  <p className="text-muted-foreground text-xs mb-3 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {hotel.location}
                  </p>
                  <p className="text-muted-foreground font-body text-sm">
                    {hotel.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <p className="text-center text-muted-foreground font-body mt-8">
            For special tournament rates and packages, contact our hospitality team.
          </p>
        </div>
      </section>

      {/* Attractions */}
      <section className="section-spacing">
        <div className="container-custom">
          <h2 className="font-heading text-3xl font-bold mb-2">Beyond the Golf</h2>
          <p className="text-muted-foreground font-body mb-8">
            Extend your trip and discover why Kenya is called "Magical"
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {attractions.map((attraction, i) => (
              <Card key={i} className="card-default overflow-hidden group" data-testid={`attraction-${i}`}>
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="h-48 md:h-auto overflow-hidden">
                    <img 
                      src={attraction.image} 
                      alt={attraction.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-6 flex flex-col justify-center">
                    <attraction.icon className="w-6 h-6 text-accent mb-3" />
                    <h3 className="font-heading text-xl font-bold mb-2">{attraction.name}</h3>
                    <p className="text-muted-foreground font-body text-sm">
                      {attraction.description}
                    </p>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container-custom text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Plan Your Magical Kenya Experience
          </h2>
          <p className="text-primary-foreground/80 font-body mb-8 max-w-2xl mx-auto">
            From golf to safari, we can help you create an unforgettable journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://www.magicalkenya.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Visit Magical Kenya <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
