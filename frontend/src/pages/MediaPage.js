import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Camera,
  Tv,
  Radio,
  Download,
  FileText,
  Calendar,
  Clock,
  ExternalLink,
  Mail
} from 'lucide-react';

const broadcastSchedule = [
  { day: 'Thursday', date: 'March 6', time: '12:00 - 18:00', channel: 'Sky Sports Golf' },
  { day: 'Friday', date: 'March 7', time: '12:00 - 18:00', channel: 'Sky Sports Golf' },
  { day: 'Saturday', date: 'March 8', time: '12:00 - 17:30', channel: 'Sky Sports Golf' },
  { day: 'Sunday', date: 'March 9', time: '11:00 - 17:00', channel: 'Sky Sports Golf' }
];

const mediaResources = [
  {
    title: 'Tournament Media Guide',
    description: 'Complete guide with tournament information, player stats, and venue details.',
    type: 'PDF',
    size: '5.2 MB'
  },
  {
    title: 'Press Release Pack',
    description: 'Latest press releases and official tournament announcements.',
    type: 'ZIP',
    size: '12.8 MB'
  },
  {
    title: 'Logo & Brand Assets',
    description: 'Official logos, fonts, and brand guidelines for media use.',
    type: 'ZIP',
    size: '45 MB'
  },
  {
    title: 'Course Photography',
    description: 'High-resolution images of Karen Country Club.',
    type: 'ZIP',
    size: '125 MB'
  }
];

const pressContacts = [
  {
    name: 'Media Relations',
    email: 'media@magicalkenyaopen.com',
    role: 'Press enquiries and media accreditation'
  },
  {
    name: 'Broadcast Services',
    email: 'broadcast@magicalkenyaopen.com',
    role: 'TV and streaming rights inquiries'
  }
];

export default function MediaPage() {
  return (
    <div data-testid="media-page">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container-custom">
          <Badge className="bg-accent text-accent-foreground mb-4 px-4 py-2">
            Media Centre
          </Badge>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Media & Broadcast
          </h1>
          <p className="text-primary-foreground/80 text-lg font-body max-w-2xl">
            Resources for media professionals covering the Magical Kenya Open
          </p>
        </div>
      </section>

      {/* Broadcast Schedule */}
      <section className="section-spacing">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-8">
            <Tv className="w-8 h-8 text-secondary" />
            <h2 className="font-heading text-3xl font-bold">Broadcast Schedule</h2>
          </div>
          
          <Card className="card-default overflow-hidden mb-8" data-testid="broadcast-schedule">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-4 text-left font-subheading font-semibold text-sm uppercase tracking-wider">Day</th>
                    <th className="px-6 py-4 text-left font-subheading font-semibold text-sm uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left font-subheading font-semibold text-sm uppercase tracking-wider">Time (EAT)</th>
                    <th className="px-6 py-4 text-left font-subheading font-semibold text-sm uppercase tracking-wider">Channel</th>
                  </tr>
                </thead>
                <tbody>
                  {broadcastSchedule.map((item, i) => (
                    <tr key={i} className="border-b border-border/40">
                      <td className="px-6 py-4 font-body font-medium">{item.day}</td>
                      <td className="px-6 py-4 font-body">{item.date}</td>
                      <td className="px-6 py-4 font-body">{item.time}</td>
                      <td className="px-6 py-4 font-body">{item.channel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="bg-muted p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Radio className="w-6 h-6 text-primary" />
              <div>
                <p className="font-subheading font-semibold">Live Streaming</p>
                <p className="text-muted-foreground text-sm font-body">
                  Watch live on DP World Tour website and app
                </p>
              </div>
            </div>
            <a href="https://www.dpworldtour.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                Watch Live <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Media Resources */}
      <section className="section-spacing bg-muted">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-8">
            <Download className="w-8 h-8 text-primary" />
            <h2 className="font-heading text-3xl font-bold">Media Resources</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mediaResources.map((resource, i) => (
              <Card key={i} className="card-default hover-lift" data-testid={`resource-${i}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <FileText className="w-8 h-8 text-primary" />
                    <Badge variant="outline">{resource.type}</Badge>
                  </div>
                  <h3 className="font-heading text-lg font-bold mb-2">{resource.title}</h3>
                  <p className="text-muted-foreground font-body text-sm mb-4">
                    {resource.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{resource.size}</span>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" /> Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Media Accreditation */}
      <section className="section-spacing">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Camera className="w-8 h-8 text-accent" />
                <h2 className="font-heading text-3xl font-bold">Media Accreditation</h2>
              </div>
              <div className="prose prose-lg font-body text-muted-foreground">
                <p className="mb-4">
                  Media accreditation for the Magical Kenya Open is available to bona fide 
                  journalists, photographers, and broadcasters.
                </p>
                <p className="mb-4">
                  Applications should be submitted at least 14 days before the tournament.
                  Please include your press credentials and a letter from your editor.
                </p>
                <h4 className="font-heading text-lg font-bold text-foreground mt-6 mb-2">
                  Accreditation includes:
                </h4>
                <ul className="space-y-2">
                  <li>Access to the Media Centre</li>
                  <li>Interview facilities</li>
                  <li>Press conference access</li>
                  <li>Course access (with restrictions)</li>
                  <li>Wi-Fi and work stations</li>
                </ul>
              </div>
              <Button className="btn-primary mt-6" data-testid="accreditation-btn">
                Apply for Accreditation
              </Button>
            </div>

            <div>
              <h3 className="font-heading text-2xl font-bold mb-6">Press Contacts</h3>
              <div className="space-y-4">
                {pressContacts.map((contact, i) => (
                  <Card key={i} className="card-default" data-testid={`contact-${i}`}>
                    <CardContent className="p-6">
                      <h4 className="font-subheading font-semibold mb-1">{contact.name}</h4>
                      <p className="text-muted-foreground text-sm font-body mb-3">
                        {contact.role}
                      </p>
                      <a 
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-2 text-primary hover:underline text-sm"
                      >
                        <Mail className="w-4 h-4" />
                        {contact.email}
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Press Releases */}
      <section className="section-spacing bg-primary text-primary-foreground">
        <div className="container-custom">
          <h2 className="font-heading text-3xl font-bold mb-8">Latest Press Releases</h2>
          
          <div className="space-y-4">
            {[
              { date: 'Feb 15, 2025', title: 'Field Announcement: Top Players Confirmed for 2025 Edition' },
              { date: 'Feb 1, 2025', title: 'Magical Kenya Open Launches Sustainability Initiative' },
              { date: 'Jan 20, 2025', title: 'Ticket Sales Now Open for 2025 Tournament' }
            ].map((release, i) => (
              <Card key={i} className="bg-primary-foreground/10 border-primary-foreground/20">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-primary-foreground/60 text-sm mb-1">{release.date}</p>
                    <h3 className="font-body font-medium text-primary-foreground">{release.title}</h3>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                    Read More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
