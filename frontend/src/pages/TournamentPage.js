import React, { useState, useEffect } from 'react';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Calendar, 
  MapPin, 
  Trophy, 
  Users,
  Clock,
  Flag,
  Target
} from 'lucide-react';

const COURSE_BG = "https://www.karencountryclub.org/getmedia/3d060c0f-c792-4a0b-9245-1eea0962a8ad/DJI_1;.aspx?ext=.jpg";

// Past Kenya Open Winners
const pastWinnersData = [
  { year: 2025, winner: 'Jacques Kruyswijk', country: 'South Africa', countryCode: 'RSA', score: '-17 (271)', venue: 'Muthaiga Golf Club' },
  { year: 2024, winner: 'Darius van Driel', country: 'Netherlands', countryCode: 'NED', score: '-20 (268)', venue: 'Muthaiga Golf Club' },
  { year: 2023, winner: 'Jorge Campillo', country: 'Spain', countryCode: 'ESP', score: '-18 (266)', venue: 'Muthaiga Golf Club' },
  { year: 2022, winner: 'Wu Ashun', country: 'China', countryCode: 'CHN', score: '-17 (271)', venue: 'Muthaiga Golf Club' },
  { year: 2021, winner: 'Justin Harding', country: 'South Africa', countryCode: 'RSA', score: '-18 (270)', venue: 'Karen Country Club' },
  { year: 2019, winner: 'Guido Migliozzi', country: 'Italy', countryCode: 'ITA', score: '-22 (266)', venue: 'Karen Country Club' },
  { year: 2018, winner: 'Shubhankar Sharma', country: 'India', countryCode: 'IND', score: '-23 (265)', venue: 'Karen Country Club' },
  { year: 2017, winner: 'Francesco Molinari', country: 'Italy', countryCode: 'ITA', score: '-18 (270)', venue: 'Karen Country Club' },
];

export default function TournamentPage() {
  const [info, setInfo] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [pastWinners, setPastWinners] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/tournament/info`).then(r => r.json()).catch(() => null),
      fetch(`${API}/tournament/schedule`).then(r => r.json()).catch(() => []),
      fetch(`${API}/tournament/past-winners`).then(r => r.json()).catch(() => [])
    ]).then(([infoData, scheduleData, winnersData]) => {
      setInfo(infoData);
      setSchedule(scheduleData);
      setPastWinners(winnersData);
    });
  }, []);

  return (
    <div data-testid="tournament-page">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${COURSE_BG})` }}
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative z-10 container-custom text-center">
          <Badge className="bg-secondary text-white mb-4 px-4 py-2">
            DP World Tour
          </Badge>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-4">
            The Tournament
          </h1>
          <p className="text-white/80 text-lg font-body max-w-2xl mx-auto">
            March 2026 • Karen Country Club
          </p>
        </div>
      </section>

      {/* Quick Info */}
      <section className="bg-primary text-primary-foreground py-8">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <Trophy className="w-6 h-6 mx-auto mb-2 text-accent" />
              <div className="font-subheading text-xl font-bold">$2,700,000</div>
              <div className="text-xs uppercase tracking-wider text-primary-foreground/70">Prize Fund</div>
            </div>
            <div>
              <Target className="w-6 h-6 mx-auto mb-2 text-accent" />
              <div className="font-subheading text-xl font-bold">Par 72</div>
              <div className="text-xs uppercase tracking-wider text-primary-foreground/70">Course</div>
            </div>
            <div>
              <Flag className="w-6 h-6 mx-auto mb-2 text-accent" />
              <div className="font-subheading text-xl font-bold">6,818</div>
              <div className="text-xs uppercase tracking-wider text-primary-foreground/70">Yards</div>
            </div>
            <div>
              <Users className="w-6 h-6 mx-auto mb-2 text-accent" />
              <div className="font-subheading text-xl font-bold">144</div>
              <div className="text-xs uppercase tracking-wider text-primary-foreground/70">Players</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-spacing">
        <div className="container-custom">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="w-full justify-start mb-8 bg-muted overflow-x-auto">
              <TabsTrigger value="about" className="font-subheading uppercase tracking-wider">About</TabsTrigger>
              <TabsTrigger value="course" className="font-subheading uppercase tracking-wider">The Course</TabsTrigger>
              <TabsTrigger value="schedule" className="font-subheading uppercase tracking-wider">Schedule</TabsTrigger>
              <TabsTrigger value="history" className="font-subheading uppercase tracking-wider">Past Winners</TabsTrigger>
            </TabsList>

            <TabsContent value="about" data-testid="tab-about">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                  <h2 className="font-heading text-3xl font-bold mb-6">About the Tournament</h2>
                  <div className="prose prose-lg font-body text-muted-foreground">
                    <p className="mb-4">
                      The Magical Kenya Open is one of Africa&apos;s most prestigious golf tournaments, 
                      part of the DP World Tour. Held annually in Kenya, it showcases world-class 
                      golf while celebrating the country&apos;s rich culture and stunning landscapes.
                    </p>
                    <p className="mb-4">
                      The 2026 edition returns to the iconic Karen Country Club, featuring a 
                      world-class field of 144 players competing for the $2,700,000 prize fund - 
                      the largest in the tournament&apos;s history.
                    </p>
                    <p>
                      With its rich history dating back to 1967, the Kenya Open has grown to become 
                      a highlight of the African golfing calendar, promoting tourism and sports 
                      development across the continent.
                    </p>
                  </div>
                </div>
                <div>
                  <Card className="card-default overflow-hidden">
                    <img 
                      src="https://customer-assets.emergentagent.com/job_mkopen-dashboard/artifacts/9xta5y54_b25lY21zOmJlZGY0NGJiLTBkNzgtNDY0OS05N2NmLTMyMWVhYzE4ODdkYTpkZjQxZWY0MC02MDliLTQ4NTQtYjlhMi03ZWJiZDJiOGZkZjQ%3D.avif"
                      alt="2025 Champion"
                      className="w-full h-64 object-cover"
                    />
                    <CardContent className="p-6">
                      <Badge className="bg-accent text-accent-foreground mb-2">Defending Champion</Badge>
                      <h3 className="font-heading text-xl font-bold mb-2">Jacques Kruyswijk (RSA)</h3>
                      <p className="text-muted-foreground font-body">
                        The 2025 champion returns to defend his title at Karen Country Club. 
                        Kruyswijk won at Muthaiga with a score of -17 (271).
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="course" data-testid="tab-course">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                  <h2 className="font-heading text-3xl font-bold mb-6">Karen Country Club</h2>
                  <div className="prose prose-lg font-body text-muted-foreground">
                    <p className="mb-4">
                      Karen Country Club, established in 1937, is one of Kenya&apos;s most prestigious 
                      golf courses. Located in the beautiful Karen suburb of Nairobi, the club offers a 
                      championship-caliber test of golf in stunning surroundings.
                    </p>
                    <p className="mb-4">
                      The course features beautifully manicured fairways lined with indigenous 
                      trees, strategic bunkers, and well-protected greens that reward precise 
                      shot-making and course management.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <Card className="card-default">
                      <CardContent className="p-4 text-center">
                        <div className="font-subheading text-2xl font-bold text-primary">18</div>
                        <div className="text-sm text-muted-foreground">Holes</div>
                      </CardContent>
                    </Card>
                    <Card className="card-default">
                      <CardContent className="p-4 text-center">
                        <div className="font-subheading text-2xl font-bold text-primary">{info?.course_par || 72}</div>
                        <div className="text-sm text-muted-foreground">Par</div>
                      </CardContent>
                    </Card>
                    <Card className="card-default">
                      <CardContent className="p-4 text-center">
                        <div className="font-subheading text-2xl font-bold text-primary">{info?.course_yards || '6,818'}</div>
                        <div className="text-sm text-muted-foreground">Yards</div>
                      </CardContent>
                    </Card>
                    <Card className="card-default">
                      <CardContent className="p-4 text-center">
                        <div className="font-subheading text-2xl font-bold text-primary">1937</div>
                        <div className="text-sm text-muted-foreground">Established</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                <div>
                  <img 
                    src={COURSE_BG}
                    alt="Karen Country Club"
                    className="w-full h-full object-cover min-h-[400px]"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" data-testid="tab-schedule">
              <h2 className="font-heading text-3xl font-bold mb-8">Tournament Schedule</h2>
              <div className="space-y-4">
                {schedule.map((item, i) => (
                  <Card key={i} className="card-default">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="font-subheading text-2xl font-bold text-primary">{item.date}</div>
                          <div className="text-sm text-muted-foreground">{item.day}</div>
                        </div>
                        <div>
                          <h3 className="font-heading text-xl font-bold">{item.event}</h3>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Clock className="w-4 h-4" />
                            {item.time}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">{item.event.includes('Round') ? 'Competition' : 'Event'}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="history" data-testid="tab-history">
              <h2 className="font-heading text-3xl font-bold mb-8">Past Champions</h2>
              <Card className="card-default overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-primary text-primary-foreground">
                      <tr>
                        <th className="px-6 py-4 text-left font-subheading font-semibold uppercase tracking-wider">Year</th>
                        <th className="px-6 py-4 text-left font-subheading font-semibold uppercase tracking-wider">Champion</th>
                        <th className="px-6 py-4 text-left font-subheading font-semibold uppercase tracking-wider">Country</th>
                        <th className="px-6 py-4 text-center font-subheading font-semibold uppercase tracking-wider">Score</th>
                        <th className="px-6 py-4 text-left font-subheading font-semibold uppercase tracking-wider hidden md:table-cell">Venue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastWinnersData.map((winner, i) => (
                        <tr key={i} className="border-b border-border/40 hover:bg-muted/50">
                          <td className="px-6 py-4 font-subheading font-bold text-lg">{winner.year}</td>
                          <td className="px-6 py-4 font-body font-medium">{winner.winner}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline">{winner.countryCode}</Badge>
                            <span className="ml-2 text-muted-foreground text-sm hidden sm:inline">{winner.country}</span>
                          </td>
                          <td className="px-6 py-4 text-center font-subheading font-bold text-primary">
                            {winner.score}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground text-sm hidden md:table-cell">{winner.venue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
