import React, { useState, useEffect } from 'react';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from 'sonner';
import { 
  Trophy,
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  RefreshCw,
  Search,
  FileText,
  Settings,
  Globe,
  Lock,
  UserCheck,
  DollarSign,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Save,
  Star
} from 'lucide-react';

const statusColors = {
  submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  paid: 'bg-emerald-100 text-emerald-800',
  confirmed: 'bg-teal-100 text-teal-800',
  cancelled: 'bg-gray-100 text-gray-800',
  assigned: 'bg-purple-100 text-purple-800'
};

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  received: 'bg-blue-100 text-blue-800',
  verified: 'bg-green-100 text-green-800',
  waived: 'bg-gray-100 text-gray-800'
};

export default function ProAmManagement({ canManage = true }) {
  const [activeTab, setActiveTab] = useState('registrations');
  const [registrations, setRegistrations] = useState([]);
  const [teeTimes, setTeeTimes] = useState([]);
  const [settings, setSettings] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTeeTimeModal, setShowTeeTimeModal] = useState(false);
  const [selectedTeeTime, setSelectedTeeTime] = useState(null);
  
  // Form states
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [newTeeTime, setNewTeeTime] = useState({
    tee_number: 1,
    tee_time: '07:00',
    professional_name: '',
    wave: 'morning'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRegistrations(),
        fetchTeeTimes(),
        fetchSettings(),
        fetchStats()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const response = await fetch(`${API}/pro-am/registrations`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data);
      }
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    }
  };

  const fetchTeeTimes = async () => {
    try {
      const response = await fetch(`${API}/pro-am/tee-times`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setTeeTimes(data);
      }
    } catch (error) {
      console.error('Failed to fetch tee times:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API}/pro-am/settings`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API}/pro-am/stats`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const updateRegistration = async (registrationId, updates) => {
    try {
      const response = await fetch(`${API}/pro-am/registrations/${registrationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        toast.success('Registration updated');
        fetchRegistrations();
        fetchStats();
        if (updates.status) {
          setShowDetailModal(false);
        }
      } else {
        toast.error('Failed to update registration');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const response = await fetch(`${API}/pro-am/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newSettings)
      });
      
      if (response.ok) {
        toast.success('Settings updated');
        fetchSettings();
      } else {
        toast.error('Failed to update settings');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const publishDraw = async () => {
    try {
      const response = await fetch(`${API}/pro-am/publish-draw`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast.success('Draw published successfully');
        fetchSettings();
      } else {
        toast.error('Failed to publish draw');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const unpublishDraw = async () => {
    try {
      const response = await fetch(`${API}/pro-am/unpublish-draw`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast.success('Draw unpublished');
        fetchSettings();
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const createTeeTime = async () => {
    try {
      const response = await fetch(`${API}/pro-am/tee-times`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newTeeTime)
      });
      
      if (response.ok) {
        toast.success('Tee time created');
        setShowTeeTimeModal(false);
        setNewTeeTime({ tee_number: 1, tee_time: '07:00', professional_name: '', wave: 'morning' });
        fetchTeeTimes();
      } else {
        toast.error('Failed to create tee time');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const assignPlayerToTeeTime = async (teeTimeId, playerId) => {
    try {
      const response = await fetch(`${API}/pro-am/tee-times/${teeTimeId}/assign-player?player_id=${playerId}`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast.success('Player assigned');
        fetchTeeTimes();
        fetchRegistrations();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to assign player');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const removePlayerFromTeeTime = async (teeTimeId, playerId) => {
    try {
      const response = await fetch(`${API}/pro-am/tee-times/${teeTimeId}/remove-player?player_id=${playerId}`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast.success('Player removed');
        fetchTeeTimes();
        fetchRegistrations();
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const checkInPlayer = async (registrationId) => {
    try {
      const response = await fetch(`${API}/pro-am/check-in/${registrationId}`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast.success('Player checked in');
        fetchRegistrations();
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  // Filter registrations
  const filteredRegistrations = registrations.filter(reg => {
    if (statusFilter !== 'all' && reg.status !== statusFilter) return false;
    if (paymentFilter !== 'all' && reg.payment_status !== paymentFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        reg.full_name?.toLowerCase().includes(term) ||
        reg.email?.toLowerCase().includes(term) ||
        reg.home_club?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Get unassigned approved players
  const unassignedPlayers = registrations.filter(
    r => (r.status === 'approved' || r.status === 'paid' || r.status === 'confirmed') && !r.tee_time_id
  );

  return (
    <div className="space-y-6" data-testid="proam-management">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="registrations" className="gap-2">
            <Users className="w-4 h-4" /> Registrations
          </TabsTrigger>
          <TabsTrigger value="tee-times" className="gap-2">
            <Clock className="w-4 h-4" /> Tee Times
          </TabsTrigger>
          <TabsTrigger value="check-in" className="gap-2">
            <UserCheck className="w-4 h-4" /> Check-In
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* Registrations Tab */}
        <TabsContent value="registrations" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.by_status?.submitted || 0}</p>
                <p className="text-sm text-blue-700">Pending</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{stats.by_status?.approved || 0}</p>
                <p className="text-sm text-green-700">Approved</p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-emerald-600">{stats.by_payment?.verified || 0}</p>
                <p className="text-sm text-emerald-700">Paid</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-red-600">{stats.by_status?.rejected || 0}</p>
                <p className="text-sm text-red-700">Rejected</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-gray-600">{stats.total_registrations || 0}</p>
                <p className="text-sm text-gray-700">Total</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Pro-Am Registrations</CardTitle>
                  <CardDescription>{stats.spots_remaining || 0} spots remaining</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={fetchRegistrations}>
                    <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`${API}/pro-am/export/registrations`, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-1" /> Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, club..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="waived">Waived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Player</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Handicap</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Club</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Payment</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Submitted</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map(reg => (
                      <tr key={reg.registration_id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <p className="font-medium">{reg.full_name}</p>
                          <p className="text-xs text-muted-foreground">{reg.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">
                            {reg.handicap} ({reg.gender === 'male' ? 'M' : 'F'})
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">{reg.home_club}</td>
                        <td className="px-4 py-3">
                          <Badge className={statusColors[reg.status]}>{reg.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={paymentStatusColors[reg.payment_status]}>
                            {reg.payment_status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(reg.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setSelectedRegistration(reg);
                                setReviewerNotes(reg.reviewer_notes || '');
                                setShowDetailModal(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canManage && reg.status === 'submitted' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-green-600"
                                  onClick={() => updateRegistration(reg.registration_id, { status: 'approved' })}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600"
                                  onClick={() => updateRegistration(reg.registration_id, { status: 'rejected' })}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredRegistrations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No registrations found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tee Times Tab */}
        <TabsContent value="tee-times" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Tee Times & Pairings</CardTitle>
                  <CardDescription>
                    {settings.draw_published ? (
                      <span className="flex items-center gap-2 text-green-600">
                        <Globe className="w-4 h-4" /> Draw is published
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-yellow-600">
                        <Lock className="w-4 h-4" /> Draw not published
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {canManage && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setShowTeeTimeModal(true)}>
                        <Plus className="w-4 h-4 mr-1" /> Add Tee Time
                      </Button>
                      {settings.draw_published ? (
                        <Button variant="outline" size="sm" onClick={unpublishDraw}>
                          <Lock className="w-4 h-4 mr-1" /> Unpublish
                        </Button>
                      ) : (
                        <Button size="sm" onClick={publishDraw}>
                          <Globe className="w-4 h-4 mr-1" /> Publish Draw
                        </Button>
                      )}
                    </>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`${API}/pro-am/export/tee-sheet`, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-1" /> Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Unassigned Players */}
              {unassignedPlayers.length > 0 && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {unassignedPlayers.length} Unassigned Players
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {unassignedPlayers.slice(0, 10).map(p => (
                      <Badge key={p.registration_id} variant="outline">
                        {p.full_name} ({p.handicap})
                      </Badge>
                    ))}
                    {unassignedPlayers.length > 10 && (
                      <Badge variant="outline">+{unassignedPlayers.length - 10} more</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Tee Times Grid */}
              <div className="space-y-4">
                {teeTimes.map(tt => (
                  <Card key={tt.tee_time_id} className="border">
                    <CardContent className="py-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="text-center bg-primary text-primary-foreground px-4 py-2 rounded-lg min-w-[80px]">
                            <p className="text-lg font-bold">{tt.tee_time}</p>
                            <p className="text-xs opacity-80">Tee {tt.tee_number}</p>
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-accent" />
                            <span className="font-semibold">{tt.professional_name || 'TBD'}</span>
                            <Badge variant="outline" className="text-xs">PRO</Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {tt.players?.map((player, i) => (
                              <div key={i} className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                                <span className="text-sm">{player.name} ({player.handicap})</span>
                                {canManage && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-5 w-5 p-0"
                                    onClick={() => removePlayerFromTeeTime(tt.tee_time_id, player.id)}
                                  >
                                    <XCircle className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            {(tt.players?.length || 0) < 3 && canManage && (
                              <Select 
                                value=""
                                onValueChange={(playerId) => assignPlayerToTeeTime(tt.tee_time_id, playerId)}
                              >
                                <SelectTrigger className="w-40 h-8">
                                  <SelectValue placeholder="+ Add Player" />
                                </SelectTrigger>
                                <SelectContent>
                                  {unassignedPlayers.map(p => (
                                    <SelectItem key={p.registration_id} value={p.registration_id}>
                                      {p.full_name} ({p.handicap})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                        
                        <Badge variant="outline" className="uppercase">
                          {tt.wave}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {teeTimes.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No tee times created yet</p>
                    {canManage && (
                      <Button variant="outline" className="mt-4" onClick={() => setShowTeeTimeModal(true)}>
                        <Plus className="w-4 h-4 mr-1" /> Create First Tee Time
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Check-In Tab */}
        <TabsContent value="check-in" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Day-of Check-In</CardTitle>
              <CardDescription>Mark players as arrived on tournament day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {registrations
                  .filter(r => r.status === 'confirmed' || r.status === 'assigned')
                  .map(reg => (
                    <div 
                      key={reg.registration_id} 
                      className={`flex items-center justify-between p-4 border rounded-lg ${reg.checked_in ? 'bg-green-50 border-green-200' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        {reg.checked_in ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : (
                          <div className="w-6 h-6 border-2 rounded-full" />
                        )}
                        <div>
                          <p className="font-medium">{reg.full_name}</p>
                          <p className="text-sm text-muted-foreground">{reg.home_club} • Handicap {reg.handicap}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {reg.checked_in && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(reg.checked_in_at).toLocaleTimeString()}
                          </span>
                        )}
                        {canManage && (
                          <Button
                            variant={reg.checked_in ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => reg.checked_in 
                              ? updateRegistration(reg.registration_id, { checked_in: false })
                              : checkInPlayer(reg.registration_id)
                            }
                          >
                            {reg.checked_in ? 'Undo' : 'Check In'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                {registrations.filter(r => r.status === 'confirmed' || r.status === 'assigned').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No confirmed players to check in
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pro-Am Settings</CardTitle>
              <CardDescription>Configure registration and event settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Registration Open</Label>
                    <p className="text-sm text-muted-foreground">Allow new registrations</p>
                  </div>
                  <Checkbox
                    checked={settings.registration_open}
                    onCheckedChange={(checked) => updateSettings({ registration_open: checked })}
                    disabled={!canManage}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Draw Published</Label>
                    <p className="text-sm text-muted-foreground">Show tee times publicly</p>
                  </div>
                  <Checkbox
                    checked={settings.draw_published}
                    onCheckedChange={(checked) => updateSettings({ draw_published: checked })}
                    disabled={!canManage}
                  />
                </div>
                
                <div>
                  <Label>Max Capacity</Label>
                  <Input
                    type="number"
                    value={settings.max_capacity || 60}
                    onChange={(e) => updateSettings({ max_capacity: parseInt(e.target.value) })}
                    disabled={!canManage}
                  />
                </div>
                
                <div>
                  <Label>Entry Fee (KES)</Label>
                  <Input
                    type="number"
                    value={settings.entry_fee || 30000}
                    onChange={(e) => updateSettings({ entry_fee: parseInt(e.target.value) })}
                    disabled={!canManage}
                  />
                </div>
                
                <div>
                  <Label>Pro-Am Date</Label>
                  <Input
                    type="date"
                    value={settings.proam_date || '2026-02-19'}
                    onChange={(e) => updateSettings({ proam_date: e.target.value })}
                    disabled={!canManage}
                  />
                </div>
                
                <div>
                  <Label>First Tee Time</Label>
                  <Input
                    type="time"
                    value={settings.first_tee_time || '07:00'}
                    onChange={(e) => updateSettings({ first_tee_time: e.target.value })}
                    disabled={!canManage}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Registration Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge className={statusColors[selectedRegistration.status]}>
                  {selectedRegistration.status}
                </Badge>
                <Badge className={paymentStatusColors[selectedRegistration.payment_status]}>
                  Payment: {selectedRegistration.payment_status}
                </Badge>
                {selectedRegistration.documents_verified && (
                  <Badge className="bg-green-100 text-green-800">Docs Verified</Badge>
                )}
                {selectedRegistration.handicap_verified && (
                  <Badge className="bg-green-100 text-green-800">Handicap Verified</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{selectedRegistration.full_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p>{selectedRegistration.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p>{selectedRegistration.phone}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Gender</Label>
                  <p className="capitalize">{selectedRegistration.gender}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Handicap</Label>
                  <p className="font-semibold">{selectedRegistration.handicap}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Home Club</Label>
                  <p>{selectedRegistration.home_club}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Nationality</Label>
                  <p>{selectedRegistration.nationality}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Shirt Size</Label>
                  <p>{selectedRegistration.shirt_size}</p>
                </div>
                {selectedRegistration.company_name && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Company</Label>
                    <p>{selectedRegistration.company_name} - {selectedRegistration.company_position}</p>
                  </div>
                )}
                {selectedRegistration.dietary_requirements && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Dietary Requirements</Label>
                    <p>{selectedRegistration.dietary_requirements}</p>
                  </div>
                )}
              </div>

              {/* Verification Checkboxes */}
              {canManage && (
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-semibold text-sm">Verification</h4>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedRegistration.documents_verified}
                        onCheckedChange={(checked) => 
                          updateRegistration(selectedRegistration.registration_id, { documents_verified: checked })
                        }
                      />
                      <Label>Documents Verified</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedRegistration.handicap_verified}
                        onCheckedChange={(checked) => 
                          updateRegistration(selectedRegistration.registration_id, { handicap_verified: checked })
                        }
                      />
                      <Label>Handicap Verified</Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Status */}
              {canManage && (
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-semibold text-sm">Payment Status</h4>
                  <Select 
                    value={selectedRegistration.payment_status}
                    onValueChange={(v) => updateRegistration(selectedRegistration.registration_id, { payment_status: v })}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="waived">Waived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Reviewer Notes */}
              {canManage && (
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-semibold text-sm">Reviewer Notes</h4>
                  <Textarea
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateRegistration(selectedRegistration.registration_id, { reviewer_notes: reviewerNotes })}
                  >
                    Save Notes
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>Close</Button>
            {canManage && selectedRegistration?.status === 'submitted' && (
              <>
                <Button 
                  variant="outline" 
                  className="text-red-600"
                  onClick={() => updateRegistration(selectedRegistration.registration_id, { status: 'rejected', reviewer_notes: reviewerNotes })}
                >
                  Reject
                </Button>
                <Button 
                  onClick={() => updateRegistration(selectedRegistration.registration_id, { status: 'approved', reviewer_notes: reviewerNotes })}
                >
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tee Time Modal */}
      <Dialog open={showTeeTimeModal} onOpenChange={setShowTeeTimeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Tee Time</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tee Number</Label>
                <Select 
                  value={String(newTeeTime.tee_number)} 
                  onValueChange={(v) => setNewTeeTime({...newTeeTime, tee_number: parseInt(v)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Tee 1</SelectItem>
                    <SelectItem value="10">Tee 10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tee Time</Label>
                <Input
                  type="time"
                  value={newTeeTime.tee_time}
                  onChange={(e) => setNewTeeTime({...newTeeTime, tee_time: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Professional Name</Label>
              <Input
                value={newTeeTime.professional_name}
                onChange={(e) => setNewTeeTime({...newTeeTime, professional_name: e.target.value})}
                placeholder="Enter professional golfer name"
              />
            </div>
            <div>
              <Label>Wave</Label>
              <Select 
                value={newTeeTime.wave} 
                onValueChange={(v) => setNewTeeTime({...newTeeTime, wave: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTeeTimeModal(false)}>Cancel</Button>
            <Button onClick={createTeeTime}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
