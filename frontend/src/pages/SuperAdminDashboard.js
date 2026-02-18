import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Shield,
  Users,
  MapPin,
  Building2,
  Key,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  BarChart3,
  Layers,
  History,
  Globe,
  Crown,
  Lock,
  Unlock,
  UserPlus,
  UserCog,
  Database,
  FileText,
  Activity,
  AlertTriangle,
  Loader2,
  Mail,
  Send
} from 'lucide-react';

const KOGL_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/ft1exgdt_KOGL.png";

const roleLabels = {
  chief_marshal: 'Chief Marshal',
  cio: 'CIO (Super Admin)',
  tournament_director: 'Tournament Director',
  operations_manager: 'Operations Manager',
  area_supervisor: 'Area Supervisor',
  admin: 'Admin',
  coordinator: 'Coordinator',
  viewer: 'Viewer',
  webmaster: 'Webmaster',
  content_manager: 'Content Manager',
  editor: 'Editor'
};

const roleColors = {
  chief_marshal: 'bg-purple-100 text-purple-800',
  cio: 'bg-red-100 text-red-800',
  tournament_director: 'bg-blue-100 text-blue-800',
  admin: 'bg-green-100 text-green-800',
  webmaster: 'bg-amber-100 text-amber-800',
  viewer: 'bg-gray-100 text-gray-800'
};

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Data states
  const [marshalUsers, setMarshalUsers] = useState([]);
  const [webmasterUsers, setWebmasterUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [zones, setZones] = useState([]);
  const [accessLevels, setAccessLevels] = useState([]);
  const [modules, setModules] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState({});

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showWebmasterModal, setShowWebmasterModal] = useState(false);

  // Edit states
  const [editingUser, setEditingUser] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [editingZone, setEditingZone] = useState(null);
  const [editingAccess, setEditingAccess] = useState(null);
  const [editingWebmaster, setEditingWebmaster] = useState(null);

  // Form states
  const [userForm, setUserForm] = useState({ username: '', password: '', full_name: '', role: 'viewer', is_active: true });
  const [locationForm, setLocationForm] = useState({ name: '', type: 'hole', description: '', capacity: 0 });
  const [zoneForm, setZoneForm] = useState({ name: '', type: 'general', description: '', color: '#3B82F6' });
  const [accessForm, setAccessForm] = useState({ name: '', tier: 1, description: '', color: '#10B981', permissions: [] });
  const [webmasterForm, setWebmasterForm] = useState({ username: '', password: '', full_name: '', role: 'webmaster', is_active: true });

  const [searchTerm, setSearchTerm] = useState('');

  // Bulk Email states
  const [bulkEmailForm, setBulkEmailForm] = useState({
    target_group: 'volunteers',
    status: 'approved',
    subject: '',
    message: ''
  });
  const [emailPreview, setEmailPreview] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Auth check - CIO only
  useEffect(() => {
    const checkAuth = async () => {
      const session = localStorage.getItem('marshal_session');
      if (!session) {
        navigate('/marshal-login');
        return;
      }
      
      try {
        const response = await fetch(`${API}/marshal/me`, { 
          headers: { 'Authorization': `Bearer ${session}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.role !== 'cio') {
            toast.error('Access denied. CIO only.');
            navigate('/marshal-dashboard');
            return;
          }
          setUser(data);
          fetchAllData();
        } else {
          localStorage.removeItem('marshal_session');
          localStorage.removeItem('marshal_user');
          navigate('/marshal-login');
        }
      } catch (error) {
        navigate('/marshal-login');
      }
    };
    checkAuth();
  }, [navigate]);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('marshal_session')}`,
    'Content-Type': 'application/json'
  });

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMarshalUsers(),
        fetchWebmasterUsers(),
        fetchLocations(),
        fetchZones(),
        fetchAccessLevels(),
        fetchModules(),
        fetchAuditLogs(),
        fetchStats()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarshalUsers = async () => {
    try {
      const response = await fetch(`${API}/marshal/users`, { headers: getAuthHeaders() });
      if (response.ok) setMarshalUsers(await response.json());
    } catch (error) { console.error(error); }
  };

  const fetchWebmasterUsers = async () => {
    try {
      const response = await fetch(`${API}/superadmin/webmaster-users`, { headers: getAuthHeaders() });
      if (response.ok) setWebmasterUsers(await response.json());
    } catch (error) { console.error(error); }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API}/accreditation/locations`, { headers: getAuthHeaders() });
      if (response.ok) setLocations(await response.json());
    } catch (error) { console.error(error); }
  };

  const fetchZones = async () => {
    try {
      const response = await fetch(`${API}/accreditation/zones`, { headers: getAuthHeaders() });
      if (response.ok) setZones(await response.json());
    } catch (error) { console.error(error); }
  };

  const fetchAccessLevels = async () => {
    try {
      const response = await fetch(`${API}/accreditation/access-levels`, { headers: getAuthHeaders() });
      if (response.ok) setAccessLevels(await response.json());
    } catch (error) { console.error(error); }
  };

  const fetchModules = async () => {
    try {
      const response = await fetch(`${API}/accreditation/modules`, { headers: getAuthHeaders() });
      if (response.ok) setModules(await response.json());
    } catch (error) { console.error(error); }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch(`${API}/accreditation/audit-logs?limit=100`, { headers: getAuthHeaders() });
      if (response.ok) setAuditLogs(await response.json());
    } catch (error) { console.error(error); }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API}/superadmin/stats`, { headers: getAuthHeaders() });
      if (response.ok) setStats(await response.json());
    } catch (error) { console.error(error); }
  };

  const handleLogout = async () => {
    const session = localStorage.getItem('marshal_session');
    await fetch(`${API}/marshal/logout`, { method: 'POST', headers: { 'Authorization': `Bearer ${session}` } });
    localStorage.removeItem('marshal_session');
    localStorage.removeItem('marshal_user');
    navigate('/marshal-login');
  };

  // Marshal User CRUD
  const saveMarshalUser = async () => {
    try {
      const url = editingUser 
        ? `${API}/marshal/users/${editingUser.marshal_id}`
        : `${API}/marshal/users`;
      
      const response = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userForm)
      });

      if (response.ok) {
        toast.success(editingUser ? 'User updated!' : 'User created!');
        setShowUserModal(false);
        setEditingUser(null);
        setUserForm({ username: '', password: '', full_name: '', role: 'viewer', is_active: true });
        fetchMarshalUsers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save user');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const deleteMarshalUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await fetch(`${API}/marshal/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('User deleted');
        fetchMarshalUsers();
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  // Webmaster User CRUD
  const saveWebmasterUser = async () => {
    try {
      const url = editingWebmaster 
        ? `${API}/superadmin/webmaster-users/${editingWebmaster.user_id}`
        : `${API}/superadmin/webmaster-users`;
      
      const response = await fetch(url, {
        method: editingWebmaster ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(webmasterForm)
      });

      if (response.ok) {
        toast.success(editingWebmaster ? 'User updated!' : 'User created!');
        setShowWebmasterModal(false);
        setEditingWebmaster(null);
        setWebmasterForm({ username: '', password: '', full_name: '', role: 'webmaster', is_active: true });
        fetchWebmasterUsers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save user');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const deleteWebmasterUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this webmaster user?')) return;
    try {
      const response = await fetch(`${API}/superadmin/webmaster-users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('User deleted');
        fetchWebmasterUsers();
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  // Location CRUD
  const saveLocation = async () => {
    try {
      const url = editingLocation 
        ? `${API}/accreditation/locations/${editingLocation.location_id}`
        : `${API}/accreditation/locations`;
      
      const response = await fetch(url, {
        method: editingLocation ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(locationForm)
      });

      if (response.ok) {
        toast.success(editingLocation ? 'Location updated!' : 'Location created!');
        setShowLocationModal(false);
        setEditingLocation(null);
        setLocationForm({ name: '', type: 'hole', description: '', capacity: 0 });
        fetchLocations();
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const deleteLocation = async (locationId) => {
    if (!confirm('Delete this location?')) return;
    try {
      const response = await fetch(`${API}/accreditation/locations/${locationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('Location deleted');
        fetchLocations();
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  // Zone CRUD
  const saveZone = async () => {
    try {
      const url = editingZone 
        ? `${API}/accreditation/zones/${editingZone.zone_id}`
        : `${API}/accreditation/zones`;
      
      const response = await fetch(url, {
        method: editingZone ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(zoneForm)
      });

      if (response.ok) {
        toast.success(editingZone ? 'Zone updated!' : 'Zone created!');
        setShowZoneModal(false);
        setEditingZone(null);
        setZoneForm({ name: '', type: 'general', description: '', color: '#3B82F6' });
        fetchZones();
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const deleteZone = async (zoneId) => {
    if (!confirm('Delete this zone?')) return;
    try {
      const response = await fetch(`${API}/accreditation/zones/${zoneId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('Zone deleted');
        fetchZones();
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  // Access Level CRUD
  const saveAccessLevel = async () => {
    try {
      const url = editingAccess 
        ? `${API}/accreditation/access-levels/${editingAccess.access_level_id}`
        : `${API}/accreditation/access-levels`;
      
      const response = await fetch(url, {
        method: editingAccess ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(accessForm)
      });

      if (response.ok) {
        toast.success(editingAccess ? 'Access level updated!' : 'Access level created!');
        setShowAccessModal(false);
        setEditingAccess(null);
        setAccessForm({ name: '', tier: 1, description: '', color: '#10B981', permissions: [] });
        fetchAccessLevels();
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const deleteAccessLevel = async (accessId) => {
    if (!confirm('Delete this access level?')) return;
    try {
      const response = await fetch(`${API}/accreditation/access-levels/${accessId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('Access level deleted');
        fetchAccessLevels();
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  // Toggle module
  const toggleModule = async (moduleId, isActive) => {
    try {
      const response = await fetch(`${API}/accreditation/modules/${moduleId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: isActive })
      });
      if (response.ok) {
        toast.success(`Module ${isActive ? 'enabled' : 'disabled'}`);
        fetchModules();
      }
    } catch (error) {
      toast.error('Failed to update module');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900" data-testid="super-admin-dashboard">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-900 via-red-800 to-slate-900 text-white shadow-lg border-b border-red-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={KOGL_LOGO} alt="KOGL" className="h-10" />
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                Super Admin Dashboard
              </h1>
              <p className="text-sm text-red-200">CIO Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.full_name}</p>
              <Badge className="bg-yellow-500 text-black text-xs">
                <Crown className="w-3 h-3 mr-1" /> CIO
              </Badge>
            </div>
            <div className="flex gap-2">
              <Link to="/operations-dashboard">
                <Button variant="outline" size="sm" className="border-red-500 text-red-100 hover:bg-red-800">
                  <Layers className="w-4 h-4 mr-1" /> Operations
                </Button>
              </Link>
              <Link to="/marshal-dashboard">
                <Button variant="outline" size="sm" className="border-red-500 text-red-100 hover:bg-red-800">
                  <Users className="w-4 h-4 mr-1" /> Volunteers
                </Button>
              </Link>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-red-800">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-slate-800 border border-slate-700 flex-wrap">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="marshal-users" className="gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <UserCog className="w-4 h-4" /> Operations Users
            </TabsTrigger>
            <TabsTrigger value="webmaster-users" className="gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Globe className="w-4 h-4" /> Webmaster Users
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <MapPin className="w-4 h-4" /> Locations
            </TabsTrigger>
            <TabsTrigger value="zones" className="gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Building2 className="w-4 h-4" /> Zones
            </TabsTrigger>
            <TabsTrigger value="access" className="gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Key className="w-4 h-4" /> Access Levels
            </TabsTrigger>
            <TabsTrigger value="modules" className="gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Layers className="w-4 h-4" /> Modules
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Mail className="w-4 h-4" /> Bulk Email
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <History className="w-4 h-4" /> Audit Log
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <UserCog className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                  <p className="text-3xl font-bold text-white">{marshalUsers.length}</p>
                  <p className="text-sm text-slate-400">Operations Users</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <Globe className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                  <p className="text-3xl font-bold text-white">{webmasterUsers.length}</p>
                  <p className="text-sm text-slate-400">Webmaster Users</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <p className="text-3xl font-bold text-white">{locations.length}</p>
                  <p className="text-sm text-slate-400">Locations</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                  <p className="text-3xl font-bold text-white">{zones.length}</p>
                  <p className="text-sm text-slate-400">Zones</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Button onClick={() => { setEditingUser(null); setUserForm({ username: '', password: '', full_name: '', role: 'viewer', is_active: true }); setShowUserModal(true); }} className="bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="w-4 h-4 mr-2" /> Add Operations User
                  </Button>
                  <Button onClick={() => { setEditingWebmaster(null); setWebmasterForm({ username: '', password: '', full_name: '', role: 'webmaster', is_active: true }); setShowWebmasterModal(true); }} className="bg-amber-600 hover:bg-amber-700">
                    <UserPlus className="w-4 h-4 mr-2" /> Add Webmaster User
                  </Button>
                  <Button onClick={() => { setEditingLocation(null); setLocationForm({ name: '', type: 'hole', description: '', capacity: 0 }); setShowLocationModal(true); }} className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" /> Add Location
                  </Button>
                  <Button onClick={() => { setEditingZone(null); setZoneForm({ name: '', type: 'general', description: '', color: '#3B82F6' }); setShowZoneModal(true); }} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" /> Add Zone
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Active Modules</span>
                    <Badge className="bg-green-600">{modules.filter(m => m.is_active).length} / {modules.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Access Levels</span>
                    <Badge className="bg-blue-600">{accessLevels.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Recent Audit Events</span>
                    <Badge className="bg-purple-600">{auditLogs.length}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Operations Users Tab */}
          <TabsContent value="marshal-users">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Operations Users</CardTitle>
                    <CardDescription className="text-slate-400">Manage marshal, admin, and operations staff accounts</CardDescription>
                  </div>
                  <Button onClick={() => { setEditingUser(null); setUserForm({ username: '', password: '', full_name: '', role: 'viewer', is_active: true }); setShowUserModal(true); }} className="bg-red-600 hover:bg-red-700">
                    <UserPlus className="w-4 h-4 mr-2" /> Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-300">Username</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-300">Full Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-300">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-300">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-300">Last Login</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marshalUsers.map(u => (
                        <tr key={u.marshal_id} className="border-b border-slate-700 hover:bg-slate-700/50">
                          <td className="px-4 py-3 text-white font-medium">{u.username}</td>
                          <td className="px-4 py-3 text-slate-300">{u.full_name}</td>
                          <td className="px-4 py-3">
                            <Badge className={roleColors[u.role] || 'bg-gray-100 text-gray-800'}>
                              {roleLabels[u.role] || u.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={u.is_active ? 'bg-green-600' : 'bg-red-600'}>
                              {u.is_active ? 'Active' : 'Disabled'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-400">
                            {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" onClick={() => {
                                setEditingUser(u);
                                setUserForm({ ...u, password: '' });
                                setShowUserModal(true);
                              }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              {u.role !== 'cio' && (
                                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => deleteMarshalUser(u.marshal_id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webmaster Users Tab */}
          <TabsContent value="webmaster-users">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Webmaster Users</CardTitle>
                    <CardDescription className="text-slate-400">Manage content management portal accounts</CardDescription>
                  </div>
                  <Button onClick={() => { setEditingWebmaster(null); setWebmasterForm({ username: '', password: '', full_name: '', role: 'webmaster', is_active: true }); setShowWebmasterModal(true); }} className="bg-amber-600 hover:bg-amber-700">
                    <UserPlus className="w-4 h-4 mr-2" /> Add Webmaster
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-300">Username</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-300">Full Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-300">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-300">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {webmasterUsers.map(u => (
                        <tr key={u.user_id} className="border-b border-slate-700 hover:bg-slate-700/50">
                          <td className="px-4 py-3 text-white font-medium">{u.username}</td>
                          <td className="px-4 py-3 text-slate-300">{u.full_name}</td>
                          <td className="px-4 py-3">
                            <Badge className="bg-amber-100 text-amber-800">{roleLabels[u.role] || u.role}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={u.is_active ? 'bg-green-600' : 'bg-red-600'}>
                              {u.is_active ? 'Active' : 'Disabled'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" onClick={() => {
                                setEditingWebmaster(u);
                                setWebmasterForm({ ...u, password: '' });
                                setShowWebmasterModal(true);
                              }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => deleteWebmasterUser(u.user_id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {webmasterUsers.length === 0 && (
                    <div className="text-center py-8 text-slate-400">No webmaster users found</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Locations</CardTitle>
                    <CardDescription className="text-slate-400">Manage venue locations and areas</CardDescription>
                  </div>
                  <Button onClick={() => { setEditingLocation(null); setLocationForm({ name: '', type: 'hole', description: '', capacity: 0 }); setShowLocationModal(true); }} className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" /> Add Location
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locations.map(loc => (
                    <Card key={loc.location_id} className="bg-slate-700 border-slate-600">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-white">{loc.name}</h3>
                            <Badge variant="outline" className="mt-1 text-slate-300 border-slate-500">{loc.type}</Badge>
                            {loc.description && <p className="text-sm text-slate-400 mt-2">{loc.description}</p>}
                            {loc.capacity > 0 && <p className="text-xs text-slate-500 mt-1">Capacity: {loc.capacity}</p>}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="text-slate-300" onClick={() => {
                              setEditingLocation(loc);
                              setLocationForm(loc);
                              setShowLocationModal(true);
                            }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-400" onClick={() => deleteLocation(loc.location_id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Zones Tab */}
          <TabsContent value="zones">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Zones</CardTitle>
                    <CardDescription className="text-slate-400">Manage access zones for accreditation</CardDescription>
                  </div>
                  <Button onClick={() => { setEditingZone(null); setZoneForm({ name: '', type: 'general', description: '', color: '#3B82F6' }); setShowZoneModal(true); }} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" /> Add Zone
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {zones.map(zone => (
                    <Card key={zone.zone_id} className="bg-slate-700 border-slate-600">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: zone.color || '#3B82F6' }}></div>
                            <div>
                              <h3 className="font-semibold text-white">{zone.name}</h3>
                              <Badge variant="outline" className="mt-1 text-slate-300 border-slate-500">{zone.type}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="text-slate-300" onClick={() => {
                              setEditingZone(zone);
                              setZoneForm(zone);
                              setShowZoneModal(true);
                            }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-400" onClick={() => deleteZone(zone.zone_id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access Levels Tab */}
          <TabsContent value="access">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Access Levels</CardTitle>
                    <CardDescription className="text-slate-400">Manage badge access levels and permissions</CardDescription>
                  </div>
                  <Button onClick={() => { setEditingAccess(null); setAccessForm({ name: '', tier: 1, description: '', color: '#10B981', permissions: [] }); setShowAccessModal(true); }} className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="w-4 h-4 mr-2" /> Add Access Level
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accessLevels.map(level => (
                    <Card key={level.access_level_id} className="bg-slate-700 border-slate-600">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: level.color || '#10B981' }}>
                              <span className="text-white text-xs font-bold">{level.tier}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{level.name}</h3>
                              {level.description && <p className="text-sm text-slate-400">{level.description}</p>}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="text-slate-300" onClick={() => {
                              setEditingAccess(level);
                              setAccessForm(level);
                              setShowAccessModal(true);
                            }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-400" onClick={() => deleteAccessLevel(level.access_level_id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Accreditation Modules</CardTitle>
                <CardDescription className="text-slate-400">Enable or disable registration modules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modules.map(mod => (
                    <div key={mod.module_id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-white">{mod.name}</h3>
                        <p className="text-sm text-slate-400">{mod.description}</p>
                      </div>
                      <Button
                        variant={mod.is_active ? 'default' : 'outline'}
                        className={mod.is_active ? 'bg-green-600 hover:bg-green-700' : 'border-slate-500 text-slate-300'}
                        onClick={() => toggleModule(mod.module_id, !mod.is_active)}
                      >
                        {mod.is_active ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Active</> : <><XCircle className="w-4 h-4 mr-2" /> Disabled</>}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Email Tab */}
          <TabsContent value="email">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Email Compose */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Mail className="w-5 h-5" /> Compose Bulk Email
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Send notifications to volunteers, accredited personnel, or Pro-Am registrants
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Target Group *</Label>
                      <Select
                        value={bulkEmailForm.target_group}
                        onValueChange={(val) => {
                          setBulkEmailForm({...bulkEmailForm, target_group: val});
                          setEmailPreview(null);
                        }}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="volunteers">Volunteers</SelectItem>
                          <SelectItem value="submissions">Accreditation Submissions</SelectItem>
                          <SelectItem value="proam">Pro-Am Registrations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Status Filter</Label>
                      <Select
                        value={bulkEmailForm.status}
                        onValueChange={(val) => {
                          setBulkEmailForm({...bulkEmailForm, status: val});
                          setEmailPreview(null);
                        }}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approved">Approved Only</SelectItem>
                          <SelectItem value="pending">Pending Only</SelectItem>
                          <SelectItem value="all">All Status</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Subject *</Label>
                    <Input
                      value={bulkEmailForm.subject}
                      onChange={(e) => setBulkEmailForm({...bulkEmailForm, subject: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Email subject line..."
                    />
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Message *</Label>
                    <Textarea
                      value={bulkEmailForm.message}
                      onChange={(e) => setBulkEmailForm({...bulkEmailForm, message: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white min-h-[150px]"
                      placeholder="Enter your message here..."
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        try {
                          const response = await fetch(
                            `${API}/superadmin/bulk-email/preview?target_group=${bulkEmailForm.target_group}&status=${bulkEmailForm.status}`,
                            { headers: getAuthHeaders() }
                          );
                          if (response.ok) {
                            const data = await response.json();
                            setEmailPreview(data);
                          }
                        } catch (err) {
                          toast.error('Failed to load preview');
                        }
                      }}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" /> Preview Recipients
                    </Button>
                    
                    <Button
                      onClick={async () => {
                        if (!bulkEmailForm.subject || !bulkEmailForm.message) {
                          toast.error('Subject and message are required');
                          return;
                        }
                        if (!emailPreview || emailPreview.total_count === 0) {
                          toast.error('Preview recipients first and ensure there are recipients');
                          return;
                        }
                        
                        if (!confirm(`Send email to ${emailPreview.total_count} recipients?`)) return;
                        
                        setSendingEmail(true);
                        try {
                          const response = await fetch(`${API}/superadmin/bulk-email`, {
                            method: 'POST',
                            headers: getAuthHeaders(),
                            body: JSON.stringify(bulkEmailForm)
                          });
                          
                          if (response.ok) {
                            const result = await response.json();
                            toast.success(`Email sent to ${result.success_count} recipients!`);
                            if (result.failed_count > 0) {
                              toast.warning(`${result.failed_count} emails failed`);
                            }
                            setBulkEmailForm({...bulkEmailForm, subject: '', message: ''});
                            setEmailPreview(null);
                          } else {
                            toast.error('Failed to send emails');
                          }
                        } catch (err) {
                          toast.error('Error sending emails');
                        } finally {
                          setSendingEmail(false);
                        }
                      }}
                      disabled={sendingEmail || !emailPreview || emailPreview.total_count === 0}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Recipients Preview */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5" /> Recipients Preview
                  </CardTitle>
                  {emailPreview && (
                    <CardDescription className="text-slate-400">
                      {emailPreview.total_count} recipient(s) found
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {emailPreview ? (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {emailPreview.recipients?.map((r, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-slate-700 rounded">
                          <Mail className="w-4 h-4 text-blue-400" />
                          <div className="flex-1">
                            <p className="text-sm text-white">{r.name}</p>
                            <p className="text-xs text-slate-400">{r.email}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {r.role || r.module || r.type || 'N/A'}
                          </Badge>
                        </div>
                      ))}
                      {emailPreview.total_count > 50 && (
                        <p className="text-xs text-slate-500 text-center py-2">
                          Showing 50 of {emailPreview.total_count} recipients
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Select target group and click "Preview Recipients"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Audit Log</CardTitle>
                <CardDescription className="text-slate-400">System activity and change history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {auditLogs.map((log, i) => (
                    <div key={i} className="flex items-start gap-4 p-3 bg-slate-700 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-white">
                          <span className="font-medium">{log.user_id || 'System'}</span>
                          {' '}{log.action}{' '}
                          <span className="text-slate-400">{log.entity_type}</span>
                        </p>
                        {log.details && (
                          <p className="text-xs text-slate-500 mt-1">{JSON.stringify(log.details).substring(0, 100)}...</p>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* User Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Create Operations User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Username *</Label>
              <Input
                value={userForm.username}
                onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label className="text-slate-300">{editingUser ? 'New Password (leave blank to keep)' : 'Password *'}</Label>
              <Input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
              />
            </div>
            <div>
              <Label className="text-slate-300">Full Name *</Label>
              <Input
                value={userForm.full_name}
                onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Role</Label>
              <Select value={userForm.role} onValueChange={(v) => setUserForm({...userForm, role: v})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chief_marshal">Chief Marshal</SelectItem>
                  <SelectItem value="cio">CIO (Super Admin)</SelectItem>
                  <SelectItem value="tournament_director">Tournament Director</SelectItem>
                  <SelectItem value="operations_manager">Operations Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={userForm.is_active} onCheckedChange={(c) => setUserForm({...userForm, is_active: c})} />
              <Label className="text-slate-300">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserModal(false)} className="border-slate-600 text-slate-300">Cancel</Button>
            <Button onClick={saveMarshalUser} className="bg-red-600 hover:bg-red-700">
              <Save className="w-4 h-4 mr-2" /> {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Webmaster User Modal */}
      <Dialog open={showWebmasterModal} onOpenChange={setShowWebmasterModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{editingWebmaster ? 'Edit Webmaster User' : 'Create Webmaster User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Username *</Label>
              <Input value={webmasterForm.username} onChange={(e) => setWebmasterForm({...webmasterForm, username: e.target.value})} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div>
              <Label className="text-slate-300">{editingWebmaster ? 'New Password (leave blank to keep)' : 'Password *'}</Label>
              <Input type="password" value={webmasterForm.password} onChange={(e) => setWebmasterForm({...webmasterForm, password: e.target.value})} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div>
              <Label className="text-slate-300">Full Name *</Label>
              <Input value={webmasterForm.full_name} onChange={(e) => setWebmasterForm({...webmasterForm, full_name: e.target.value})} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div>
              <Label className="text-slate-300">Role</Label>
              <Select value={webmasterForm.role} onValueChange={(v) => setWebmasterForm({...webmasterForm, role: v})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="webmaster">Webmaster</SelectItem>
                  <SelectItem value="content_manager">Content Manager</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={webmasterForm.is_active} onCheckedChange={(c) => setWebmasterForm({...webmasterForm, is_active: c})} />
              <Label className="text-slate-300">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWebmasterModal(false)} className="border-slate-600 text-slate-300">Cancel</Button>
            <Button onClick={saveWebmasterUser} className="bg-amber-600 hover:bg-amber-700">
              <Save className="w-4 h-4 mr-2" /> {editingWebmaster ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Modal */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Edit Location' : 'Add Location'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Name *</Label>
              <Input value={locationForm.name} onChange={(e) => setLocationForm({...locationForm, name: e.target.value})} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div>
              <Label className="text-slate-300">Type</Label>
              <Select value={locationForm.type} onValueChange={(v) => setLocationForm({...locationForm, type: v})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hole">Hole</SelectItem>
                  <SelectItem value="facility">Facility</SelectItem>
                  <SelectItem value="checkpoint">Checkpoint</SelectItem>
                  <SelectItem value="entrance">Entrance</SelectItem>
                  <SelectItem value="hospitality">Hospitality</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea value={locationForm.description} onChange={(e) => setLocationForm({...locationForm, description: e.target.value})} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div>
              <Label className="text-slate-300">Capacity</Label>
              <Input type="number" value={locationForm.capacity} onChange={(e) => setLocationForm({...locationForm, capacity: parseInt(e.target.value) || 0})} className="bg-slate-700 border-slate-600 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLocationModal(false)} className="border-slate-600 text-slate-300">Cancel</Button>
            <Button onClick={saveLocation} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" /> {editingLocation ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zone Modal */}
      <Dialog open={showZoneModal} onOpenChange={setShowZoneModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{editingZone ? 'Edit Zone' : 'Add Zone'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Name *</Label>
              <Input value={zoneForm.name} onChange={(e) => setZoneForm({...zoneForm, name: e.target.value})} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div>
              <Label className="text-slate-300">Type</Label>
              <Select value={zoneForm.type} onValueChange={(v) => setZoneForm({...zoneForm, type: v})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="player">Player</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Color</Label>
              <Input type="color" value={zoneForm.color} onChange={(e) => setZoneForm({...zoneForm, color: e.target.value})} className="h-10 w-full" />
            </div>
            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea value={zoneForm.description} onChange={(e) => setZoneForm({...zoneForm, description: e.target.value})} className="bg-slate-700 border-slate-600 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowZoneModal(false)} className="border-slate-600 text-slate-300">Cancel</Button>
            <Button onClick={saveZone} className="bg-purple-600 hover:bg-purple-700">
              <Save className="w-4 h-4 mr-2" /> {editingZone ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Level Modal */}
      <Dialog open={showAccessModal} onOpenChange={setShowAccessModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{editingAccess ? 'Edit Access Level' : 'Add Access Level'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Name *</Label>
              <Input value={accessForm.name} onChange={(e) => setAccessForm({...accessForm, name: e.target.value})} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div>
              <Label className="text-slate-300">Tier (1=Highest)</Label>
              <Input type="number" min="1" max="10" value={accessForm.tier} onChange={(e) => setAccessForm({...accessForm, tier: parseInt(e.target.value) || 1})} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div>
              <Label className="text-slate-300">Color</Label>
              <Input type="color" value={accessForm.color} onChange={(e) => setAccessForm({...accessForm, color: e.target.value})} className="h-10 w-full" />
            </div>
            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea value={accessForm.description} onChange={(e) => setAccessForm({...accessForm, description: e.target.value})} className="bg-slate-700 border-slate-600 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAccessModal(false)} className="border-slate-600 text-slate-300">Cancel</Button>
            <Button onClick={saveAccessLevel} className="bg-teal-600 hover:bg-teal-700">
              <Save className="w-4 h-4 mr-2" /> {editingAccess ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
