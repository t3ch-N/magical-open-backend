import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Trophy, Award, Star, Calendar, Flag, Target, User } from 'lucide-react';
import { API } from '../App';

// Tournament Records (static - rarely changes)
const tournamentRecords = [
  { record: 'Lowest Winning Score', holder: 'Shubhankar Sharma (2018)', value: '-23 (265)' },
  { record: 'Largest Winning Margin', holder: 'Guido Migliozzi (2019)', value: '5 shots' },
  { record: 'Most Consecutive Wins', holder: 'None (Unique winners)', value: 'N/A' },
  { record: 'Lowest Single Round', holder: 'Various', value: '62 (-10)' },
  { record: 'Most Kenya Open Appearances', holder: 'Dismas Indiza (KEN)', value: '15 appearances' }
];

export default function HallOfFamePage() {
  const [champions, setChampions] = useState([]);
  const [inductees, setInductees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHofData();
  }, []);

  const fetchHofData = async () => {
    try {
      // Fetch full data from CMS - ALL entries, not just those with images
      const response = await fetch(`${API}/hall-of-fame/full`);
      if (response.ok) {
        const data = await response.json();
        if (data.champions?.length > 0) setChampions(data.champions);
        if (data.inductees?.length > 0) setInductees(data.inductees);
      }
    } catch (error) {
      console.log('Failed to fetch Hall of Fame data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#D50032] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 md:py-20 bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d]">
        <div className="container mx-auto px-4 text-center">
          <Badge className="bg-[#D50032] text-white mb-4">Celebrating Excellence</Badge>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-3">
            Hall of Fame
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto">
            Honoring the legends, champions, and contributors who have shaped the rich history of the Kenya Open
          </p>
        </div>
      </section>

      {/* Past Champions Section */}
      <section className="py-12 md:py-16" data-testid="past-champions">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Trophy className="w-7 h-7 text-[#D50032]" />
            <div>
              <Badge className="bg-[#D50032]/10 text-[#D50032] mb-1">Champions</Badge>
              <h2 className="font-heading text-2xl md:text-3xl font-bold">Kenya Open Winners</h2>
            </div>
          </div>

          {/* Champions Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-[#373A36] text-white">
                  <th className="text-left p-4 font-semibold">Year</th>
                  <th className="text-left p-4 font-semibold">Champion</th>
                  <th className="text-left p-4 font-semibold">Country</th>
                  <th className="text-left p-4 font-semibold">Score</th>
                  <th className="text-left p-4 font-semibold hidden md:table-cell">Venue</th>
                  <th className="text-left p-4 font-semibold hidden lg:table-cell">Prize Fund</th>
                </tr>
              </thead>
              <tbody>
                {champions.map((champion, index) => (
                  <tr key={champion.year} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-muted/30'} hover:bg-[#D50032]/5 transition-colors`}>
                    <td className="p-4">
                      <span className="font-bold text-[#D50032] text-lg">{champion.year}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 flex-shrink-0">
                          <div className="absolute inset-0 bg-[#D50032]/10 rounded-full flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-[#D50032]" />
                          </div>
                          {champion.image && (
                            <img 
                              src={champion.image} 
                              alt="" 
                              className="absolute inset-0 w-10 h-10 rounded-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                        </div>
                        <span className="font-semibold">{champion.winner}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-muted-foreground" />
                        <span>{champion.countryCode}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-[#D50032]">{champion.score}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{champion.venue}</td>
                    <td className="p-4 hidden lg:table-cell">{champion.purse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Hall of Fame Inductees Section */}
      <section className="py-12 md:py-16 bg-muted/30" data-testid="hof-inductees">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Award className="w-7 h-7 text-[#D50032]" />
            <div>
              <Badge className="bg-[#D50032]/10 text-[#D50032] mb-1">Inductees</Badge>
              <h2 className="font-heading text-2xl md:text-3xl font-bold">Hall of Fame Honorees</h2>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-8 max-w-3xl">
            The Magical Kenya Open Hall of Fame was established to honor individuals who have made 
            exceptional contributions to the tournament and Kenyan golf.
          </p>

          {/* Inductees Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inductees.map((inductee) => (
              <Card key={inductee.name} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <div className="absolute inset-0 bg-[#D50032]/10 rounded-full flex items-center justify-center">
                      <User className="w-7 h-7 text-[#D50032]" />
                    </div>
                    {inductee.image && (
                      <img 
                        src={inductee.image} 
                        alt="" 
                        className="absolute inset-0 w-14 h-14 rounded-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{inductee.category}</Badge>
                      <Badge className="bg-[#D50032] text-white text-xs">{inductee.year}</Badge>
                    </div>
                    <h3 className="font-heading font-bold text-lg mb-1">{inductee.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{inductee.achievement}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tournament Records Section */}
      <section className="py-12 md:py-16" data-testid="records">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Target className="w-7 h-7 text-[#D50032]" />
            <div>
              <Badge className="bg-[#D50032]/10 text-[#D50032] mb-1">Records</Badge>
              <h2 className="font-heading text-2xl md:text-3xl font-bold">Tournament Records</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournamentRecords.map((record, index) => (
              <Card key={index} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#D50032]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-[#D50032]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base mb-1">{record.record}</h4>
                    <p className="text-sm text-muted-foreground">{record.holder}</p>
                    <p className="text-[#D50032] font-bold text-lg">{record.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About the Award Section */}
      <section className="py-12 md:py-16 bg-[#373A36] text-white">
        <div className="container mx-auto px-4 text-center">
          <Award className="w-12 h-12 mx-auto mb-4 text-[#D50032]" />
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
            About the Hall of Fame
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-6">
            The Magical Kenya Open Hall of Fame recognizes outstanding individuals who have made 
            significant contributions to the tournament's success and the development of golf in Kenya.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D50032]" />
              <span>Established 2019</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#D50032]" />
              <span>{champions.length} Champions</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#D50032]" />
              <span>{inductees.length} Inductees</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
