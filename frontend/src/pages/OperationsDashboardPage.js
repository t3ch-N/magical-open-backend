import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
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
  Users, 
  Building2,
  MapPin,
  Shield,
  LogOut,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Settings,
  BarChart3,
  Loader2,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  FileText,
  Briefcase,
  Camera,
  Trophy,
  ClipboardList,
  UserPlus,
  ToggleLeft,
  ToggleRight,
  Layers,
  Key,
  History,
  ClipboardCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ProAmManagement from '../components/ProAmManagement';

const KOGL_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/ft1exgdt_KOGL.png";

const moduleIcons = {
  volunteers: Users,
  vendors: Briefcase,
  media: Camera,
  pro_am: Trophy,
  procurement: ClipboardList,
  jobs: UserPlus
};

const moduleLabels = {
  volunteers: 'Volunteers',
  vendors: 'Vendors',
  media: 'Media',
  pro_am: 'Pro-Am',
  procurement: 'Procurement',
  jobs: 'Jobs'
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  assigned: 'bg-purple-100 text-purple-800',
  active: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-slate-100 text-slate-800',
  cancelled: 'bg-orange-100 text-orange-800'
};

const locationTypes = [
  { value: 'venue', label: 'Venue' },
  { value: 'area', label: 'Area' },
  { value: 'hole', label: 'Hole' },
  { value: 'facility', label: 'Facility' },
  { value: 'checkpoint', label: 'Checkpoint' }
];

const zoneTypes = [
  { value: 'public', label: 'Public' },
  { value: 'restricted', label: 'Restricted' },
  { value: 'vip', label: 'VIP' },
  { value: 'media', label: 'Media' },
  { value: 'service', label: 'Service' },
  { value: 'players', label: 'Players Only' }
];

export default function OperationsDashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  
  // Data states
  const [tournament, setTournament] = useState(null);
  const [modules, setModules] = useState([]);
  const [locations, setLocations] = useState([]);
  const [zones, setZones] = useState([]);
  const [accessLevels, setAccessLevels] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Filter states
  const [selectedModule, setSelectedModule] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmissions, setSelectedSubmissions] = useState([]);
  const [reviewerNotes, setReviewerNotes] = useState('');
  
  // Modal states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showAccessLevelModal, setShowAccessLevelModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form states
  const [newLocation, setNewLocation] = useState({ name: '', code: '', location_type: 'area', description: '', capacity: '' });
  const [newZone, setNewZone] = useState({ name: '', code: '', zone_type: 'public', location_id: '', description: '', capacity: '' });
  const [newAccessLevel, setNewAccessLevel] = useState({ name: '', code: '', tier: 5, color: '#808080', description: '' });

  const getAuthHeaders = () => {
    const sessionId = localStorage.getItem('marshal_session');
    return { 'Authorization': `Bearer ${sessionId}` };
  };

  // Helper function for authenticated file downloads
  const handleAuthenticatedDownload = async (url, filename) => {
    try {
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Download failed');
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      toast.success(`${filename} downloaded successfully`);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const sessionId = localStorage.getItem('marshal_session');
      if (!sessionId) {
        navigate('/marshal-login');
        return;
      }

      try {
        const response = await fetch(`${API}/marshal/me`, { headers: getAuthHeaders() });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('marshal_session');
          navigate('/marshal-login');
        }
      } catch {
        navigate('/marshal-login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    const headers = getAuthHeaders();
    try {
      const [tournamentRes, modulesRes, locationsRes, zonesRes, accessRes, statsRes] = await Promise.all([
        fetch(`${API}/tournaments/current`),
        fetch(`${API}/accreditation/modules`, { headers }),
        fetch(`${API}/locations`, { headers }),
        fetch(`${API}/zones`, { headers }),
        fetch(`${API}/access-levels`, { headers }),
        fetch(`${API}/accreditation/stats`, { headers })
      ]);

      if (tournamentRes.ok) setTournament(await tournamentRes.json());
      if (modulesRes.ok) setModules(await modulesRes.json());
      if (locationsRes.ok) setLocations(await locationsRes.json());
      if (zonesRes.ok) setZones(await zonesRes.json());
      if (accessRes.ok) setAccessLevels(await accessRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  // Fetch submissions
  const fetchSubmissions = useCallback(async () => {
    const headers = getAuthHeaders();
    let url = `${API}/accreditation/submissions`;
    const params = new URLSearchParams();
    if (selectedModule !== 'all') params.append('module_type', selectedModule);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (params.toString()) url += `?${params.toString()}`;

    try {
      const response = await fetch(url, { headers });
      if (response.ok) {
        let data = await response.json();
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          data = data.filter(s => 
            JSON.stringify(s.form_data).toLowerCase().includes(term) ||
            s.submission_id.toLowerCase().includes(term)
          );
        }
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  }, [selectedModule, statusFilter, searchTerm]);

  useEffect(() => {
    if (user && activeTab === 'submissions') fetchSubmissions();
  }, [user, activeTab, fetchSubmissions]);

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      const response = await fetch(`${API}/audit-logs?limit=50`, { headers: getAuthHeaders() });
      if (response.ok) setAuditLogs(await response.json());
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
  };

  useEffect(() => {
    if (user && activeTab === 'audit') fetchAuditLogs();
  }, [user, activeTab]);

  // Actions
  const handleLogout = async () => {
    await fetch(`${API}/marshal/logout`, { method: 'POST', headers: getAuthHeaders() });
    localStorage.removeItem('marshal_session');
    navigate('/marshal-login');
  };

  const handleToggleModule = async (moduleId, isActive) => {
    try {
      const response = await fetch(`${API}/accreditation/modules/${moduleId}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      });
      if (response.ok) {
        toast.success(`Module ${isActive ? 'deactivated' : 'activated'}`);
        fetchData();
      }
    } catch {
      toast.error('Failed to update module');
    }
  };

  const handleCreateLocation = async () => {
    try {
      const response = await fetch(`${API}/locations`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newLocation,
          capacity: newLocation.capacity ? parseInt(newLocation.capacity) : null
        })
      });
      if (response.ok) {
        toast.success('Location created');
        setShowLocationModal(false);
        setNewLocation({ name: '', code: '', location_type: 'area', description: '', capacity: '' });
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to create location');
      }
    } catch {
      toast.error('Failed to create location');
    }
  };

  const handleDeleteLocation = async (locationId) => {
    if (!confirm('Delete this location?')) return;
    try {
      const response = await fetch(`${API}/locations/${locationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('Location deleted');
        fetchData();
      }
    } catch {
      toast.error('Failed to delete location');
    }
  };

  const handleCreateZone = async () => {
    try {
      const response = await fetch(`${API}/zones`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newZone,
          capacity: newZone.capacity ? parseInt(newZone.capacity) : null
        })
      });
      if (response.ok) {
        toast.success('Zone created');
        setShowZoneModal(false);
        setNewZone({ name: '', code: '', zone_type: 'public', location_id: '', description: '', capacity: '' });
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to create zone');
      }
    } catch {
      toast.error('Failed to create zone');
    }
  };

  const handleDeleteZone = async (zoneId) => {
    if (!confirm('Delete this zone?')) return;
    try {
      const response = await fetch(`${API}/zones/${zoneId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('Zone deleted');
        fetchData();
      }
    } catch {
      toast.error('Failed to delete zone');
    }
  };

  const handleCreateAccessLevel = async () => {
    try {
      const response = await fetch(`${API}/access-levels`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAccessLevel,
          tier: parseInt(newAccessLevel.tier)
        })
      });
      if (response.ok) {
        toast.success('Access level created');
        setShowAccessLevelModal(false);
        setNewAccessLevel({ name: '', code: '', tier: 5, color: '#808080', description: '' });
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to create access level');
      }
    } catch {
      toast.error('Failed to create access level');
    }
  };

  const handleDeleteAccessLevel = async (levelId) => {
    if (!confirm('Delete this access level?')) return;
    try {
      const response = await fetch(`${API}/access-levels/${levelId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('Access level deleted');
        fetchData();
      }
    } catch {
      toast.error('Failed to delete access level');
    }
  };

  const handleUpdateSubmission = async (submissionId, updates) => {
    try {
      const response = await fetch(`${API}/accreditation/submissions/${submissionId}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        toast.success('Submission updated');
        fetchSubmissions();
        setShowSubmissionModal(false);
      }
    } catch {
      toast.error('Failed to update submission');
    }
  };

  const canManage = ['chief_marshal', 'tournament_director', 'operations_manager', 'admin'].includes(user?.role);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted" data-testid="operations-dashboard">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Operations Dashboard | MKO 2026</title>
      </Helmet>
      
      {/* Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={KOGL_LOGO} alt="KOGL" className="h-10" />
            <div>
              <h1 className="font-heading text-lg font-bold">Operations Dashboard</h1>
              <p className="text-xs text-primary-foreground/70">{tournament?.name || 'Loading...'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.full_name}</p>
              <Badge variant="secondary" className="text-xs">{user?.role?.replace('_', ' ')}</Badge>
            </div>
            <Link to="/marshal-dashboard">
              <Button variant="secondary" size="sm" className="gap-2">
                <ClipboardCheck className="w-4 h-4" />
                <span className="hidden md:inline">Volunteers</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-white flex-wrap">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="modules" className="gap-2">
              <Layers className="w-4 h-4" /> Modules
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-2">
              <FileText className="w-4 h-4" /> Submissions
            </TabsTrigger>
            <TabsTrigger value="proam" className="gap-2">
              <Trophy className="w-4 h-4" /> Pro-Am
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-2">
              <MapPin className="w-4 h-4" /> Locations
            </TabsTrigger>
            <TabsTrigger value="zones" className="gap-2">
              <Building2 className="w-4 h-4" /> Zones
            </TabsTrigger>
            <TabsTrigger value="access" className="gap-2">
              <Key className="w-4 h-4" /> Access Levels
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Download className="w-4 h-4" /> Badge Export
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <History className="w-4 h-4" /> Audit Log
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {modules.map(mod => {
                const Icon = moduleIcons[mod.module_type] || FileText;
                const modStats = stats[mod.module_type] || {};
                return (
                  <Card key={mod.module_id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5 text-primary" />
                          <CardTitle className="text-base">{mod.name}</CardTitle>
                        </div>
                        <Badge className={mod.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                          {mod.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{modStats.submitted || 0}</p>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{modStats.approved || 0}</p>
                          <p className="text-xs text-muted-foreground">Approved</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-600">{modStats.total || 0}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" /> Locations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{locations.length}</p>
                  <p className="text-sm text-muted-foreground">configured locations</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5" /> Zones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{zones.length}</p>
                  <p className="text-sm text-muted-foreground">access zones</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="w-5 h-5" /> Access Levels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{accessLevels.length}</p>
                  <p className="text-sm text-muted-foreground">badge types</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules">
            <Card>
              <CardHeader>
                <CardTitle>Accreditation Modules</CardTitle>
                <CardDescription>Manage which application modules are active and accepting submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modules.map(mod => {
                    const Icon = moduleIcons[mod.module_type] || FileText;
                    return (
                      <div key={mod.module_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${mod.is_active ? 'bg-primary/10' : 'bg-gray-100'}`}>
                            <Icon className={`w-6 h-6 ${mod.is_active ? 'text-primary' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold">{mod.name}</h3>
                            <p className="text-sm text-muted-foreground">{mod.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">Slug: /apply/{mod.slug}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={mod.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                            {mod.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {canManage && mod.module_type !== 'volunteers' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleModule(mod.module_id, mod.is_active)}
                            >
                              {mod.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {submissions.filter(s => s.status === 'submitted').length}
                  </p>
                  <p className="text-sm text-blue-700">Pending Review</p>
                </CardContent>
              </Card>
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-600">
                    {submissions.filter(s => s.status === 'under_review').length}
                  </p>
                  <p className="text-sm text-yellow-700">Under Review</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {submissions.filter(s => s.status === 'approved').length}
                  </p>
                  <p className="text-sm text-green-700">Approved</p>
                </CardContent>
              </Card>
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {submissions.filter(s => s.status === 'rejected').length}
                  </p>
                  <p className="text-sm text-red-700">Rejected</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-gray-600">{submissions.length}</p>
                  <p className="text-sm text-gray-700">Total</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Accreditation Submissions</CardTitle>
                    <CardDescription>Review and manage all application submissions</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {selectedSubmissions.length > 0 && canManage && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-green-600"
                          onClick={() => {
                            selectedSubmissions.forEach(id => handleUpdateSubmission(id, { status: 'approved' }));
                            setSelectedSubmissions([]);
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Approve ({selectedSubmissions.length})
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600"
                          onClick={() => {
                            selectedSubmissions.forEach(id => handleUpdateSubmission(id, { status: 'rejected' }));
                            setSelectedSubmissions([]);
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Reject ({selectedSubmissions.length})
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" onClick={fetchSubmissions}>
                      <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                    </Button>
                    {selectedModule !== 'all' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAuthenticatedDownload(`${API}/accreditation/export/${selectedModule}`, `${selectedModule}_export.csv`)}
                        >
                          <Download className="w-4 h-4 mr-1" /> Export CSV
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          className="bg-accent text-accent-foreground hover:bg-accent/90"
                          onClick={() => handleAuthenticatedDownload(`${API}/accreditation/export-badges/${selectedModule}?status=approved`, `${selectedModule}_badges.csv`)}
                          data-testid="export-badges-btn"
                        >
                          <Download className="w-4 h-4 mr-1" /> Export Badges
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, email, company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        data-testid="submissions-search"
                      />
                    </div>
                  </div>
                  <Select value={selectedModule} onValueChange={setSelectedModule}>
                    <SelectTrigger className="w-40" data-testid="module-filter">
                      <SelectValue placeholder="Module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modules</SelectItem>
                      {modules.filter(m => m.module_type !== 'volunteers').map(m => (
                        <SelectItem key={m.module_type} value={m.module_type}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40" data-testid="status-filter">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Submissions Table */}
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        {canManage && (
                          <th className="px-4 py-3 w-10">
                            <Checkbox
                              checked={selectedSubmissions.length === submissions.filter(s => s.status === 'submitted').length && submissions.filter(s => s.status === 'submitted').length > 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubmissions(submissions.filter(s => s.status === 'submitted').map(s => s.submission_id));
                                } else {
                                  setSelectedSubmissions([]);
                                }
                              }}
                            />
                          </th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Module</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Applicant</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Submitted</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map(sub => {
                        const Icon = moduleIcons[sub.module_type] || FileText;
                        return (
                          <tr key={sub.submission_id} className="border-b hover:bg-muted/50" data-testid={`submission-row-${sub.submission_id}`}>
                            {canManage && (
                              <td className="px-4 py-3">
                                {sub.status === 'submitted' && (
                                  <Checkbox
                                    checked={selectedSubmissions.includes(sub.submission_id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedSubmissions([...selectedSubmissions, sub.submission_id]);
                                      } else {
                                        setSelectedSubmissions(selectedSubmissions.filter(id => id !== sub.submission_id));
                                      }
                                    }}
                                  />
                                )}
                              </td>
                            )}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{moduleLabels[sub.module_type] || sub.module_type}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-sm">
                                {sub.form_data?.company_name || sub.form_data?.full_name || sub.form_data?.name || '-'}
                              </p>
                              {sub.form_data?.contact_person && (
                                <p className="text-xs text-muted-foreground">{sub.form_data.contact_person}</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm">{sub.form_data?.email || '-'}</p>
                              <p className="text-xs text-muted-foreground">{sub.form_data?.phone || ''}</p>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={statusColors[sub.status]}>
                                {sub.status.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {new Date(sub.created_at).toLocaleDateString()}
                              <br />
                              <span className="text-xs">{new Date(sub.created_at).toLocaleTimeString()}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => { 
                                    setSelectedSubmission(sub); 
                                    setReviewerNotes(sub.reviewer_notes || '');
                                    setShowSubmissionModal(true); 
                                  }}
                                  data-testid={`view-btn-${sub.submission_id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {canManage && sub.status === 'submitted' && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                      onClick={() => handleUpdateSubmission(sub.submission_id, { status: 'under_review' })}
                                      title="Mark as Under Review"
                                    >
                                      <Clock className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={() => handleUpdateSubmission(sub.submission_id, { status: 'approved' })}
                                      title="Approve"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleUpdateSubmission(sub.submission_id, { status: 'rejected' })}
                                      title="Reject"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                {canManage && sub.status === 'under_review' && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={() => handleUpdateSubmission(sub.submission_id, { status: 'approved' })}
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleUpdateSubmission(sub.submission_id, { status: 'rejected' })}
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {submissions.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No submissions found</p>
                      <p className="text-sm">Try adjusting your filters or wait for new applications</p>
                    </div>
                  )}
                </div>

                {/* Pagination info */}
                {submissions.length > 0 && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    Showing {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Locations</CardTitle>
                    <CardDescription>Manage tournament venues, areas, and facilities</CardDescription>
                  </div>
                  {canManage && (
                    <Button onClick={() => setShowLocationModal(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Add Location
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locations.map(loc => (
                    <div key={loc.location_id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold">{loc.name}</h3>
                        </div>
                        {canManage && (
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteLocation(loc.location_id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">Code: {loc.code}</p>
                      <p className="text-sm text-muted-foreground">Type: {loc.location_type}</p>
                      {loc.capacity && <p className="text-sm text-muted-foreground">Capacity: {loc.capacity}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Zones Tab */}
          <TabsContent value="zones">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Zones</CardTitle>
                    <CardDescription>Manage access zones within locations</CardDescription>
                  </div>
                  {canManage && (
                    <Button onClick={() => setShowZoneModal(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Add Zone
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {zones.map(zone => {
                    const location = locations.find(l => l.location_id === zone.location_id);
                    return (
                      <div key={zone.zone_id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">{zone.name}</h3>
                          </div>
                          {canManage && (
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteZone(zone.zone_id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Code: {zone.code}</p>
                        <p className="text-sm text-muted-foreground">Type: {zone.zone_type}</p>
                        <p className="text-sm text-muted-foreground">Location: {location?.name || '-'}</p>
                      </div>
                    );
                  })}
                </div>
                {zones.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No zones configured. Add locations first, then create zones.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access Levels Tab */}
          <TabsContent value="access">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Access Levels</CardTitle>
                    <CardDescription>Define badge types and access permissions</CardDescription>
                  </div>
                  {canManage && (
                    <Button onClick={() => setShowAccessLevelModal(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Add Access Level
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {accessLevels.map(level => (
                    <div key={level.access_level_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: level.color || '#808080' }}
                        >
                          {level.tier}
                        </div>
                        <div>
                          <h3 className="font-semibold">{level.name}</h3>
                          <p className="text-sm text-muted-foreground">Code: {level.code} | {level.description}</p>
                        </div>
                      </div>
                      {canManage && (
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteAccessLevel(level.access_level_id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pro-Am Tab */}
          <TabsContent value="proam">
            <ProAmManagement canManage={canManage} />
          </TabsContent>

          {/* Badge Export Tab */}
          <TabsContent value="badges" data-testid="badges-tab">
            <div className="space-y-6">
              {/* Badge Export Header */}
              <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <Download className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Badge Export Center</h2>
                      <p className="text-primary-foreground/80">Export approved accreditations in badge-ready format for printing</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Export Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.filter(m => m.is_active).map(mod => {
                  const Icon = moduleIcons[mod.module_type] || FileText;
                  const modStats = stats[mod.module_type] || {};
                  const approvedCount = modStats.approved || 0;
                  
                  return (
                    <Card key={mod.module_id} className="hover-lift" data-testid={`badge-export-${mod.module_type}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{mod.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{approvedCount} approved</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Ready for badges:</span>
                            <span className="font-bold text-green-600">{approvedCount}</span>
                          </div>
                          <Button 
                            className="w-full"
                            disabled={approvedCount === 0}
                            onClick={() => {
                              handleAuthenticatedDownload(`${API}/accreditation/export-badges/${mod.module_type}?status=approved`, `${mod.module_type}_badges.csv`);
                              toast.success(`Exporting ${mod.name} badges...`);
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export Badge Data
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Badge Format Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Badge CSV Format
                  </CardTitle>
                  <CardDescription>The exported CSV includes the following fields for badge printing software</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { field: 'badge_id', desc: 'Unique ID' },
                      { field: 'full_name', desc: 'Complete name' },
                      { field: 'first_name', desc: 'First name' },
                      { field: 'last_name', desc: 'Last name' },
                      { field: 'organization', desc: 'Company/Org' },
                      { field: 'role', desc: 'Job title' },
                      { field: 'accreditation_type', desc: 'Badge type' },
                      { field: 'access_level', desc: 'Zone access' },
                      { field: 'email', desc: 'Email address' },
                      { field: 'phone', desc: 'Phone number' },
                      { field: 'photo_url', desc: 'Photo link' },
                      { field: 'qr_code_data', desc: 'QR data' },
                      { field: 'valid_from', desc: 'Start date' },
                      { field: 'valid_to', desc: 'End date' }
                    ].map(item => (
                      <div key={item.field} className="p-2 bg-muted rounded text-sm">
                        <code className="text-primary font-mono">{item.field}</code>
                        <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Export</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        modules.filter(m => m.is_active).forEach(mod => {
                          const modStats = stats[mod.module_type] || {};
                          if (modStats.approved > 0) {
                            handleAuthenticatedDownload(`${API}/accreditation/export-badges/${mod.module_type}?status=approved`, `${mod.module_type}_badges.csv`);
                          }
                        });
                        toast.success('Exporting all badge data...');
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export All Approved Badges
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        modules.filter(m => m.is_active).forEach(mod => {
                          handleAuthenticatedDownload(`${API}/accreditation/export/${mod.module_type}`, `${mod.module_type}_full.csv`);
                        });
                        toast.success('Exporting all submission data...');
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Export Full Data (All Status)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>System activity and change history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {auditLogs.map(log => (
                    <div key={log.log_id} className="flex items-center gap-4 p-3 bg-muted rounded-lg text-sm">
                      <div className="w-20 text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                      <Badge variant="outline">{log.action}</Badge>
                      <span className="font-medium">{log.username}</span>
                      <span className="text-muted-foreground">
                        {log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0, 8)}...)` : ''}
                      </span>
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No audit logs yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Location Modal */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={newLocation.name} onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })} placeholder="e.g., Hole 1 Tee Box" />
            </div>
            <div>
              <Label>Code</Label>
              <Input value={newLocation.code} onChange={(e) => setNewLocation({ ...newLocation, code: e.target.value.toUpperCase() })} placeholder="e.g., H1T" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={newLocation.location_type} onValueChange={(v) => setNewLocation({ ...newLocation, location_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {locationTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Capacity (optional)</Label>
              <Input type="number" value={newLocation.capacity} onChange={(e) => setNewLocation({ ...newLocation, capacity: e.target.value })} placeholder="Maximum capacity" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newLocation.description} onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })} placeholder="Location description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLocationModal(false)}>Cancel</Button>
            <Button onClick={handleCreateLocation}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Zone Modal */}
      <Dialog open={showZoneModal} onOpenChange={setShowZoneModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Zone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={newZone.name} onChange={(e) => setNewZone({ ...newZone, name: e.target.value })} placeholder="e.g., VIP Hospitality" />
            </div>
            <div>
              <Label>Code</Label>
              <Input value={newZone.code} onChange={(e) => setNewZone({ ...newZone, code: e.target.value.toUpperCase() })} placeholder="e.g., VIPH" />
            </div>
            <div>
              <Label>Location</Label>
              <Select value={newZone.location_id} onValueChange={(v) => setNewZone({ ...newZone, location_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {locations.map(l => <SelectItem key={l.location_id} value={l.location_id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Zone Type</Label>
              <Select value={newZone.zone_type} onValueChange={(v) => setNewZone({ ...newZone, zone_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {zoneTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newZone.description} onChange={(e) => setNewZone({ ...newZone, description: e.target.value })} placeholder="Zone description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowZoneModal(false)}>Cancel</Button>
            <Button onClick={handleCreateZone}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Access Level Modal */}
      <Dialog open={showAccessLevelModal} onOpenChange={setShowAccessLevelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Access Level</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={newAccessLevel.name} onChange={(e) => setNewAccessLevel({ ...newAccessLevel, name: e.target.value })} placeholder="e.g., Tournament Staff" />
            </div>
            <div>
              <Label>Code</Label>
              <Input value={newAccessLevel.code} onChange={(e) => setNewAccessLevel({ ...newAccessLevel, code: e.target.value.toUpperCase() })} placeholder="e.g., TS" />
            </div>
            <div>
              <Label>Tier (1 = highest access)</Label>
              <Input type="number" min="1" max="10" value={newAccessLevel.tier} onChange={(e) => setNewAccessLevel({ ...newAccessLevel, tier: e.target.value })} />
            </div>
            <div>
              <Label>Badge Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={newAccessLevel.color} onChange={(e) => setNewAccessLevel({ ...newAccessLevel, color: e.target.value })} className="w-20 h-10" />
                <Input value={newAccessLevel.color} onChange={(e) => setNewAccessLevel({ ...newAccessLevel, color: e.target.value })} placeholder="#808080" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newAccessLevel.description} onChange={(e) => setNewAccessLevel({ ...newAccessLevel, description: e.target.value })} placeholder="Access level description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAccessLevelModal(false)}>Cancel</Button>
            <Button onClick={handleCreateAccessLevel}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submission Detail Modal */}
      <Dialog open={showSubmissionModal} onOpenChange={setShowSubmissionModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              Application Details
            </DialogTitle>
            <DialogDescription>
              Review submission and manage status
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex flex-wrap items-center gap-3 pb-4 border-b">
                <Badge variant="outline" className="text-sm">
                  {moduleLabels[selectedSubmission.module_type]}
                </Badge>
                <Badge className={`${statusColors[selectedSubmission.status]} text-sm`}>
                  {selectedSubmission.status.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Submitted: {new Date(selectedSubmission.created_at).toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  ID: {selectedSubmission.submission_id}
                </span>
              </div>

              {/* Form Data - Organized by categories */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Application Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                  {Object.entries(selectedSubmission.form_data || {}).map(([key, value]) => {
                    if (!value) return null;
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    return (
                      <div key={key} className={`${String(value).length > 50 ? 'md:col-span-2' : ''}`}>
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">{formattedKey}</Label>
                        <p className="font-medium mt-1 text-sm break-words whitespace-pre-wrap">{String(value)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assignment Section */}
              {canManage && (selectedSubmission.status === 'approved' || selectedSubmission.status === 'assigned') && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Assignment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Assigned Location</Label>
                      <Select 
                        value={selectedSubmission.assigned_location_id || ''} 
                        onValueChange={(v) => handleUpdateSubmission(selectedSubmission.submission_id, { assigned_location_id: v, status: 'assigned' })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select Location" /></SelectTrigger>
                        <SelectContent>
                          {locations.map(l => <SelectItem key={l.location_id} value={l.location_id}>{l.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Access Level</Label>
                      <Select 
                        value={selectedSubmission.assigned_access_level_id || ''} 
                        onValueChange={(v) => handleUpdateSubmission(selectedSubmission.submission_id, { assigned_access_level_id: v })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select Access Level" /></SelectTrigger>
                        <SelectContent>
                          {accessLevels.map(l => (
                            <SelectItem key={l.access_level_id} value={l.access_level_id}>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: l.color }}></div>
                                {l.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Reviewer Notes */}
              {canManage && (
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Reviewer Notes</h4>
                  <Textarea
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="Add internal notes about this application..."
                    rows={3}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUpdateSubmission(selectedSubmission.submission_id, { reviewer_notes: reviewerNotes })}
                  >
                    Save Notes
                  </Button>
                </div>
              )}

              {/* Status History */}
              {selectedSubmission.status_history && selectedSubmission.status_history.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Status History</h4>
                  <div className="space-y-2">
                    {selectedSubmission.status_history.map((hist, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <Badge className={statusColors[hist.status]} variant="outline">{hist.status}</Badge>
                        <span className="text-muted-foreground">
                          {new Date(hist.changed_at).toLocaleString()}
                        </span>
                        {hist.changed_by && <span className="text-xs">by {hist.changed_by}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowSubmissionModal(false)}>
              Close
            </Button>
            {canManage && selectedSubmission && (
              <>
                {(selectedSubmission.status === 'submitted' || selectedSubmission.status === 'under_review') && (
                  <>
                    {selectedSubmission.status === 'submitted' && (
                      <Button 
                        variant="outline" 
                        className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                        onClick={() => {
                          handleUpdateSubmission(selectedSubmission.submission_id, { status: 'under_review' });
                        }}
                      >
                        <Clock className="w-4 h-4 mr-2" /> Mark Under Review
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => {
                        handleUpdateSubmission(selectedSubmission.submission_id, { status: 'rejected', reviewer_notes: reviewerNotes });
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        handleUpdateSubmission(selectedSubmission.submission_id, { status: 'approved', reviewer_notes: reviewerNotes });
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                    </Button>
                  </>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
