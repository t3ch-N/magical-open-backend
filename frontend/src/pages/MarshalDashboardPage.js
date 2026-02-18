import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
  Calendar, 
  ClipboardCheck, 
  Download, 
  LogOut,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  Settings,
  BarChart3,
  Loader2,
  Eye,
  Edit,
  UserCheck,
  UserX,
  RefreshCw,
  FileText,
  Plus,
  Trash2,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  Key,
  LayoutDashboard,
  Shield,
  Filter,
  MapPin,
  UserCog,
  Save,
  Play,
  SlidersHorizontal
} from 'lucide-react';
import { Link } from 'react-router-dom';

const KOGL_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/ft1exgdt_KOGL.png";

const roleLabels = {
  chief_marshal: 'Chief Marshal',
  cio: 'CIO',
  tournament_director: 'Tournament Director',
  operations_manager: 'Operations Manager',
  area_supervisor: 'Area Supervisor',
  admin: 'Admin',
  coordinator: 'Coordinator',
  viewer: 'Viewer'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const attendanceColors = {
  present: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-800',
  late: 'bg-yellow-100 text-yellow-800'
};

const tournamentDates = [
  { value: '2026-02-19', label: 'Thursday, Feb 19' },
  { value: '2026-02-20', label: 'Friday, Feb 20' },
  { value: '2026-02-21', label: 'Saturday, Feb 21' },
  { value: '2026-02-22', label: 'Sunday, Feb 22' }
];

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'date', label: 'Date' }
];

export default function MarshalDashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  
  // Data states
  const [stats, setStats] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState([]);
  const [marshalUsers, setMarshalUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [forms, setForms] = useState([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Modal states
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  
  // Attendance states
  const [attendanceDate, setAttendanceDate] = useState(tournamentDates[0].value);
  const [attendanceData, setAttendanceData] = useState([]);
  
  // New user form
  const [newUser, setNewUser] = useState({ username: '', password: '', full_name: '', role: 'viewer' });
  
  // Edit user form
  const [editUser, setEditUser] = useState({ full_name: '', role: '', is_active: true, password: '' });
  
  // Form builder state
  const [newForm, setNewForm] = useState({ name: '', description: '', is_active: true });
  const [newField, setNewField] = useState({ 
    name: '', label: '', field_type: 'text', required: false, is_active: true, options: '', placeholder: '', help_text: '' 
  });

  // ===== QUERY ENGINE STATE =====
  const [queryFilters, setQueryFilters] = useState({
    role: '',
    status: 'approved',
    days: [],
    time_slots: [],
    karen_member: null,
    nationality: '',
    volunteered_before: null,
    search: '',
    unassigned_only: false
  });
  const [queryResults, setQueryResults] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [selectedQueryVolunteers, setSelectedQueryVolunteers] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [queryLocations, setQueryLocations] = useState([]);
  const [querySupervisors, setQuerySupervisors] = useState([]);
  const [queryPresets, setQueryPresets] = useState([]);
  const [assignmentData, setAssignmentData] = useState({
    location: '',
    supervisor: '',
    shifts: [],
    notes: ''
  });
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [newPreset, setNewPreset] = useState({ name: '', description: '' });

  const getAuthHeaders = () => {
    const sessionId = localStorage.getItem('marshal_session');
    return { 'Authorization': `Bearer ${sessionId}` };
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
        const response = await fetch(`${API}/marshal/me`, {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('marshal_session');
          localStorage.removeItem('marshal_user');
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

  // Fetch data
  const fetchData = useCallback(async () => {
    const headers = getAuthHeaders();
    
    try {
      const [statsRes, volunteersRes] = await Promise.all([
        fetch(`${API}/marshal/stats`, { headers }),
        fetch(`${API}/marshal/volunteers`, { headers })
      ]);
      
      if (statsRes.ok) setStats(await statsRes.json());
      if (volunteersRes.ok) {
        const vols = await volunteersRes.json();
        setVolunteers(vols);
        setFilteredVolunteers(vols);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Filter volunteers
  useEffect(() => {
    let filtered = [...volunteers];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v => 
        v.first_name?.toLowerCase().includes(term) ||
        v.last_name?.toLowerCase().includes(term) ||
        v.email?.toLowerCase().includes(term) ||
        v.phone?.includes(term)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(v => v.role === roleFilter);
    }
    
    setFilteredVolunteers(filtered);
  }, [volunteers, searchTerm, statusFilter, roleFilter]);

  // Fetch attendance data
  const fetchAttendance = async (date) => {
    try {
      const response = await fetch(`${API}/marshal/attendance/${date}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        setAttendanceData(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance' && attendanceDate) {
      fetchAttendance(attendanceDate);
    }
  }, [activeTab, attendanceDate]);

  // Fetch marshal users and roles
  const fetchMarshalUsers = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch(`${API}/marshal/users`, { headers: getAuthHeaders() }),
        fetch(`${API}/marshal/roles`, { headers: getAuthHeaders() })
      ]);
      if (usersRes.ok) setMarshalUsers(await usersRes.json());
      if (rolesRes.ok) {
        const data = await rolesRes.json();
        setAvailableRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' && (user?.role === 'chief_marshal' || user?.role === 'cio' || user?.role === 'tournament_director')) {
      fetchMarshalUsers();
    }
  }, [activeTab, user]);

  // Fetch forms
  const fetchForms = async () => {
    try {
      const response = await fetch(`${API}/marshal/forms`, { headers: getAuthHeaders() });
      if (response.ok) setForms(await response.json());
    } catch (error) {
      console.error('Failed to fetch forms:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'forms') {
      fetchForms();
    }
  }, [activeTab]);

  // Actions
  const handleLogout = async () => {
    await fetch(`${API}/marshal/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    localStorage.removeItem('marshal_session');
    localStorage.removeItem('marshal_user');
    navigate('/marshal-login');
  };

  const handleApprove = async (volunteerId) => {
    try {
      const response = await fetch(`${API}/marshal/volunteers/${volunteerId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('Volunteer approved');
        fetchData();
      }
    } catch {
      toast.error('Failed to approve volunteer');
    }
  };

  const handleReject = async (volunteerId) => {
    try {
      const response = await fetch(`${API}/marshal/volunteers/${volunteerId}/reject`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('Volunteer rejected');
        fetchData();
      }
    } catch {
      toast.error('Failed to reject volunteer');
    }
  };

  const handleDeleteVolunteer = async (volunteerId, volunteerName) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${volunteerName}? This action cannot be undone.`)) {
      return;
    }
    try {
      const response = await fetch(`${API}/marshal/volunteers/${volunteerId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Volunteer deleted');
        fetchData();
        setShowVolunteerModal(false);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to delete volunteer');
      }
    } catch {
      toast.error('Failed to delete volunteer');
    }
  };

  const handleMarkAttendance = async (volunteerId, status) => {
    try {
      const response = await fetch(`${API}/marshal/attendance`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteer_id: volunteerId,
          date: attendanceDate,
          status: status
        })
      });
      if (response.ok) {
        toast.success('Attendance marked');
        fetchAttendance(attendanceDate);
      }
    } catch {
      toast.error('Failed to mark attendance');
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch(`${API}/marshal/users`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (response.ok) {
        toast.success('User created successfully');
        setShowCreateUserModal(false);
        setNewUser({ username: '', password: '', full_name: '', role: 'viewer' });
        fetchMarshalUsers();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to create user');
      }
    } catch {
      toast.error('Failed to create user');
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    try {
      const updateData = { ...editUser };
      if (!updateData.password) delete updateData.password;
      
      const response = await fetch(`${API}/marshal/users/${selectedUser.marshal_id}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (response.ok) {
        toast.success('User updated successfully');
        setShowEditUserModal(false);
        setSelectedUser(null);
        fetchMarshalUsers();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to update user');
      }
    } catch {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (marshalId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await fetch(`${API}/marshal/users/${marshalId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('User deleted');
        fetchMarshalUsers();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to delete user');
      }
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const openEditUser = (u) => {
    setSelectedUser(u);
    setEditUser({
      full_name: u.full_name,
      role: u.role,
      is_active: u.is_active,
      password: ''
    });
    setShowEditUserModal(true);
  };

  // Form builder actions
  const handleCreateForm = async () => {
    try {
      const response = await fetch(`${API}/marshal/forms`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm)
      });
      if (response.ok) {
        toast.success('Form created successfully');
        setShowFormModal(false);
        setNewForm({ name: '', description: '', is_active: true });
        fetchForms();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to create form');
      }
    } catch {
      toast.error('Failed to create form');
    }
  };

  const handleUpdateForm = async (formId, updates) => {
    try {
      const response = await fetch(`${API}/marshal/forms/${formId}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        toast.success('Form updated');
        fetchForms();
      }
    } catch {
      toast.error('Failed to update form');
    }
  };

  const handleDeleteForm = async (formId) => {
    if (!confirm('Are you sure you want to delete this form?')) return;
    try {
      const response = await fetch(`${API}/marshal/forms/${formId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('Form deleted');
        fetchForms();
      }
    } catch {
      toast.error('Failed to delete form');
    }
  };

  const handleAddField = async () => {
    if (!selectedForm) return;
    try {
      const fieldData = {
        ...newField,
        options: newField.options ? newField.options.split(',').map(o => o.trim()).filter(o => o) : []
      };
      const response = await fetch(`${API}/marshal/forms/${selectedForm.form_id}/fields`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldData)
      });
      if (response.ok) {
        toast.success('Field added');
        setShowFieldModal(false);
        setNewField({ name: '', label: '', field_type: 'text', required: false, is_active: true, options: '', placeholder: '', help_text: '' });
        fetchForms();
      }
    } catch {
      toast.error('Failed to add field');
    }
  };

  const handleUpdateField = async (formId, fieldId, updates) => {
    try {
      const response = await fetch(`${API}/marshal/forms/${formId}/fields/${fieldId}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        toast.success('Field updated');
        fetchForms();
      }
    } catch {
      toast.error('Failed to update field');
    }
  };

  const handleDeleteField = async (formId, fieldId) => {
    if (!confirm('Delete this field?')) return;
    try {
      const response = await fetch(`${API}/marshal/forms/${formId}/fields/${fieldId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('Field deleted');
        fetchForms();
      }
    } catch {
      toast.error('Failed to delete field');
    }
  };

  const handleExportVolunteers = async () => {
    try {
      const response = await fetch(`${API}/marshal/export/volunteers?format=csv`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'volunteers.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Volunteers exported successfully');
    } catch (error) {
      toast.error('Failed to export volunteers');
    }
  };

  const handleExportAttendance = async () => {
    try {
      const response = await fetch(`${API}/marshal/export/attendance/${attendanceDate}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${attendanceDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Attendance exported successfully');
    } catch (error) {
      toast.error('Failed to export attendance');
    }
  };

  // ===== QUERY ENGINE FUNCTIONS =====
  const fetchQueryLocations = async () => {
    try {
      const response = await fetch(`${API}/marshal/assignment-locations`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setQueryLocations(data.locations || []);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const fetchQuerySupervisors = async () => {
    try {
      const response = await fetch(`${API}/marshal/assignment-supervisors`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setQuerySupervisors(data.supervisors || []);
      }
    } catch (error) {
      console.error('Failed to fetch supervisors:', error);
    }
  };

  const fetchQueryPresets = async () => {
    try {
      const response = await fetch(`${API}/marshal/query-presets`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setQueryPresets(data.presets || []);
      }
    } catch (error) {
      console.error('Failed to fetch presets:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'query-engine' && user) {
      fetchQueryLocations();
      fetchQuerySupervisors();
      fetchQueryPresets();
    }
  }, [activeTab, user]);

  const executeQuery = async () => {
    setQueryLoading(true);
    setSelectedQueryVolunteers([]);
    try {
      // Clean up filters - remove empty values
      const cleanFilters = {};
      if (queryFilters.role) cleanFilters.role = queryFilters.role;
      if (queryFilters.status) cleanFilters.status = queryFilters.status;
      if (queryFilters.days?.length > 0) cleanFilters.days = queryFilters.days;
      if (queryFilters.time_slots?.length > 0) cleanFilters.time_slots = queryFilters.time_slots;
      if (queryFilters.karen_member !== null) cleanFilters.karen_member = queryFilters.karen_member;
      if (queryFilters.nationality) cleanFilters.nationality = queryFilters.nationality;
      if (queryFilters.volunteered_before !== null) cleanFilters.volunteered_before = queryFilters.volunteered_before;
      if (queryFilters.search) cleanFilters.search = queryFilters.search;
      if (queryFilters.unassigned_only) cleanFilters.unassigned_only = true;

      const response = await fetch(`${API}/marshal/volunteers/query`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanFilters)
      });

      if (response.ok) {
        const data = await response.json();
        setQueryResults(data);
        toast.success(`Found ${data.total} volunteers matching your criteria`);
      } else {
        toast.error('Query failed');
      }
    } catch (error) {
      toast.error('Failed to execute query');
      console.error(error);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleSelectAllQuery = (checked) => {
    if (checked) {
      setSelectedQueryVolunteers(queryResults?.volunteers?.map(v => v.volunteer_id) || []);
    } else {
      setSelectedQueryVolunteers([]);
    }
  };

  const handleSelectQueryVolunteer = (volunteerId, checked) => {
    if (checked) {
      setSelectedQueryVolunteers(prev => [...prev, volunteerId]);
    } else {
      setSelectedQueryVolunteers(prev => prev.filter(id => id !== volunteerId));
    }
  };

  const handleBulkAssign = async () => {
    if (selectedQueryVolunteers.length === 0) {
      toast.error('Please select volunteers to assign');
      return;
    }

    try {
      const response = await fetch(`${API}/marshal/volunteers/bulk-assign`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteer_ids: selectedQueryVolunteers,
          location: assignmentData.location,
          supervisor: assignmentData.supervisor,
          shifts: assignmentData.shifts,
          notes: assignmentData.notes
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setShowAssignModal(false);
        setSelectedQueryVolunteers([]);
        setAssignmentData({ location: '', supervisor: '', shifts: [], notes: '' });
        executeQuery(); // Refresh results
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Assignment failed');
      }
    } catch (error) {
      toast.error('Failed to assign volunteers');
    }
  };

  const handleExportQueryResults = async () => {
    if (!queryResults || queryResults.total === 0) {
      toast.error('No results to export');
      return;
    }

    try {
      // Clean up filters
      const cleanFilters = {};
      if (queryFilters.role) cleanFilters.role = queryFilters.role;
      if (queryFilters.status) cleanFilters.status = queryFilters.status;
      if (queryFilters.days?.length > 0) cleanFilters.days = queryFilters.days;
      if (queryFilters.time_slots?.length > 0) cleanFilters.time_slots = queryFilters.time_slots;
      if (queryFilters.karen_member !== null) cleanFilters.karen_member = queryFilters.karen_member;
      if (queryFilters.nationality) cleanFilters.nationality = queryFilters.nationality;
      if (queryFilters.volunteered_before !== null) cleanFilters.volunteered_before = queryFilters.volunteered_before;
      if (queryFilters.search) cleanFilters.search = queryFilters.search;
      if (queryFilters.unassigned_only) cleanFilters.unassigned_only = true;

      const response = await fetch(`${API}/marshal/volunteers/export-query?format=csv`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanFilters)
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query_results_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Query results exported successfully');
    } catch (error) {
      toast.error('Failed to export query results');
    }
  };

  const applyPreset = (preset) => {
    const filters = preset.filters || {};
    setQueryFilters({
      role: filters.role || '',
      status: filters.status || 'approved',
      days: filters.days || [],
      time_slots: filters.time_slots || [],
      karen_member: filters.karen_member !== undefined ? filters.karen_member : null,
      nationality: filters.nationality || '',
      volunteered_before: filters.volunteered_before !== undefined ? filters.volunteered_before : null,
      search: filters.search || '',
      unassigned_only: filters.unassigned_only || false
    });
    toast.success(`Loaded preset: ${preset.name}`);
  };

  const handleSavePreset = async () => {
    if (!newPreset.name) {
      toast.error('Preset name is required');
      return;
    }

    try {
      const cleanFilters = {};
      if (queryFilters.role) cleanFilters.role = queryFilters.role;
      if (queryFilters.status) cleanFilters.status = queryFilters.status;
      if (queryFilters.days?.length > 0) cleanFilters.days = queryFilters.days;
      if (queryFilters.time_slots?.length > 0) cleanFilters.time_slots = queryFilters.time_slots;
      if (queryFilters.karen_member !== null) cleanFilters.karen_member = queryFilters.karen_member;
      if (queryFilters.nationality) cleanFilters.nationality = queryFilters.nationality;
      if (queryFilters.volunteered_before !== null) cleanFilters.volunteered_before = queryFilters.volunteered_before;
      if (queryFilters.unassigned_only) cleanFilters.unassigned_only = true;

      const response = await fetch(`${API}/marshal/query-presets`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPreset.name,
          description: newPreset.description,
          filters: cleanFilters
        })
      });

      if (response.ok) {
        toast.success('Query preset saved');
        setShowSavePresetModal(false);
        setNewPreset({ name: '', description: '' });
        fetchQueryPresets();
      } else {
        toast.error('Failed to save preset');
      }
    } catch (error) {
      toast.error('Failed to save preset');
    }
  };

  const handleDeletePreset = async (presetId) => {
    if (!window.confirm('Delete this preset?')) return;

    try {
      const response = await fetch(`${API}/marshal/query-presets/${presetId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast.success('Preset deleted');
        fetchQueryPresets();
      }
    } catch (error) {
      toast.error('Failed to delete preset');
    }
  };

  const resetQueryFilters = () => {
    setQueryFilters({
      role: '',
      status: 'approved',
      days: [],
      time_slots: [],
      karen_member: null,
      nationality: '',
      volunteered_before: null,
      search: '',
      unassigned_only: false
    });
    setQueryResults(null);
    setSelectedQueryVolunteers([]);
  };

  const toggleDayFilter = (day) => {
    setQueryFilters(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const toggleTimeSlot = (slot) => {
    setQueryFilters(prev => ({
      ...prev,
      time_slots: prev.time_slots.includes(slot)
        ? prev.time_slots.filter(s => s !== slot)
        : [...prev.time_slots, slot]
    }));
  };

  const canEdit = ['chief_marshal', 'cio', 'admin', 'tournament_director', 'operations_manager'].includes(user?.role);
  const canManageUsers = ['chief_marshal', 'cio', 'tournament_director'].includes(user?.role);
  const canManageForms = ['chief_marshal', 'cio', 'admin', 'tournament_director'].includes(user?.role);
  const canMarkAttendance = user?.role !== 'viewer';
  const canAssignVolunteers = ['chief_marshal', 'cio', 'admin', 'operations_manager'].includes(user?.role);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted" data-testid="marshal-dashboard">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Marshal Dashboard | MKO 2026</title>
      </Helmet>
      
      {/* Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={KOGL_LOGO} alt="KOGL" className="h-10" />
            <div>
              <h1 className="font-heading text-lg font-bold">Marshal Dashboard</h1>
              <p className="text-xs text-primary-foreground/70">MKO 2026 Volunteer Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.full_name}</p>
              <Badge variant="secondary" className="text-xs">{roleLabels[user?.role] || user?.role}</Badge>
            </div>
            <Link to="/operations-dashboard">
              <Button variant="secondary" size="sm" className="gap-2">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden md:inline">Operations</span>
              </Button>
            </Link>
            {user?.role === 'cio' && (
              <Link to="/super-admin-dashboard">
                <Button variant="default" size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700">
                  <Shield className="w-4 h-4" />
                  <span className="hidden md:inline">Super Admin</span>
                </Button>
              </Link>
            )}
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
            <TabsTrigger value="volunteers" className="gap-2">
              <Users className="w-4 h-4" /> Volunteers
            </TabsTrigger>
            <TabsTrigger value="query-engine" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Query Engine
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2">
              <ClipboardCheck className="w-4 h-4" /> Attendance
            </TabsTrigger>
            {canManageForms && (
              <TabsTrigger value="forms" className="gap-2">
                <FileText className="w-4 h-4" /> Forms
              </TabsTrigger>
            )}
            {canManageUsers && (
              <TabsTrigger value="users" className="gap-2">
                <Settings className="w-4 h-4" /> Users
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Volunteers</p>
                      <p className="text-3xl font-bold">{stats?.total || 0}</p>
                    </div>
                    <Users className="w-10 h-10 text-primary/20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Review</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats?.pending || 0}</p>
                    </div>
                    <Clock className="w-10 h-10 text-yellow-200" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Approved</p>
                      <p className="text-3xl font-bold text-green-600">{stats?.approved || 0}</p>
                    </div>
                    <CheckCircle2 className="w-10 h-10 text-green-200" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Rejected</p>
                      <p className="text-3xl font-bold text-red-600">{stats?.rejected || 0}</p>
                    </div>
                    <XCircle className="w-10 h-10 text-red-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">By Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Marshals</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{stats?.by_role?.marshals || 0}</span>
                        <span className="text-xs text-muted-foreground">/ {stats?.quotas?.marshals_minimum}+ needed</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${Math.min((stats?.by_role?.marshals || 0) / stats?.quotas?.marshals_minimum * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Scorers</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{stats?.by_role?.scorers || 0}</span>
                        <span className="text-xs text-muted-foreground">/ {stats?.quotas?.scorers_maximum} max</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent" 
                        style={{ width: `${(stats?.by_role?.scorers || 0) / stats?.quotas?.scorers_maximum * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('volunteers')}>
                    <Users className="w-4 h-4 mr-2" /> View All Volunteers
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => { setStatusFilter('pending'); setActiveTab('volunteers'); }}>
                    <Clock className="w-4 h-4 mr-2" /> Review Pending ({stats?.pending || 0})
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={handleExportVolunteers}>
                    <Download className="w-4 h-4 mr-2" /> Export Volunteer List
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Volunteers Tab */}
          <TabsContent value="volunteers">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle>Volunteer Management</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData}>
                      <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportVolunteers}>
                      <Download className="w-4 h-4 mr-1" /> Export CSV
                    </Button>
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
                        placeholder="Search by name, email, phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="marshal">Marshal</SelectItem>
                      <SelectItem value="scorer">Scorer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Volunteers Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Availability</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVolunteers.map((vol) => (
                        <tr key={vol.volunteer_id} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{vol.first_name} {vol.last_name}</p>
                              <p className="text-xs text-muted-foreground">{vol.nationality}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm">{vol.email}</p>
                            <p className="text-xs text-muted-foreground">{vol.phone}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="capitalize">{vol.role}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={statusColors[vol.status]}>{vol.status}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {['thursday', 'friday', 'saturday', 'sunday'].map((day, i) => (
                                <div
                                  key={day}
                                  className={`w-6 h-6 rounded text-[10px] flex items-center justify-center ${
                                    vol[`availability_${day}`] !== 'not_available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                                  }`}
                                  title={`${day}: ${vol[`availability_${day}`]}`}
                                >
                                  {['T', 'F', 'S', 'S'][i]}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => { setSelectedVolunteer(vol); setShowVolunteerModal(true); }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {canEdit && vol.status === 'pending' && (
                                <>
                                  <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleApprove(vol.volunteer_id)}>
                                    <UserCheck className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleReject(vol.volunteer_id)}>
                                    <UserX className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {canEdit && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteVolunteer(vol.volunteer_id, `${vol.first_name} ${vol.last_name}`)}
                                  title="Delete volunteer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredVolunteers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No volunteers found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle>Attendance Tracking</CardTitle>
                  <div className="flex gap-2">
                    <Select value={attendanceDate} onValueChange={(v) => { setAttendanceDate(v); fetchAttendance(v); }}>
                      <SelectTrigger className="w-48">
                        <Calendar className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tournamentDates.map(d => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={handleExportAttendance}>
                      <Download className="w-4 h-4 mr-1" /> Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Location</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Status</th>
                        {canMarkAttendance && (
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Mark Attendance</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData.map((vol) => (
                        <tr key={vol.volunteer_id} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <p className="font-medium">{vol.first_name} {vol.last_name}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="capitalize">{vol.role}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm">{vol.assigned_location || '-'}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {vol.attendance_status ? (
                              <Badge className={attendanceColors[vol.attendance_status]}>
                                {vol.attendance_status}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not Marked</Badge>
                            )}
                          </td>
                          {canMarkAttendance && (
                            <td className="px-4 py-3">
                              <div className="flex justify-center gap-1">
                                <Button 
                                  variant={vol.attendance_status === 'present' ? 'default' : 'outline'} 
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => handleMarkAttendance(vol.volunteer_id, 'present')}
                                >
                                  Present
                                </Button>
                                <Button 
                                  variant={vol.attendance_status === 'late' ? 'default' : 'outline'} 
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => handleMarkAttendance(vol.volunteer_id, 'late')}
                                >
                                  Late
                                </Button>
                                <Button 
                                  variant={vol.attendance_status === 'absent' ? 'destructive' : 'outline'} 
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => handleMarkAttendance(vol.volunteer_id, 'absent')}
                                >
                                  Absent
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {attendanceData.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No approved volunteers to show
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Query Engine Tab */}
          <TabsContent value="query-engine">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filters Panel */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Filter className="w-5 h-5" /> Filters
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={resetQueryFilters}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Quick Presets */}
                  {queryPresets.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Quick Presets</Label>
                      <div className="space-y-1">
                        {queryPresets.slice(0, 5).map(preset => (
                          <Button
                            key={preset.preset_id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs h-8"
                            onClick={() => applyPreset(preset)}
                          >
                            <Play className="w-3 h-3 mr-2" /> {preset.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Role Filter */}
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Volunteer Type</Label>
                    <Select value={queryFilters.role || 'all'} onValueChange={(v) => setQueryFilters(prev => ({...prev, role: v === 'all' ? '' : v}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="scorer">Scorers Only</SelectItem>
                        <SelectItem value="marshal">Marshals Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Status</Label>
                    <Select value={queryFilters.status || 'all'} onValueChange={(v) => setQueryFilters(prev => ({...prev, status: v === 'all' ? '' : v}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Day of Volunteering - Multi-select */}
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Day of Volunteering</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <Button
                          key={day}
                          variant={queryFilters.days.includes(day) ? 'default' : 'outline'}
                          size="sm"
                          className="text-xs capitalize"
                          onClick={() => toggleDayFilter(day)}
                        >
                          {day.slice(0, 3)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slot - Drill-down */}
                  {queryFilters.days.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Time Slot</Label>
                      <div className="space-y-2">
                        {['morning', 'afternoon', 'all_day'].map((slot) => (
                          <Button
                            key={slot}
                            variant={queryFilters.time_slots.includes(slot) ? 'default' : 'outline'}
                            size="sm"
                            className="w-full text-xs capitalize"
                            onClick={() => toggleTimeSlot(slot)}
                          >
                            {slot === 'all_day' ? 'All Day' : slot === 'morning' ? 'AM' : 'PM'}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Karen Membership */}
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Karen Membership</Label>
                    <Select 
                      value={queryFilters.karen_member === null ? 'all' : queryFilters.karen_member ? 'yes' : 'no'} 
                      onValueChange={(v) => setQueryFilters(prev => ({
                        ...prev, 
                        karen_member: v === 'all' ? null : v === 'yes'
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Members" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Members</SelectItem>
                        <SelectItem value="yes">Karen Members Only</SelectItem>
                        <SelectItem value="no">Non-Karen Members</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nationality */}
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Nationality</Label>
                    <Select value={queryFilters.nationality || 'all'} onValueChange={(v) => setQueryFilters(prev => ({...prev, nationality: v === 'all' ? '' : v}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Nationalities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Nationalities</SelectItem>
                        <SelectItem value="kenyan">Kenyan</SelectItem>
                        <SelectItem value="non_kenyan">Non-Kenyan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Previous Experience */}
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Experience</Label>
                    <Select 
                      value={queryFilters.volunteered_before === null ? 'all' : queryFilters.volunteered_before ? 'yes' : 'no'} 
                      onValueChange={(v) => setQueryFilters(prev => ({
                        ...prev, 
                        volunteered_before: v === 'all' ? null : v === 'yes'
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Experience Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Experience Levels</SelectItem>
                        <SelectItem value="yes">Has Volunteered Before</SelectItem>
                        <SelectItem value="no">First-time Volunteer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Unassigned Only */}
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="unassigned" 
                      checked={queryFilters.unassigned_only}
                      onCheckedChange={(checked) => setQueryFilters(prev => ({...prev, unassigned_only: checked}))}
                    />
                    <Label htmlFor="unassigned" className="text-sm">Unassigned Only</Label>
                  </div>

                  {/* Execute Query Button */}
                  <Button onClick={executeQuery} className="w-full" disabled={queryLoading}>
                    {queryLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                    Run Query
                  </Button>

                  {/* Save Preset Button */}
                  {queryResults && canAssignVolunteers && (
                    <Button variant="outline" className="w-full" onClick={() => setShowSavePresetModal(true)}>
                      <Save className="w-4 h-4 mr-2" /> Save as Preset
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Results Panel */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" /> Query Results
                        {queryResults && (
                          <Badge variant="secondary">{queryResults.total} found</Badge>
                        )}
                      </CardTitle>
                      {queryResults?.statistics && (
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Marshals: {queryResults.statistics.by_role?.marshals || 0}</span>
                          <span>Scorers: {queryResults.statistics.by_role?.scorers || 0}</span>
                          <span>Karen: {queryResults.statistics.karen_members || 0}</span>
                          <span>Unassigned: {queryResults.statistics.unassigned || 0}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {selectedQueryVolunteers.length > 0 && canAssignVolunteers && (
                        <Button onClick={() => setShowAssignModal(true)} size="sm" className="gap-1">
                          <MapPin className="w-4 h-4" /> Assign ({selectedQueryVolunteers.length})
                        </Button>
                      )}
                      {queryResults && queryResults.total > 0 && (
                        <Button variant="outline" size="sm" onClick={handleExportQueryResults} className="gap-1">
                          <Download className="w-4 h-4" /> Export
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!queryResults ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <SlidersHorizontal className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>Configure filters and click "Run Query" to search volunteers</p>
                      <p className="text-sm mt-2">Combine multiple criteria for advanced filtering</p>
                    </div>
                  ) : queryResults.total === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>No volunteers match your criteria</p>
                      <p className="text-sm mt-2">Try adjusting your filters</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-3 w-10">
                              <Checkbox 
                                checked={selectedQueryVolunteers.length === queryResults.volunteers.length}
                                onCheckedChange={handleSelectAllQuery}
                              />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Role</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Golf Club</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Availability</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Assignment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {queryResults.volunteers.map((vol) => (
                            <tr key={vol.volunteer_id} className="border-b hover:bg-muted/50">
                              <td className="px-4 py-3">
                                <Checkbox 
                                  checked={selectedQueryVolunteers.includes(vol.volunteer_id)}
                                  onCheckedChange={(checked) => handleSelectQueryVolunteer(vol.volunteer_id, checked)}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium">{vol.first_name} {vol.last_name}</p>
                                  <p className="text-xs text-muted-foreground">{vol.email}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="capitalize">{vol.role}</Badge>
                              </td>
                              <td className="px-4 py-3 text-sm">{vol.golf_club || '-'}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1">
                                  {['thursday', 'friday', 'saturday', 'sunday'].map((day, i) => (
                                    <div
                                      key={day}
                                      className={`w-6 h-6 rounded text-[10px] flex items-center justify-center ${
                                        vol[`availability_${day}`] !== 'not_available' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-gray-100 text-gray-400'
                                      }`}
                                      title={`${day}: ${vol[`availability_${day}`]}`}
                                    >
                                      {['T', 'F', 'S', 'S'][i]}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={statusColors[vol.status]}>{vol.status}</Badge>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {vol.assigned_location ? (
                                  <div>
                                    <p className="font-medium">{vol.assigned_location}</p>
                                    {vol.assigned_supervisor && (
                                      <p className="text-xs text-muted-foreground">{vol.assigned_supervisor}</p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Unassigned</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Forms Tab */}
          {canManageForms && (
            <TabsContent value="forms">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Registration Forms</CardTitle>
                    <Button onClick={() => setShowFormModal(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Create Form
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {forms.map((form) => (
                      <Card key={form.form_id} className="border">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CardTitle className="text-lg">{form.name}</CardTitle>
                              <Badge className={form.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                                {form.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUpdateForm(form.form_id, { is_active: !form.is_active })}
                              >
                                {form.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => { setSelectedForm(form); setShowFieldModal(true); }}
                              >
                                <Plus className="w-4 h-4 mr-1" /> Add Field
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600"
                                onClick={() => handleDeleteForm(form.form_id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{form.description}</p>
                          <p className="text-xs text-muted-foreground">Slug: /{form.slug}</p>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm font-medium mb-2">Fields ({form.fields?.length || 0})</p>
                            {form.fields?.map((field, idx) => (
                              <div key={field.field_id} className="flex items-center gap-3 p-2 bg-muted rounded">
                                <GripVertical className="w-4 h-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <span className="font-medium">{field.label}</span>
                                  <span className="text-xs text-muted-foreground ml-2">({field.field_type})</span>
                                  {field.required && <Badge className="ml-2 text-xs" variant="outline">Required</Badge>}
                                  {!field.is_active && <Badge className="ml-2 text-xs bg-gray-100">Disabled</Badge>}
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleUpdateField(form.form_id, field.field_id, { is_active: !field.is_active })}
                                >
                                  {field.is_active ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleUpdateField(form.form_id, field.field_id, { required: !field.required })}
                                >
                                  {field.required ? <CheckCircle2 className="w-4 h-4 text-blue-600" /> : <CheckCircle2 className="w-4 h-4 text-gray-300" />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => handleDeleteField(form.form_id, field.field_id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                            {(!form.fields || form.fields.length === 0) && (
                              <p className="text-sm text-muted-foreground italic">No fields yet. Click "Add Field" to start building the form.</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {forms.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No forms created yet. Click "Create Form" to get started.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Users Tab */}
          {canManageUsers && (
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>User Management</CardTitle>
                    <Button onClick={() => setShowCreateUserModal(true)}>
                      <UserPlus className="w-4 h-4 mr-2" /> Add User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Username</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Full Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Last Login</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marshalUsers.map((u) => (
                          <tr key={u.marshal_id} className="border-b hover:bg-muted/50">
                            <td className="px-4 py-3 font-medium">{u.username}</td>
                            <td className="px-4 py-3">{u.full_name}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline">{roleLabels[u.role] || u.role}</Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {u.is_active ? 'Active' : 'Disabled'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => openEditUser(u)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {u.marshal_id !== user?.marshal_id && (
                                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteUser(u.marshal_id)}>
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
          )}
        </Tabs>
      </main>

      {/* Volunteer Detail Modal */}
      <Dialog open={showVolunteerModal} onOpenChange={setShowVolunteerModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Volunteer Details</DialogTitle>
          </DialogHeader>
          {selectedVolunteer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{selectedVolunteer.first_name} {selectedVolunteer.last_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Nationality</Label>
                  <p>{selectedVolunteer.nationality}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">ID Number</Label>
                  <p>{selectedVolunteer.identification_number}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Golf Club</Label>
                  <p>{selectedVolunteer.golf_club || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p>{selectedVolunteer.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p>{selectedVolunteer.phone}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Role</Label>
                  <Badge variant="outline" className="capitalize">{selectedVolunteer.role}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge className={statusColors[selectedVolunteer.status]}>{selectedVolunteer.status}</Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {canEdit && selectedVolunteer && (
              <>
                {selectedVolunteer.status === 'pending' && (
                  <>
                    <Button variant="outline" className="text-red-600" onClick={() => { handleReject(selectedVolunteer.volunteer_id); setShowVolunteerModal(false); }}>
                      Reject
                    </Button>
                    <Button onClick={() => { handleApprove(selectedVolunteer.volunteer_id); setShowVolunteerModal(false); }}>
                      Approve
                    </Button>
                  </>
                )}
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="sm:ml-auto"
                  onClick={() => handleDeleteVolunteer(selectedVolunteer.volunteer_id, `${selectedVolunteer.first_name} ${selectedVolunteer.last_name}`)}
                  data-testid="delete-volunteer-btn"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Delete Permanently
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Modal */}
      <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new user to the marshal dashboard.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input
                value={newUser.username}
                onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input
                value={newUser.full_name}
                onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser(prev => ({ ...prev, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.filter(r => r.value !== 'chief_marshal').map(role => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateUserModal(false)}>Cancel</Button>
            <Button onClick={handleCreateUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User: {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={editUser.full_name}
                onChange={(e) => setEditUser(prev => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={editUser.role} onValueChange={(v) => setEditUser(prev => ({ ...prev, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>New Password (leave blank to keep current)</Label>
              <Input
                type="password"
                value={editUser.password}
                onChange={(e) => setEditUser(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter new password"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={editUser.is_active}
                onCheckedChange={(checked) => setEditUser(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Account Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUserModal(false)}>Cancel</Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Form Modal */}
      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Form</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Form Name</Label>
              <Input
                value={newForm.name}
                onChange={(e) => setNewForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Media Accreditation"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newForm.description}
                onChange={(e) => setNewForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the purpose of this form"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="form_active"
                checked={newForm.is_active}
                onCheckedChange={(checked) => setNewForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="form_active">Active (publicly accessible)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormModal(false)}>Cancel</Button>
            <Button onClick={handleCreateForm}>Create Form</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Field Modal */}
      <Dialog open={showFieldModal} onOpenChange={setShowFieldModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Field to: {selectedForm?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Field Label</Label>
              <Input
                value={newField.label}
                onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                placeholder="e.g., Company Name"
              />
            </div>
            <div>
              <Label>Field Name (internal)</Label>
              <Input
                value={newField.name}
                onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., company_name"
              />
            </div>
            <div>
              <Label>Field Type</Label>
              <Select value={newField.field_type} onValueChange={(v) => setNewField(prev => ({ ...prev, field_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {['select', 'multiselect'].includes(newField.field_type) && (
              <div>
                <Label>Options (comma separated)</Label>
                <Input
                  value={newField.options}
                  onChange={(e) => setNewField(prev => ({ ...prev, options: e.target.value }))}
                  placeholder="e.g., Option 1, Option 2, Option 3"
                />
              </div>
            )}
            <div>
              <Label>Placeholder</Label>
              <Input
                value={newField.placeholder}
                onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                placeholder="Placeholder text"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="field_required"
                  checked={newField.required}
                  onCheckedChange={(checked) => setNewField(prev => ({ ...prev, required: checked }))}
                />
                <Label htmlFor="field_required">Required</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="field_active"
                  checked={newField.is_active}
                  onCheckedChange={(checked) => setNewField(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="field_active">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFieldModal(false)}>Cancel</Button>
            <Button onClick={handleAddField}>Add Field</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assignment Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Assign Volunteers
            </DialogTitle>
            <DialogDescription>
              Assign {selectedQueryVolunteers.length} selected volunteer(s) to a location and supervisor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Location */}
            <div>
              <Label htmlFor="assign_location">Location / Zone</Label>
              <Select value={assignmentData.location} onValueChange={(v) => setAssignmentData(prev => ({...prev, location: v}))}>
                <SelectTrigger id="assign_location">
                  <SelectValue placeholder="Select location..." />
                </SelectTrigger>
                <SelectContent>
                  {queryLocations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supervisor */}
            <div>
              <Label htmlFor="assign_supervisor">Supervisor</Label>
              <Select value={assignmentData.supervisor} onValueChange={(v) => setAssignmentData(prev => ({...prev, supervisor: v}))}>
                <SelectTrigger id="assign_supervisor">
                  <SelectValue placeholder="Select supervisor..." />
                </SelectTrigger>
                <SelectContent>
                  {querySupervisors.map((sup, idx) => (
                    <SelectItem key={sup.marshal_id || idx} value={sup.full_name || sup.username}>
                      {sup.full_name || sup.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Shifts */}
            <div>
              <Label>Shifts</Label>
              <div className="flex gap-2 mt-2">
                {['morning', 'afternoon'].map((shift) => (
                  <Button
                    key={shift}
                    variant={assignmentData.shifts.includes(shift) ? 'default' : 'outline'}
                    size="sm"
                    className="capitalize"
                    onClick={() => {
                      setAssignmentData(prev => ({
                        ...prev,
                        shifts: prev.shifts.includes(shift)
                          ? prev.shifts.filter(s => s !== shift)
                          : [...prev.shifts, shift]
                      }));
                    }}
                  >
                    {shift === 'morning' ? 'AM' : 'PM'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="assign_notes">Notes (optional)</Label>
              <Textarea
                id="assign_notes"
                value={assignmentData.notes}
                onChange={(e) => setAssignmentData(prev => ({...prev, notes: e.target.value}))}
                placeholder="Any special instructions..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            <Button onClick={handleBulkAssign}>
              <UserCheck className="w-4 h-4 mr-2" /> Assign Volunteers
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Preset Modal */}
      <Dialog open={showSavePresetModal} onOpenChange={setShowSavePresetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" /> Save Query Preset
            </DialogTitle>
            <DialogDescription>
              Save current filters as a reusable preset for quick access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="preset_name">Preset Name *</Label>
              <Input
                id="preset_name"
                value={newPreset.name}
                onChange={(e) => setNewPreset(prev => ({...prev, name: e.target.value}))}
                placeholder="e.g., Weekend Scorers - AM"
              />
            </div>
            <div>
              <Label htmlFor="preset_desc">Description (optional)</Label>
              <Textarea
                id="preset_desc"
                value={newPreset.description}
                onChange={(e) => setNewPreset(prev => ({...prev, description: e.target.value}))}
                placeholder="Brief description of what this preset filters..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSavePresetModal(false)}>Cancel</Button>
            <Button onClick={handleSavePreset}>
              <Save className="w-4 h-4 mr-2" /> Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
