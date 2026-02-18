import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../App';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Link } from 'react-router-dom';
import { 
  Trophy,
  Calendar,
  MapPin,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Flag,
  Clock,
  User,
  Star
} from 'lucide-react';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [teeTimes, setTeeTimes] = useState([]);
  const [kenyanPlayers, setKenyanPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [source, setSource] = useState('local');
  const [activeTab, setActiveTab] = useState('leaderboard');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [showKenyanOnly, setShowKenyanOnly] = useState(false);
  const [selectedRound, setSelectedRound] = useState(null);
  const [topN, setTopN] = useState(null);
  
  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);
  const REFRESH_INTERVAL = 20000; // 20 seconds to match backend cache TTL

  const fetchLeaderboard = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (showKenyanOnly) params.append('country', 'KEN');
      if (selectedRound) params.append('round_num', selectedRound);
      if (topN) params.append('top', topN);
      
      const response = await fetch(`${API}/leaderboard/live?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      setLeaderboard(data.entries || []);
      setSource(data.source || 'local');
      setLastUpdated(data.updated_at || new Date().toISOString());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError('Failed to load leaderboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showKenyanOnly, selectedRound, topN]);

  const fetchTeeTimes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedRound) params.append('round_num', selectedRound);
      
      const response = await fetch(`${API}/leaderboard/tee-times?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      setTeeTimes(data.tee_times || []);
    } catch (err) {
      console.error('Failed to fetch tee times:', err);
      setError('Failed to load tee times. Please try again.');
    }
  }, [selectedRound]);

  const fetchKenyanPlayers = useCallback(async () => {
    try {
      const response = await fetch(`${API}/leaderboard/kenyan-players`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      setKenyanPlayers(data.players || []);
    } catch (err) {
      console.error('Failed to fetch Kenyan players:', err);
      setError('Failed to load Kenyan players data. Please try again.');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    } else if (activeTab === 'tee-times') {
      fetchTeeTimes();
    } else if (activeTab === 'kenyan') {
      fetchKenyanPlayers();
    }
    setLoading(false);
  }, [activeTab, fetchLeaderboard, fetchTeeTimes, fetchKenyanPlayers]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      if (activeTab === 'leaderboard') {
        fetchLeaderboard();
      } else if (activeTab === 'tee-times') {
        fetchTeeTimes();
      } else if (activeTab === 'kenyan') {
        fetchKenyanPlayers();
      }
    }, REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [autoRefresh, activeTab, fetchLeaderboard, fetchTeeTimes, fetchKenyanPlayers]);

  // Filter leaderboard by search term
  const filteredLeaderboard = leaderboard.filter(entry => {
    if (!searchTerm) return true;
    const name = entry.player_name || '';
    const country = entry.country || entry.country_code || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           country.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatScore = (score) => {
    if (score === 0 || score === 'E') return 'E';
    if (score > 0) return `+${score}`;
    return score;
  };

  const getScoreClass = (score) => {
    if (score < 0) return 'text-green-600 font-bold';
    if (score > 0) return 'text-red-600 font-bold';
    return 'text-gray-600 font-bold';
  };

  // Show placeholder if no data and not loading
  if (!loading && leaderboard.length === 0 && !error) {
    return (
      <div data-testid="leaderboard-page">
        {/* Hero */}
        <section className="bg-[#373A36] text-white py-16">
          <div className="container-custom text-center">
            <Badge className="bg-[#D50032] text-white mb-4">Coming Soon</Badge>
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
              Live Leaderboard
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              The leaderboard will be activated when the tournament begins
            </p>
          </div>
        </section>

        {/* Coming Soon Content */}
        <section className="section-spacing">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto">
              <Card className="card-default overflow-hidden">
                <div className="bg-muted p-8 text-center">
                  <div className="w-24 h-24 bg-[#D50032]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trophy className="w-12 h-12 text-[#D50032]" />
                  </div>
                  <h2 className="font-heading text-2xl font-bold mb-4">
                    Leaderboard Activates During Tournament
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                    Follow all the live scoring action, player standings, and round-by-round results 
                    when the 2026 Magical Kenya Open begins at Karen Country Club.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-4 bg-background rounded-lg">
                      <Calendar className="w-6 h-6 text-[#D50032] mx-auto mb-2" />
                      <div className="font-subheading font-bold">March 2026</div>
                      <div className="text-sm text-muted-foreground">Tournament Dates</div>
                    </div>
                    <div className="p-4 bg-background rounded-lg">
                      <MapPin className="w-6 h-6 text-[#D50032] mx-auto mb-2" />
                      <div className="font-subheading font-bold">Karen Country Club</div>
                      <div className="text-sm text-muted-foreground">Nairobi, Kenya</div>
                    </div>
                    <div className="p-4 bg-background rounded-lg">
                      <Trophy className="w-6 h-6 text-[#D50032] mx-auto mb-2" />
                      <div className="font-subheading font-bold">$2,750,000</div>
                      <div className="text-sm text-muted-foreground">Prize Fund</div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/hall-of-fame">
                      <Button className="gap-2 bg-[#D50032] hover:bg-[#B8002B]">
                        View Past Champions <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link to="/tournament">
                      <Button variant="outline" className="gap-2">
                        Tournament Info
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div data-testid="leaderboard-page">
      {/* Hero */}
      <section className="bg-[#373A36] text-white py-12">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-[#D50032] text-white animate-pulse">LIVE</Badge>
                <span className="text-white/60 text-sm">
                  {source === 'etx' ? 'European Tour Data' : 'Local Data'}
                </span>
              </div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold">
                Leaderboard
              </h1>
              {lastUpdated && (
                <p className="text-white/60 text-sm mt-1">
                  Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => {
                  fetchLeaderboard();
                  fetchTeeTimes();
                }}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                className={autoRefresh ? "bg-green-600 hover:bg-green-700" : "border-white/30 text-white hover:bg-white/10"}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="bg-background border-b">
        <div className="container-custom">
          <div className="flex gap-1">
            <button
              className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                activeTab === 'leaderboard' 
                  ? 'border-[#D50032] text-[#D50032]' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('leaderboard')}
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              Leaderboard
            </button>
            <button
              className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                activeTab === 'tee-times' 
                  ? 'border-[#D50032] text-[#D50032]' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('tee-times')}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Tee Times
            </button>
            <button
              className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                activeTab === 'kenyan' 
                  ? 'border-[#D50032] text-[#D50032]' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('kenyan')}
            >
              <Flag className="w-4 h-4 inline mr-2" />
              Kenyan Players
            </button>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-muted/30 py-4">
        <div className="container-custom">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search player or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select 
                className="border rounded-md px-3 py-2 text-sm bg-background"
                value={selectedRound || ''}
                onChange={(e) => setSelectedRound(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">All Rounds</option>
                <option value="1">Round 1</option>
                <option value="2">Round 2</option>
                <option value="3">Round 3</option>
                <option value="4">Round 4</option>
              </select>
              
              <select 
                className="border rounded-md px-3 py-2 text-sm bg-background"
                value={topN || ''}
                onChange={(e) => setTopN(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">All Players</option>
                <option value="10">Top 10</option>
                <option value="25">Top 25</option>
                <option value="50">Top 50</option>
                <option value="70">Made Cut</option>
              </select>
              
              <Button
                variant={showKenyanOnly ? "default" : "outline"}
                size="sm"
                className={showKenyanOnly ? "bg-green-600 hover:bg-green-700" : ""}
                onClick={() => setShowKenyanOnly(!showKenyanOnly)}
              >
                <Flag className="w-4 h-4 mr-1" />
                Kenyan Only
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-spacing">
        <div className="container-custom">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-[#D50032]" />
              <p className="text-muted-foreground">Loading leaderboard data...</p>
            </div>
          ) : error ? (
            <Card className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchLeaderboard}>Try Again</Button>
            </Card>
          ) : activeTab === 'leaderboard' ? (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="leaderboard-table">
                  <thead className="bg-[#373A36] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">POS</th>
                      <th className="px-4 py-3 text-left font-semibold">PLAYER</th>
                      <th className="px-4 py-3 text-center font-semibold">COUNTRY</th>
                      <th className="px-4 py-3 text-center font-semibold">TODAY</th>
                      <th className="px-4 py-3 text-center font-semibold">THRU</th>
                      <th className="px-4 py-3 text-center font-semibold">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaderboard.map((entry, index) => (
                      <tr 
                        key={entry.player_id || index} 
                        className={`border-b hover:bg-muted/50 transition-colors ${
                          entry.is_kenyan ? 'bg-green-50 hover:bg-green-100' : ''
                        }`}
                        data-testid={`leaderboard-row-${index}`}
                      >
                        <td className="px-4 py-4">
                          <span className="font-bold text-lg">{entry.position || index + 1}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {entry.photo_url ? (
                              <img 
                                src={entry.photo_url} 
                                alt={entry.player_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                <User className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-semibold flex items-center gap-2">
                                {entry.player_name}
                                {entry.is_kenyan && (
                                  <Badge className="bg-green-700 text-white text-xs">KEN</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-medium">
                            {entry.country_code || entry.country || '-'}
                          </span>
                        </td>
                        <td className={`px-4 py-4 text-center ${getScoreClass(entry.today)}`}>
                          {formatScore(entry.today)}
                        </td>
                        <td className="px-4 py-4 text-center text-muted-foreground">
                          {entry.thru || '-'}
                        </td>
                        <td className={`px-4 py-4 text-center text-lg ${getScoreClass(entry.score_to_par)}`}>
                          {formatScore(entry.score_to_par)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredLeaderboard.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No players match your search criteria
                </div>
              )}
            </Card>
          ) : activeTab === 'tee-times' ? (
            <div className="space-y-4">
              <h2 className="font-heading text-2xl font-bold">
                Tee Times - Round {selectedRound || 1}
              </h2>
              
              {teeTimes.length > 0 ? (
                <div className="grid gap-4">
                  {teeTimes.map((teeTime, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-[#D50032]" />
                          <span className="font-bold text-lg">{teeTime.tee_time}</span>
                        </div>
                        <Badge variant="outline">Tee {teeTime.tee_number || 1}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        {(teeTime.players || []).map((player, pIdx) => (
                          <div 
                            key={pIdx} 
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                              player.is_kenyan ? 'bg-green-100' : 'bg-muted'
                            }`}
                          >
                            <span className="font-medium">{player.player_name}</span>
                            <span className="text-sm text-muted-foreground">
                              ({player.country_code})
                            </span>
                            {player.is_kenyan && (
                              <Flag className="w-4 h-4 text-green-700" />
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Tee times will be available closer to the tournament
                  </p>
                </Card>
              )}
            </div>
          ) : activeTab === 'kenyan' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <Flag className="w-6 h-6 text-green-700" />
                <h2 className="font-heading text-2xl font-bold">Kenyan Players</h2>
              </div>
              
              {kenyanPlayers.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {kenyanPlayers.map((player, index) => (
                    <Card key={index} className="p-4 bg-green-50 border-green-200">
                      <div className="flex items-center gap-4">
                        {player.details?.photo_url || player.photo_url ? (
                          <img 
                            src={player.details?.photo_url || player.photo_url}
                            alt={player.player_name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-green-200 flex items-center justify-center">
                            <User className="w-8 h-8 text-green-700" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-bold text-lg">{player.player_name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-green-700 text-white">
                              Position: {player.position || '-'}
                            </Badge>
                            <span className={`font-bold ${getScoreClass(player.score_to_par)}`}>
                              {formatScore(player.score_to_par)}
                            </span>
                          </div>
                        </div>
                        <Star className="w-6 h-6 text-yellow-500" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center bg-green-50">
                  <Flag className="w-12 h-12 mx-auto mb-4 text-green-700" />
                  <p className="text-green-800 font-medium">
                    Kenyan player standings will appear here during the tournament
                  </p>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}