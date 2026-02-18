import React, { useState, useEffect } from 'react';
import { API } from '../App';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "../components/ui/dialog";
import { 
  Camera,
  Video,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Play
} from 'lucide-react';

const mockGalleryItems = [
  {
    item_id: 'gal-1',
    title: 'Karen Country Club - Hole 1',
    description: 'The scenic first hole at Karen Country Club',
    media_url: 'https://images.pexels.com/photos/6256827/pexels-photo-6256827.jpeg',
    content_type: 'photo',
    category: 'course'
  },
  {
    item_id: 'gal-2',
    title: 'Tournament Action 2024',
    description: 'Players competing in the 2024 edition',
    media_url: 'https://images.pexels.com/photos/1325744/pexels-photo-1325744.jpeg',
    content_type: 'photo',
    category: 'tournament'
  },
  {
    item_id: 'gal-3',
    title: 'Kenya Safari Experience',
    description: 'Wildlife near the tournament venue',
    media_url: 'https://images.pexels.com/photos/30752232/pexels-photo-30752232.jpeg',
    content_type: 'photo',
    category: 'experience'
  },
  {
    item_id: 'gal-4',
    title: 'Gallery Crowd',
    description: 'Spectators enjoying the tournament',
    media_url: 'https://images.pexels.com/photos/9207751/pexels-photo-9207751.jpeg',
    content_type: 'photo',
    category: 'tournament'
  },
  {
    item_id: 'gal-5',
    title: 'Course Overview',
    description: 'Aerial view of the championship course',
    media_url: 'https://images.pexels.com/photos/1766957/pexels-photo-1766957.jpeg',
    content_type: 'photo',
    category: 'course'
  },
  {
    item_id: 'gal-6',
    title: 'Practice Round',
    description: 'Players during practice session',
    media_url: 'https://images.pexels.com/photos/1170504/pexels-photo-1170504.jpeg',
    content_type: 'photo',
    category: 'tournament'
  }
];

export default function GalleryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch(`${API}/gallery`)
      .then(r => r.json())
      .then(data => {
        if (data.length > 0) {
          setItems(data);
        } else {
          setItems(mockGalleryItems);
        }
        setLoading(false);
      })
      .catch(() => {
        setItems(mockGalleryItems);
        setLoading(false);
      });
  }, []);

  const categories = ['all', 'tournament', 'course', 'experience', 'players'];
  
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesType = selectedType === 'all' || item.content_type === selectedType;
    return matchesCategory && matchesType;
  });

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const navigateLightbox = (direction) => {
    if (direction === 'prev') {
      setCurrentIndex((prev) => (prev === 0 ? filteredItems.length - 1 : prev - 1));
    } else {
      setCurrentIndex((prev) => (prev === filteredItems.length - 1 ? 0 : prev + 1));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div data-testid="gallery-page">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container-custom">
          <Badge className="bg-accent text-accent-foreground mb-4 px-4 py-2">
            Media Gallery
          </Badge>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Photos & Videos
          </h1>
          <p className="text-primary-foreground/80 text-lg font-body max-w-2xl">
            Explore moments from the Magical Kenya Open through our official gallery
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b border-border/40 sticky top-20 bg-background z-40">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="capitalize whitespace-nowrap"
                  data-testid={`gallery-category-${cat}`}
                >
                  {cat}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('all')}
              >
                All
              </Button>
              <Button
                variant={selectedType === 'photo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('photo')}
              >
                <Camera className="w-4 h-4 mr-1" /> Photos
              </Button>
              <Button
                variant={selectedType === 'video' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('video')}
              >
                <Video className="w-4 h-4 mr-1" /> Videos
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="section-spacing">
        <div className="container-custom">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground font-body">No items found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item, index) => (
                <Card 
                  key={item.item_id}
                  className="card-default group cursor-pointer overflow-hidden"
                  onClick={() => openLightbox(index)}
                  data-testid={`gallery-item-${item.item_id}`}
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img 
                      src={item.media_url} 
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {item.content_type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="w-8 h-8 text-primary ml-1" />
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white translate-y-full group-hover:translate-y-0 transition-transform">
                      <h3 className="font-heading text-lg font-bold">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-white/80 font-body">{item.description}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl p-0 bg-black border-0">
          <DialogTitle className="sr-only">
            {filteredItems[currentIndex]?.title || 'Gallery Image'}
          </DialogTitle>
          <div className="relative">
            {/* Close button */}
            <button 
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
              data-testid="lightbox-close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Navigation */}
            <button 
              onClick={() => navigateLightbox('prev')}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
              data-testid="lightbox-prev"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => navigateLightbox('next')}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
              data-testid="lightbox-next"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Image */}
            {filteredItems[currentIndex] && (
              <div>
                <img 
                  src={filteredItems[currentIndex].media_url}
                  alt={filteredItems[currentIndex].title}
                  className="w-full max-h-[80vh] object-contain"
                />
                <div className="p-4 bg-black text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading text-lg font-bold">
                        {filteredItems[currentIndex].title}
                      </h3>
                      {filteredItems[currentIndex].description && (
                        <p className="text-sm text-white/70 font-body">
                          {filteredItems[currentIndex].description}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-white/50">
                      {currentIndex + 1} / {filteredItems.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
