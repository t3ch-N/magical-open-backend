import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
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
  Globe,
  Newspaper,
  Image,
  Calendar,
  Users,
  Award,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Upload,
  X,
  Loader2,
  RefreshCw,
  ExternalLink,
  FileText,
  CheckCircle2,
  Clock,
  Send,
  RotateCcw,
  History,
  FolderOpen,
  Search,
  ImageIcon,
  Video,
  File as FileIcon,
  Trophy,
  Settings
} from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';
import ImagePicker from '../components/ImagePicker';

const KOGL_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/ft1exgdt_KOGL.png";

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  review: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  scheduled: 'bg-blue-100 text-blue-800',
  archived: 'bg-red-100 text-red-800'
};

const defaultPages = [
  { title: 'About Us', slug: 'about', template: 'Learn about the Magical Kenya Open and our mission.' },
  { title: 'Tournament', slug: 'tournament', template: 'Tournament details, schedule, and information.' },
  { title: 'Privacy Policy', slug: 'privacy-policy', template: 'Our privacy policy and data handling practices.' },
  { title: 'Terms of Service', slug: 'terms-of-service', template: 'Terms and conditions for using our services.' },
  { title: 'FAQ', slug: 'faq', template: 'Frequently asked questions about the tournament.' }
];

export default function WebmasterDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pages');
  const [loading, setLoading] = useState(true);

  // Data states
  const [news, setNews] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [tournamentInfo, setTournamentInfo] = useState({});
  const [sponsors, setSponsors] = useState([]);
  const [boardMembers, setBoardMembers] = useState([]);
  const [pages, setPages] = useState([]);
  const [mediaLibrary, setMediaLibrary] = useState([]);
  const [cmsStats, setCmsStats] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [templateCategories, setTemplateCategories] = useState([]);
  const [hofChampions, setHofChampions] = useState([]);
  const [hofInductees, setHofInductees] = useState([]);

  // Modal states
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [showPageModal, setShowPageModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  const [showChampionModal, setShowChampionModal] = useState(false);
  const [showInducteeModal, setShowInducteeModal] = useState(false);

  // Edit states
  const [editingNews, setEditingNews] = useState(null);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [editingBoard, setEditingBoard] = useState(null);
  const [editingPage, setEditingPage] = useState(null);
  const [selectedRevisions, setSelectedRevisions] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingChampion, setEditingChampion] = useState(null);
  const [editingInductee, setEditingInductee] = useState(null);

  // Form states
  const [newsForm, setNewsForm] = useState({
    title: '', content: '', summary: '', category: 'tournament', image_url: '', status: 'draft'
  });
  const [sponsorForm, setSponsorForm] = useState({
    name: '', logo_url: '', website: '', tier: 'partner', is_active: true
  });
  const [boardForm, setBoardForm] = useState({
    name: '', title: '', bio: '', photo_url: '', order: 0, is_active: true
  });
  const [pageForm, setPageForm] = useState({
    title: '', slug: '', content: '', excerpt: '', meta_title: '', meta_description: '',
    featured_image: '', status: 'draft', publish_at: ''
  });
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaFilter, setMediaFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [templateForm, setTemplateForm] = useState({ name: '', description: '', category: 'content', content: '' });
  const [championForm, setChampionForm] = useState({
    year: new Date().getFullYear(), winner: '', country: '', country_code: '', score: '', venue: 'Muthaiga Golf Club', runner_up: '', purse: '', image: ''
  });
  const [inducteeForm, setInducteeForm] = useState({
    name: '', category: 'Distinguished Leadership', year: new Date().getFullYear(), achievement: '', image: ''
  });
  const [siteConfig, setSiteConfig] = useState(null);
  const [newSponsor, setNewSponsor] = useState({ name: '', logo_url: '', website: '', tier: 'silver' });

  const fileInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // Auth check
  useEffect(() => {
    const session = localStorage.getItem('webmaster_session');
    const userData = localStorage.getItem('webmaster_user');
    
    if (!session || !userData) {
      navigate('/webmaster-login');
      return;
    }
    
    setUser(JSON.parse(userData));
    fetchAllData();
  }, [navigate]);

  const getAuthHeaders = () => {
    const session = localStorage.getItem('webmaster_session');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session}`
    };
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPages(),
        fetchNews(),
        fetchGallery(),
        fetchTournamentInfo(),
        fetchSponsors(),
        fetchBoardMembers(),
        fetchMediaLibrary(),
        fetchCmsStats(),
        fetchTemplates(),
        fetchHallOfFame(),
        fetchSiteConfig()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async () => {
    try {
      const response = await fetch(`${API}/webmaster/pages`, { headers: getAuthHeaders() });
      if (response.ok) setPages(await response.json());
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    }
  };

  const fetchSiteConfig = async () => {
    try {
      const response = await fetch(`${API}/webmaster/site-config`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setSiteConfig(data);
      }
    } catch (error) {
      console.error('Failed to fetch site config:', error);
    }
  };

  const fetchMediaLibrary = async () => {
    try {
      const response = await fetch(`${API}/webmaster/media`, { headers: getAuthHeaders() });
      if (response.ok) setMediaLibrary(await response.json());
    } catch (error) {
      console.error('Failed to fetch media:', error);
    }
  };

  const fetchCmsStats = async () => {
    try {
      const response = await fetch(`${API}/webmaster/cms-stats`, { headers: getAuthHeaders() });
      if (response.ok) setCmsStats(await response.json());
    } catch (error) {
      console.error('Failed to fetch CMS stats:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const [templatesRes, categoriesRes] = await Promise.all([
        fetch(`${API}/webmaster/templates`, { headers: getAuthHeaders() }),
        fetch(`${API}/webmaster/templates/categories`, { headers: getAuthHeaders() })
      ]);
      if (templatesRes.ok) setTemplates(await templatesRes.json());
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setTemplateCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchNews = async () => {
    try {
      const response = await fetch(`${API}/webmaster/news`, { 
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (response.ok) setNews(await response.json());
    } catch (error) {
      console.error('Failed to fetch news:', error);
    }
  };

  const fetchGallery = async () => {
    try {
      const response = await fetch(`${API}/webmaster/gallery`, { 
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (response.ok) setGallery(await response.json());
    } catch (error) {
      console.error('Failed to fetch gallery:', error);
    }
  };

  const fetchTournamentInfo = async () => {
    try {
      const response = await fetch(`${API}/webmaster/tournament-info`, { 
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (response.ok) setTournamentInfo(await response.json());
    } catch (error) {
      console.error('Failed to fetch tournament info:', error);
    }
  };

  const fetchSponsors = async () => {
    try {
      const response = await fetch(`${API}/webmaster/sponsors`, { 
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (response.ok) setSponsors(await response.json());
    } catch (error) {
      console.error('Failed to fetch sponsors:', error);
    }
  };

  const fetchBoardMembers = async () => {
    try {
      const response = await fetch(`${API}/webmaster/board-members`, { 
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (response.ok) setBoardMembers(await response.json());
    } catch (error) {
      console.error('Failed to fetch board members:', error);
    }
  };

  const fetchHallOfFame = async () => {
    try {
      const [champRes, indRes] = await Promise.all([
        fetch(`${API}/webmaster/hall-of-fame/champions`, { headers: getAuthHeaders() }),
        fetch(`${API}/webmaster/hall-of-fame/inductees`, { headers: getAuthHeaders() })
      ]);
      if (champRes.ok) setHofChampions(await champRes.json());
      if (indRes.ok) setHofInductees(await indRes.json());
    } catch (error) {
      console.error('Failed to fetch Hall of Fame:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('webmaster_session');
    localStorage.removeItem('webmaster_user');
    navigate('/webmaster-login');
  };

  // ===== PAGES CRUD =====
  const savePage = async () => {
    try {
      const url = editingPage 
        ? `${API}/webmaster/pages/${editingPage.page_id}`
        : `${API}/webmaster/pages`;
      
      const response = await fetch(url, {
        method: editingPage ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(pageForm)
      });

      if (response.ok) {
        toast.success(editingPage ? 'Page updated!' : 'Page created!');
        setShowPageModal(false);
        setEditingPage(null);
        resetPageForm();
        fetchPages();
        fetchCmsStats();
      } else {
        const err = await response.json();
        toast.error(err.detail || 'Failed to save page');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const resetPageForm = () => {
    setPageForm({
      title: '', slug: '', content: '', excerpt: '', meta_title: '', meta_description: '',
      featured_image: '', status: 'draft', publish_at: ''
    });
  };

  const openEditPage = async (page) => {
    // Fetch full page with revisions
    try {
      const response = await fetch(`${API}/webmaster/pages/${page.page_id}`, { headers: getAuthHeaders() });
      if (response.ok) {
        const fullPage = await response.json();
        setEditingPage(fullPage);
        setPageForm({
          title: fullPage.title || '',
          slug: fullPage.slug || '',
          content: fullPage.content || '',
          excerpt: fullPage.excerpt || '',
          meta_title: fullPage.meta_title || '',
          meta_description: fullPage.meta_description || '',
          featured_image: fullPage.featured_image || '',
          status: fullPage.status || 'draft',
          publish_at: fullPage.publish_at || ''
        });
        setSelectedRevisions(fullPage.revisions || []);
        setShowPageModal(true);
      }
    } catch (error) {
      toast.error('Failed to load page');
    }
  };

  const deletePage = async (pageId) => {
    if (!window.confirm('Delete this page permanently?')) return;
    try {
      const response = await fetch(`${API}/webmaster/pages/${pageId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('Page deleted');
        fetchPages();
        fetchCmsStats();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to delete page');
      }
    } catch (error) {
      console.error('Delete page error:', error);
      toast.error('Failed to delete page');
    }
  };

  const submitPageForReview = async (pageId) => {
    try {
      const response = await fetch(`${API}/webmaster/pages/${pageId}/submit-review`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('Page submitted for review');
        fetchPages();
        fetchCmsStats();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to submit for review');
      }
    } catch (error) {
      console.error('Submit for review error:', error);
      toast.error('Failed to submit for review');
    }
  };

  const approvePage = async (pageId, scheduleDate = null) => {
    try {
      const response = await fetch(`${API}/webmaster/pages/${pageId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ publish_at: scheduleDate })
      });
      if (response.ok) {
        toast.success(scheduleDate ? 'Page scheduled' : 'Page published');
        fetchPages();
        fetchCmsStats();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to approve page');
      }
    } catch (error) {
      console.error('Approve page error:', error);
      toast.error('Failed to approve page');
    }
  };

  const rejectPage = async (pageId, reason) => {
    try {
      const response = await fetch(`${API}/webmaster/pages/${pageId}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
      });
      if (response.ok) {
        toast.success('Page sent back to draft');
        fetchPages();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to reject page');
      }
    } catch (error) {
      console.error('Reject page error:', error);
      toast.error('Failed to reject page');
    }
  };

  const unpublishPage = async (pageId) => {
    try {
      const response = await fetch(`${API}/webmaster/pages/${pageId}/unpublish`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('Page unpublished');
        fetchPages();
        fetchCmsStats();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to unpublish');
      }
    } catch (error) {
      console.error('Unpublish page error:', error);
      toast.error('Failed to unpublish');
    }
  };

  const restoreRevision = async (pageId, revisionId) => {
    if (!window.confirm('Restore this version? Current content will be saved as a new revision.')) return;
    try {
      const response = await fetch(`${API}/webmaster/pages/${pageId}/restore/${revisionId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('Page restored');
        setShowPageModal(false);
        fetchPages();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to restore');
      }
    } catch (error) {
      console.error('Restore revision error:', error);
      toast.error('Failed to restore');
    }
  };

  // ===== MEDIA LIBRARY =====
  const uploadMedia = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt_text', file.name);
    
    try {
      setUploading(true);
      const session = localStorage.getItem('webmaster_session');
      const response = await fetch(`${API}/webmaster/media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session}` },
        body: formData
      });
      if (response.ok) {
        toast.success('Media uploaded');
        fetchMediaLibrary();
        return await response.json();
      } else {
        toast.error('Upload failed');
      }
    } catch (error) {
      toast.error('Upload error');
    } finally {
      setUploading(false);
    }
  };

  const deleteMedia = async (mediaId) => {
    if (!window.confirm('Delete this media file?')) return;
    try {
      await fetch(`${API}/webmaster/media/${mediaId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      toast.success('Media deleted');
      fetchMediaLibrary();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const filteredMedia = mediaLibrary.filter(m => {
    if (mediaFilter !== 'all' && m.type !== mediaFilter) return false;
    if (mediaSearch && !m.filename.toLowerCase().includes(mediaSearch.toLowerCase())) return false;
    return true;
  });

  const filteredTemplates = templates.filter(t => {
    if (templateFilter !== 'all' && t.category !== templateFilter) return false;
    return true;
  });

  const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  // ===== TEMPLATE CRUD =====
  const saveTemplate = async () => {
    try {
      const url = editingTemplate 
        ? `${API}/webmaster/templates/${editingTemplate.template_id}`
        : `${API}/webmaster/templates`;
      
      const response = await fetch(url, {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(templateForm)
      });

      if (response.ok) {
        toast.success(editingTemplate ? 'Template updated!' : 'Template created!');
        setShowTemplateModal(false);
        setEditingTemplate(null);
        setTemplateForm({ name: '', description: '', category: 'content', content: '' });
        fetchTemplates();
      } else {
        toast.error('Failed to save template');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      const response = await fetch(`${API}/webmaster/templates/${templateId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('Template deleted');
        fetchTemplates();
      } else {
        const err = await response.json();
        toast.error(err.detail || 'Cannot delete');
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const insertTemplate = (template) => {
    // Insert template content at cursor position or append
    setPageForm(prev => ({
      ...prev,
      content: prev.content + '\n\n' + template.content
    }));
    // Track usage
    fetch(`${API}/webmaster/templates/${template.template_id}/use`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    setShowTemplateBrowser(false);
    toast.success(`Template "${template.name}" inserted`);
  };

  // News CRUD
  const saveNews = async () => {
    try {
      const url = editingNews 
        ? `${API}/webmaster/news/${editingNews.news_id}`
        : `${API}/webmaster/news`;
      
      const response = await fetch(url, {
        method: editingNews ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(newsForm)
      });

      if (response.ok) {
        toast.success(editingNews ? 'News updated!' : 'News created!');
        setShowNewsModal(false);
        setEditingNews(null);
        setNewsForm({ title: '', content: '', summary: '', category: 'tournament', image_url: '', is_published: true });
        fetchNews();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to save news');
        console.error('News save error:', errorData);
      }
    } catch (error) {
      console.error('News save error:', error);
      toast.error('An error occurred while saving news');
    }
  };

  const deleteNews = async (newsId) => {
    if (!confirm('Are you sure you want to delete this news article?')) return;
    
    try {
      const response = await fetch(`${API}/webmaster/news/${newsId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('News deleted');
        fetchNews();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to delete news');
      }
    } catch (error) {
      console.error('Delete news error:', error);
      toast.error('Failed to delete news');
    }
  };

  // Cleanup duplicate news articles
  const cleanupDuplicateNews = async () => {
    if (!window.confirm('This will remove duplicate news articles (keeping the oldest of each). Continue?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API}/webmaster/news/cleanup-duplicates`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.deleted_count > 0) {
          toast.success(`Removed ${result.deleted_count} duplicate article(s). ${result.remaining_articles} article(s) remaining.`);
        } else {
          toast.info('No duplicate articles found.');
        }
        fetchNews();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to cleanup duplicates');
      }
    } catch (error) {
      console.error('Cleanup duplicates error:', error);
      toast.error('Failed to cleanup duplicates');
    }
  };

  // Sponsor CRUD
  const saveSponsor = async () => {
    try {
      const url = editingSponsor 
        ? `${API}/webmaster/sponsors/${editingSponsor.sponsor_id}`
        : `${API}/webmaster/sponsors`;
      
      const response = await fetch(url, {
        method: editingSponsor ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(sponsorForm)
      });

      if (response.ok) {
        toast.success(editingSponsor ? 'Sponsor updated!' : 'Sponsor added!');
        setShowSponsorModal(false);
        setEditingSponsor(null);
        setSponsorForm({ name: '', logo_url: '', website: '', tier: 'partner', is_active: true });
        fetchSponsors();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to save sponsor');
      }
    } catch (error) {
      console.error('Sponsor save error:', error);
      toast.error('An error occurred while saving sponsor');
    }
  };

  const deleteSponsor = async (sponsorId) => {
    if (!confirm('Are you sure you want to delete this sponsor?')) return;
    
    try {
      const response = await fetch(`${API}/webmaster/sponsors/${sponsorId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Sponsor deleted');
        fetchSponsors();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to delete sponsor');
      }
    } catch (error) {
      console.error('Delete sponsor error:', error);
      toast.error('Failed to delete sponsor');
    }
  };

  // Board Member CRUD
  const saveBoardMember = async () => {
    try {
      const url = editingBoard 
        ? `${API}/webmaster/board-members/${editingBoard.member_id}`
        : `${API}/webmaster/board-members`;
      
      const response = await fetch(url, {
        method: editingBoard ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(boardForm)
      });

      if (response.ok) {
        toast.success(editingBoard ? 'Board member updated!' : 'Board member added!');
        setShowBoardModal(false);
        setEditingBoard(null);
        setBoardForm({ name: '', title: '', bio: '', photo_url: '', order: 0, is_active: true });
        fetchBoardMembers();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to save board member');
      }
    } catch (error) {
      console.error('Board member save error:', error);
      toast.error('An error occurred while saving board member');
    }
  };

  const deleteBoardMember = async (memberId) => {
    if (!confirm('Are you sure you want to delete this board member?')) return;
    
    try {
      const response = await fetch(`${API}/webmaster/board-members/${memberId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Board member deleted');
        fetchBoardMembers();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to delete board member');
      }
    } catch (error) {
      console.error('Delete board member error:', error);
      toast.error('Failed to delete board member');
    }
  };

  // Tournament Info Update
  const saveTournamentInfo = async () => {
    try {
      const response = await fetch(`${API}/webmaster/tournament-info`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(tournamentInfo)
      });

      if (response.ok) {
        toast.success('Tournament info updated!');
        fetchTournamentInfo();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to update tournament info');
      }
    } catch (error) {
      console.error('Tournament info save error:', error);
      toast.error('Failed to update tournament info');
    }
  };

  // ===== HALL OF FAME CRUD =====
  const saveChampion = async () => {
    try {
      const url = editingChampion 
        ? `${API}/webmaster/hall-of-fame/champions/${editingChampion.champion_id}`
        : `${API}/webmaster/hall-of-fame/champions`;
      
      const response = await fetch(url, {
        method: editingChampion ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(championForm)
      });

      if (response.ok) {
        toast.success(editingChampion ? 'Champion updated!' : 'Champion added!');
        setShowChampionModal(false);
        setEditingChampion(null);
        setChampionForm({ year: new Date().getFullYear(), winner: '', country: '', country_code: '', score: '', venue: 'Muthaiga Golf Club', runner_up: '', purse: '', image: '' });
        fetchHallOfFame();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to save champion');
      }
    } catch (error) {
      console.error('Champion save error:', error);
      toast.error('An error occurred');
    }
  };

  const deleteChampion = async (championId) => {
    if (!confirm('Delete this champion entry?')) return;
    try {
      const response = await fetch(`${API}/webmaster/hall-of-fame/champions/${championId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('Champion deleted');
        fetchHallOfFame();
      } else {
        toast.error('Failed to delete champion');
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const saveInductee = async () => {
    try {
      const url = editingInductee 
        ? `${API}/webmaster/hall-of-fame/inductees/${editingInductee.inductee_id}`
        : `${API}/webmaster/hall-of-fame/inductees`;
      
      const response = await fetch(url, {
        method: editingInductee ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(inducteeForm)
      });

      if (response.ok) {
        toast.success(editingInductee ? 'Inductee updated!' : 'Inductee added!');
        setShowInducteeModal(false);
        setEditingInductee(null);
        setInducteeForm({ name: '', category: 'Distinguished Leadership', year: new Date().getFullYear(), achievement: '', image: '' });
        fetchHallOfFame();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to save inductee');
      }
    } catch (error) {
      console.error('Inductee save error:', error);
      toast.error('An error occurred');
    }
  };

  const deleteInductee = async (inducteeId) => {
    if (!confirm('Delete this inductee entry?')) return;
    try {
      const response = await fetch(`${API}/webmaster/hall-of-fame/inductees/${inducteeId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success('Inductee deleted');
        fetchHallOfFame();
      } else {
        toast.error('Failed to delete inductee');
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  // Image Upload
  const handleImageUpload = async (file, callback) => {
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API}/webmaster/upload-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('webmaster_session')}` },
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        callback(data.url);
        toast.success('Image uploaded!');
      } else {
        toast.error('Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Site Config Management
  const saveSiteConfig = async () => {
    try {
      const response = await fetch(`${API}/webmaster/site-config`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(siteConfig)
      });
      if (response.ok) {
        toast.success('Site configuration saved!');
        fetchSiteConfig();
      } else {
        toast.error('Failed to save configuration');
      }
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const addHomepageSponsor = (category) => {
    if (!newSponsor.name || !newSponsor.logo_url) {
      toast.error('Name and logo URL are required');
      return;
    }
    
    const updatedConfig = { ...siteConfig };
    if (!updatedConfig.partner_logos) {
      updatedConfig.partner_logos = { main_partner: {}, official_partners: [], tournament_sponsors: [] };
    }
    
    if (category === 'official') {
      updatedConfig.partner_logos.official_partners = [
        ...(updatedConfig.partner_logos.official_partners || []),
        { ...newSponsor }
      ];
    } else if (category === 'tournament') {
      updatedConfig.partner_logos.tournament_sponsors = [
        ...(updatedConfig.partner_logos.tournament_sponsors || []),
        { ...newSponsor }
      ];
    }
    
    setSiteConfig(updatedConfig);
    setNewSponsor({ name: '', logo_url: '', website: '', tier: 'silver' });
    toast.success('Sponsor added - click Save to apply changes');
  };

  const removeHomepageSponsor = (category, index) => {
    const updatedConfig = { ...siteConfig };
    if (category === 'official') {
      updatedConfig.partner_logos.official_partners.splice(index, 1);
    } else if (category === 'tournament') {
      updatedConfig.partner_logos.tournament_sponsors.splice(index, 1);
    }
    setSiteConfig(updatedConfig);
    toast.success('Sponsor removed - click Save to apply changes');
  };

  // Gallery Upload
  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

      try {
        await fetch(`${API}/webmaster/gallery`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('webmaster_session')}` },
          credentials: 'include',
          body: formData
        });
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }

    setUploading(false);
    toast.success('Images uploaded!');
    fetchGallery();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deleteGalleryImage = async (imageId) => {
    if (!confirm('Delete this image?')) return;
    
    try {
      const response = await fetch(`${API}/webmaster/gallery/${imageId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Image deleted');
        fetchGallery();
      }
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted" data-testid="webmaster-dashboard">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={KOGL_LOGO} alt="KOGL" className="h-10" />
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Webmaster Portal
              </h1>
              <p className="text-sm text-white/70">Content Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.full_name}</p>
              <Badge variant="secondary" className="text-xs">{user?.role}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:text-white hover:bg-white/20">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-white flex-wrap">
            <TabsTrigger value="pages" className="gap-2">
              <FileText className="w-4 h-4" /> Pages
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-2">
              <Newspaper className="w-4 h-4" /> News
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2">
              <FolderOpen className="w-4 h-4" /> Media
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2">
              <Image className="w-4 h-4" /> Photo Gallery
            </TabsTrigger>
            <TabsTrigger value="tournament" className="gap-2">
              <Calendar className="w-4 h-4" /> Tournament Info
            </TabsTrigger>
            <TabsTrigger value="sponsors" className="gap-2">
              <Award className="w-4 h-4" /> Sponsors
            </TabsTrigger>
            <TabsTrigger value="site-config" className="gap-2">
              <Settings className="w-4 h-4" /> Site Config
            </TabsTrigger>
            <TabsTrigger value="board" className="gap-2">
              <Users className="w-4 h-4" /> Board Members
            </TabsTrigger>
            <TabsTrigger value="hall-of-fame" className="gap-2">
              <Trophy className="w-4 h-4" /> Hall of Fame
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="w-4 h-4" /> Templates
            </TabsTrigger>
          </TabsList>

          {/* Pages Tab */}
          <TabsContent value="pages">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-blue-700">{cmsStats?.pages?.total || 0}</div>
                  <div className="text-sm text-blue-600">Total Pages</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-green-700">{cmsStats?.pages?.published || 0}</div>
                  <div className="text-sm text-green-600">Published</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-yellow-700">{cmsStats?.pages?.review || 0}</div>
                  <div className="text-sm text-yellow-600">In Review</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-gray-700">{cmsStats?.pages?.draft || 0}</div>
                  <div className="text-sm text-gray-600">Drafts</div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Page Management</CardTitle>
                    <CardDescription>Create and manage website pages with editorial workflow</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchPages}>
                      <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                    </Button>
                    <Button size="sm" onClick={() => {
                      setEditingPage(null);
                      resetPageForm();
                      setSelectedRevisions([]);
                      setShowPageModal(true);
                    }}>
                      <Plus className="w-4 h-4 mr-1" /> New Page
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Quick Create Default Pages */}
                {pages.length === 0 && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 mb-3">Quick start: Create default pages</p>
                    <div className="flex flex-wrap gap-2">
                      {defaultPages.map(dp => (
                        <Button key={dp.slug} variant="outline" size="sm" onClick={() => {
                          setPageForm({
                            title: dp.title,
                            slug: dp.slug,
                            content: `<h2>${dp.title}</h2><p>${dp.template}</p>`,
                            excerpt: dp.template,
                            meta_title: dp.title,
                            meta_description: dp.template,
                            featured_image: '',
                            status: 'draft',
                            publish_at: ''
                          });
                          setShowPageModal(true);
                        }}>
                          <Plus className="w-3 h-3 mr-1" /> {dp.title}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {pages.map(page => (
                    <div key={page.page_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{page.title}</h3>
                          <Badge className={statusColors[page.status]}>{page.status}</Badge>
                          {page.version && <span className="text-xs text-muted-foreground">v{page.version}</span>}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          /{page.slug} • Updated {new Date(page.updated_at).toLocaleDateString()}
                          {page.author && ` by ${page.author}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {page.status === 'draft' && (
                          <Button variant="outline" size="sm" onClick={() => submitPageForReview(page.page_id)}>
                            <Send className="w-4 h-4 mr-1" /> Submit
                          </Button>
                        )}
                        {page.status === 'review' && (
                          <>
                            <Button variant="default" size="sm" onClick={() => approvePage(page.page_id)}>
                              <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => rejectPage(page.page_id, 'Needs revision')}>
                              <RotateCcw className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                        {page.status === 'published' && (
                          <>
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/page/${page.slug}`} target="_blank" rel="noopener noreferrer">
                                <Eye className="w-4 h-4 mr-1" /> View
                              </a>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => unpublishPage(page.page_id)}>
                              <EyeOff className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openEditPage(page)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deletePage(page.page_id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pages.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No pages created yet. Use the quick start above or click "New Page".
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Library Tab */}
          <TabsContent value="media">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Media Library</CardTitle>
                    <CardDescription>Upload and manage images, videos, and documents</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <input
                      ref={mediaInputRef}
                      type="file"
                      accept="image/*,video/mp4,application/pdf"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0])}
                    />
                    <Button size="sm" onClick={() => mediaInputRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                      Upload
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search media..."
                      value={mediaSearch}
                      onChange={(e) => setMediaSearch(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                  <Select value={mediaFilter} onValueChange={setMediaFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="image">Images</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                      <SelectItem value="document">Documents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Media Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredMedia.map(media => (
                    <div key={media.media_id} className="group relative border rounded-lg overflow-hidden bg-muted">
                      {media.type === 'image' ? (
                        <img src={media.url} alt={media.alt_text} className="w-full h-32 object-cover" />
                      ) : media.type === 'video' ? (
                        <div className="w-full h-32 flex items-center justify-center bg-gray-200">
                          <Video className="w-8 h-8 text-gray-500" />
                        </div>
                      ) : (
                        <div className="w-full h-32 flex items-center justify-center bg-gray-200">
                          <FileIcon className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => {
                          navigator.clipboard.writeText(media.url);
                          toast.success('URL copied');
                        }}>
                          Copy URL
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteMedia(media.media_id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="p-2 text-xs truncate">{media.filename}</div>
                    </div>
                  ))}
                  {filteredMedia.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      No media files. Click "Upload" to add files.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>News Articles</CardTitle>
                    <CardDescription>Manage news and announcements</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={cleanupDuplicateNews} className="text-orange-600 hover:text-orange-700">
                      <Trash2 className="w-4 h-4 mr-1" /> Remove Duplicates
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchNews}>
                      <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                    </Button>
                    <Button size="sm" onClick={() => {
                      setEditingNews(null);
                      setNewsForm({ title: '', content: '', summary: '', category: 'tournament', image_url: '', status: 'draft' });
                      setShowNewsModal(true);
                    }}>
                      <Plus className="w-4 h-4 mr-1" /> Add News
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {news.map(article => (
                    <div key={article.news_id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50">
                      {article.image_url && (
                        <img src={article.image_url} alt="" className="w-24 h-16 object-cover rounded" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{article.title}</h3>
                          <Badge variant={article.is_published ? 'default' : 'secondary'}>
                            {article.is_published ? 'Published' : 'Draft'}
                          </Badge>
                          <Badge variant="outline">{article.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{article.summary || article.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(article.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingNews(article);
                          setNewsForm(article);
                          setShowNewsModal(true);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteNews(article.news_id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {news.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No news articles yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Photo Gallery</CardTitle>
                    <CardDescription>Manage tournament photos and images</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchGallery}>
                      <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                    </Button>
                    <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                      Upload Images
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleGalleryUpload}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {gallery.map(image => (
                    <div key={image.image_id} className="relative group">
                      <img
                        src={image.url}
                        alt={image.title || ''}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" className="text-white" onClick={() => window.open(image.url, '_blank')}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-400" onClick={() => deleteGalleryImage(image.image_id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-center mt-1 truncate">{image.title}</p>
                    </div>
                  ))}
                  {gallery.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No images uploaded yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tournament Info Tab */}
          <TabsContent value="tournament">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Information</CardTitle>
                <CardDescription>Update tournament details displayed on the website</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Tournament Name</Label>
                    <Input
                      value={tournamentInfo.name || ''}
                      onChange={(e) => setTournamentInfo({...tournamentInfo, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={tournamentInfo.year || 2026}
                      onChange={(e) => setTournamentInfo({...tournamentInfo, year: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={tournamentInfo.start_date || ''}
                      onChange={(e) => setTournamentInfo({...tournamentInfo, start_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={tournamentInfo.end_date || ''}
                      onChange={(e) => setTournamentInfo({...tournamentInfo, end_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Venue</Label>
                    <Input
                      value={tournamentInfo.venue || ''}
                      onChange={(e) => setTournamentInfo({...tournamentInfo, venue: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={tournamentInfo.location || ''}
                      onChange={(e) => setTournamentInfo({...tournamentInfo, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Prize Fund</Label>
                    <Input
                      value={tournamentInfo.prize_fund || ''}
                      onChange={(e) => setTournamentInfo({...tournamentInfo, prize_fund: e.target.value})}
                      placeholder="e.g., $2,000,000"
                    />
                  </div>
                  <div>
                    <Label>Tour</Label>
                    <Input
                      value={tournamentInfo.tour || ''}
                      onChange={(e) => setTournamentInfo({...tournamentInfo, tour: e.target.value})}
                      placeholder="e.g., DP World Tour"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={tournamentInfo.description || ''}
                      onChange={(e) => setTournamentInfo({...tournamentInfo, description: e.target.value})}
                      rows={4}
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <Button onClick={saveTournamentInfo}>
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sponsors Tab */}
          <TabsContent value="sponsors">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sponsors</CardTitle>
                    <CardDescription>Manage tournament sponsors and partners</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => {
                    setEditingSponsor(null);
                    setSponsorForm({ name: '', logo_url: '', website: '', tier: 'partner', is_active: true });
                    setShowSponsorModal(true);
                  }}>
                    <Plus className="w-4 h-4 mr-1" /> Add Sponsor
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sponsors.map(sponsor => (
                    <div key={sponsor.sponsor_id} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 flex-shrink-0 bg-muted rounded flex items-center justify-center overflow-hidden">
                          {sponsor.logo_url ? (
                            <img 
                              src={sponsor.logo_url} 
                              alt={sponsor.name} 
                              className="w-full h-full object-contain"
                              onError={(e) => { 
                                e.target.style.display = 'none'; 
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <Award className="w-8 h-8 text-muted-foreground" style={{ display: sponsor.logo_url ? 'none' : 'block' }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{sponsor.name}</h3>
                          <Badge variant="outline" className="capitalize">{sponsor.tier}</Badge>
                        </div>
                      </div>
                      <div className="flex justify-end gap-1 mt-4">
                        {sponsor.website && (
                          <Button variant="ghost" size="sm" onClick={() => window.open(sponsor.website, '_blank')}>
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingSponsor(sponsor);
                          setSponsorForm(sponsor);
                          setShowSponsorModal(true);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteSponsor(sponsor.sponsor_id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {sponsors.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No sponsors added yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Site Config Tab - Homepage Configuration */}
          <TabsContent value="site-config">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" /> Homepage Configuration
                      </CardTitle>
                      <CardDescription>Manage content displayed on the homepage - changes apply immediately without redeploy</CardDescription>
                    </div>
                    <Button onClick={saveSiteConfig}>
                      <Save className="w-4 h-4 mr-2" /> Save Changes
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Hero Images */}
                  <div>
                    <h3 className="font-semibold mb-3">Hero Slideshow Images</h3>
                    <p className="text-sm text-muted-foreground mb-3">Images that rotate in the homepage hero section</p>
                    <div className="space-y-2">
                      {(siteConfig?.hero_images || []).map((img, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 border rounded-lg">
                          <img src={img} alt={`Hero ${idx+1}`} className="w-20 h-12 object-cover rounded" onError={(e) => e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="48"><rect fill="%23ccc" width="80" height="48"/></svg>'} />
                          <Input 
                            value={img} 
                            onChange={(e) => {
                              const newImages = [...(siteConfig?.hero_images || [])];
                              newImages[idx] = e.target.value;
                              setSiteConfig({...siteConfig, hero_images: newImages});
                            }}
                            className="flex-1"
                          />
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => {
                            const newImages = (siteConfig?.hero_images || []).filter((_, i) => i !== idx);
                            setSiteConfig({...siteConfig, hero_images: newImages});
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <ImagePicker
                          label=""
                          value=""
                          onChange={(url) => {
                            if (url) {
                              setSiteConfig({...siteConfig, hero_images: [...(siteConfig?.hero_images || []), url]});
                            }
                          }}
                          apiUrl={API}
                          authToken={localStorage.getItem('webmaster_session')}
                          mediaLibrary={mediaLibrary}
                          onMediaLibraryRefresh={fetchMediaLibrary}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Featured Content */}
                  <div>
                    <h3 className="font-semibold mb-3">Featured Content Carousel</h3>
                    <p className="text-sm text-muted-foreground mb-3">Content cards shown in the featured section</p>
                    <div className="space-y-3">
                      {(siteConfig?.featured_content || []).map((item, idx) => (
                        <div key={idx} className="grid grid-cols-6 gap-3 p-3 border rounded-lg items-center">
                          <img src={item.image} alt={item.title} className="w-full h-16 object-cover rounded" onError={(e) => e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="48"><rect fill="%23ccc" width="80" height="48"/></svg>'} />
                          <Input 
                            value={item.title} 
                            onChange={(e) => {
                              const newContent = [...(siteConfig?.featured_content || [])];
                              newContent[idx] = {...item, title: e.target.value};
                              setSiteConfig({...siteConfig, featured_content: newContent});
                            }}
                            placeholder="Title"
                            className="col-span-2"
                          />
                          <Input 
                            value={item.category} 
                            onChange={(e) => {
                              const newContent = [...(siteConfig?.featured_content || [])];
                              newContent[idx] = {...item, category: e.target.value};
                              setSiteConfig({...siteConfig, featured_content: newContent});
                            }}
                            placeholder="Category"
                          />
                          <Input 
                            value={item.image} 
                            onChange={(e) => {
                              const newContent = [...(siteConfig?.featured_content || [])];
                              newContent[idx] = {...item, image: e.target.value};
                              setSiteConfig({...siteConfig, featured_content: newContent});
                            }}
                            placeholder="Image URL"
                          />
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => {
                            const newContent = (siteConfig?.featured_content || []).filter((_, i) => i !== idx);
                            setSiteConfig({...siteConfig, featured_content: newContent});
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" onClick={() => {
                        setSiteConfig({
                          ...siteConfig, 
                          featured_content: [...(siteConfig?.featured_content || []), {id: Date.now().toString(), title: '', subtitle: '', image: '', category: 'PHOTOS', type: 'gallery'}]
                        });
                      }}>
                        <Plus className="w-4 h-4 mr-2" /> Add Featured Item
                      </Button>
                    </div>
                  </div>

                  {/* Main Partner */}
                  <div>
                    <h3 className="font-semibold mb-3">Main Partner</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
                      <div>
                        <Label>Partner Name</Label>
                        <Input
                          value={siteConfig?.partner_logos?.main_partner?.name || ''}
                          onChange={(e) => setSiteConfig({
                            ...siteConfig,
                            partner_logos: {
                              ...siteConfig?.partner_logos,
                              main_partner: { ...siteConfig?.partner_logos?.main_partner, name: e.target.value }
                            }
                          })}
                          placeholder="Partner name"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <ImagePicker
                          label="Logo"
                          value={siteConfig?.partner_logos?.main_partner?.logo_url || ''}
                          onChange={(url) => setSiteConfig({
                            ...siteConfig,
                            partner_logos: {
                              ...siteConfig?.partner_logos,
                              main_partner: { ...siteConfig?.partner_logos?.main_partner, logo_url: url }
                            }
                          })}
                          apiUrl={API}
                          authToken={localStorage.getItem('webmaster_session')}
                          mediaLibrary={mediaLibrary}
                          onMediaLibraryRefresh={fetchMediaLibrary}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Official Partners */}
                  <div>
                    <h3 className="font-semibold mb-3">Official Partners</h3>
                    <div className="space-y-3">
                      {siteConfig?.partner_logos?.official_partners?.map((partner, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 border rounded-lg">
                          {partner.logo_url && (
                            <img src={partner.logo_url} alt={partner.name} className="w-16 h-12 object-contain" />
                          )}
                          <span className="flex-1 font-medium">{partner.name}</span>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => removeHomepageSponsor('official', idx)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg border-dashed">
                        <Input
                          placeholder="Partner name"
                          value={newSponsor.name}
                          onChange={(e) => setNewSponsor({ ...newSponsor, name: e.target.value })}
                        />
                        <div className="md:col-span-2">
                          <ImagePicker
                            label=""
                            value={newSponsor.logo_url}
                            onChange={(url) => setNewSponsor({ ...newSponsor, logo_url: url })}
                            apiUrl={API}
                            authToken={localStorage.getItem('webmaster_session')}
                            mediaLibrary={mediaLibrary}
                            onMediaLibraryRefresh={fetchMediaLibrary}
                          />
                        </div>
                        <Button onClick={() => addHomepageSponsor('official')}>
                          <Plus className="w-4 h-4 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Tournament Sponsors */}
                  <div>
                    <h3 className="font-semibold mb-3">Tournament Sponsors</h3>
                    <div className="space-y-3">
                      {siteConfig?.partner_logos?.tournament_sponsors?.map((sponsor, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 border rounded-lg">
                          {sponsor.logo_url && (
                            <img src={sponsor.logo_url} alt={sponsor.name} className="w-16 h-12 object-contain" />
                          )}
                          <span className="flex-1 font-medium">{sponsor.name}</span>
                          <Badge variant="outline">{sponsor.tier || 'sponsor'}</Badge>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => removeHomepageSponsor('tournament', idx)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg border-dashed">
                        <Input
                          placeholder="Sponsor name"
                          value={newSponsor.name}
                          onChange={(e) => setNewSponsor({ ...newSponsor, name: e.target.value })}
                        />
                        <div className="md:col-span-2">
                          <ImagePicker
                            label=""
                            value={newSponsor.logo_url}
                            onChange={(url) => setNewSponsor({ ...newSponsor, logo_url: url })}
                            apiUrl={API}
                            authToken={localStorage.getItem('webmaster_session')}
                            mediaLibrary={mediaLibrary}
                            onMediaLibraryRefresh={fetchMediaLibrary}
                          />
                        </div>
                        <Select value={newSponsor.tier} onValueChange={(v) => setNewSponsor({ ...newSponsor, tier: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="platinum">Platinum</SelectItem>
                            <SelectItem value="gold">Gold</SelectItem>
                            <SelectItem value="silver">Silver</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={() => addHomepageSponsor('tournament')}>
                          <Plus className="w-4 h-4 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Board Members Tab */}
          <TabsContent value="board">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Board Members</CardTitle>
                    <CardDescription>Manage KOGL board and team members</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => {
                    setEditingBoard(null);
                    setBoardForm({ name: '', title: '', bio: '', photo_url: '', order: 0, is_active: true });
                    setShowBoardModal(true);
                  }}>
                    <Plus className="w-4 h-4 mr-1" /> Add Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {boardMembers.map(member => (
                    <div key={member.member_id} className="p-4 border rounded-lg text-center">
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={member.name} className="w-24 h-24 rounded-full mx-auto object-cover" />
                      ) : (
                        <div className="w-24 h-24 rounded-full mx-auto bg-muted flex items-center justify-center">
                          <Users className="w-10 h-10 text-muted-foreground" />
                        </div>
                      )}
                      <h3 className="font-semibold mt-4">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.title}</p>
                      <div className="flex justify-center gap-1 mt-4">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingBoard(member);
                          setBoardForm(member);
                          setShowBoardModal(true);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteBoardMember(member.member_id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {boardMembers.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No board members added yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Content Templates</CardTitle>
                    <CardDescription>Reusable content blocks for pages and articles</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchTemplates}>
                      <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                    </Button>
                    <Button size="sm" onClick={() => {
                      setEditingTemplate(null);
                      setTemplateForm({ name: '', description: '', category: 'content', content: '' });
                      setShowTemplateModal(true);
                    }}>
                      <Plus className="w-4 h-4 mr-1" /> New Template
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Category Filter */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  <Button
                    variant={templateFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTemplateFilter('all')}
                  >
                    All ({templates.length})
                  </Button>
                  {templateCategories.map(cat => (
                    <Button
                      key={cat.id}
                      variant={templateFilter === cat.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTemplateFilter(cat.id)}
                    >
                      {cat.name} ({templates.filter(t => t.category === cat.id).length})
                    </Button>
                  ))}
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map(template => (
                    <Card key={template.template_id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge variant="outline" className="text-xs">{template.category}</Badge>
                          </div>
                          {template.is_system && <Badge className="bg-blue-100 text-blue-800 text-xs">System</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{template.description}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Used {template.usage_count || 0}x</span>
                          <div className="flex gap-1">
                            {!template.is_system && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => {
                                  setEditingTemplate(template);
                                  setTemplateForm({
                                    name: template.name,
                                    description: template.description || '',
                                    category: template.category,
                                    content: template.content
                                  });
                                  setShowTemplateModal(true);
                                }}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteTemplate(template.template_id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredTemplates.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No templates in this category
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hall of Fame Tab */}
          <TabsContent value="hall-of-fame">
            <div className="space-y-6">
              {/* Champions Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-[#D50032]" /> Past Champions
                      </CardTitle>
                      <CardDescription>Manage Kenya Open winners</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => {
                      setEditingChampion(null);
                      setChampionForm({ year: new Date().getFullYear(), winner: '', country: '', country_code: '', score: '', venue: 'Muthaiga Golf Club', runner_up: '', purse: '', image: '' });
                      setShowChampionModal(true);
                    }}>
                      <Plus className="w-4 h-4 mr-1" /> Add Champion
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-medium">Year</th>
                          <th className="text-left p-3 font-medium">Champion</th>
                          <th className="text-left p-3 font-medium">Country</th>
                          <th className="text-left p-3 font-medium">Score</th>
                          <th className="text-left p-3 font-medium">Image</th>
                          <th className="text-right p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hofChampions.map(champ => (
                          <tr key={champ.champion_id} className="border-b hover:bg-muted/30">
                            <td className="p-3 font-bold text-[#D50032]">{champ.year}</td>
                            <td className="p-3">{champ.winner}</td>
                            <td className="p-3">{champ.country_code || champ.country}</td>
                            <td className="p-3">{champ.score}</td>
                            <td className="p-3">
                              {champ.image ? (
                                <img src={champ.image} alt={champ.winner} className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <span className="text-muted-foreground text-xs">No image</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setEditingChampion(champ);
                                setChampionForm({
                                  year: champ.year,
                                  winner: champ.winner,
                                  country: champ.country || '',
                                  country_code: champ.country_code || '',
                                  score: champ.score || '',
                                  venue: champ.venue || 'Muthaiga Golf Club',
                                  runner_up: champ.runner_up || '',
                                  purse: champ.purse || '',
                                  image: champ.image || ''
                                });
                                setShowChampionModal(true);
                              }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteChampion(champ.champion_id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {hofChampions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No champions added yet. Add past winners to display on the Hall of Fame page.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Inductees Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#D50032]" /> Hall of Fame Inductees
                      </CardTitle>
                      <CardDescription>Manage honorees and award recipients</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => {
                      setEditingInductee(null);
                      setInducteeForm({ name: '', category: 'Distinguished Leadership', year: new Date().getFullYear(), achievement: '', image: '' });
                      setShowInducteeModal(true);
                    }}>
                      <Plus className="w-4 h-4 mr-1" /> Add Inductee
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hofInductees.map(inductee => (
                      <div key={inductee.inductee_id} className="p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          {inductee.image ? (
                            <img src={inductee.image} alt={inductee.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-14 h-14 bg-[#D50032]/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <Award className="w-6 h-6 text-[#D50032]" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="outline" className="text-xs">{inductee.category}</Badge>
                              <Badge className="bg-[#D50032] text-white text-xs">{inductee.year}</Badge>
                            </div>
                            <h4 className="font-semibold">{inductee.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">{inductee.achievement}</p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setEditingInductee(inductee);
                            setInducteeForm({
                              name: inductee.name,
                              category: inductee.category,
                              year: inductee.year,
                              achievement: inductee.achievement || '',
                              image: inductee.image || ''
                            });
                            setShowInducteeModal(true);
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteInductee(inductee.inductee_id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {hofInductees.length === 0 && (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No inductees added yet. Add honorees to display on the Hall of Fame page.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* News Modal */}
      <Dialog open={showNewsModal} onOpenChange={setShowNewsModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNews ? 'Edit News Article' : 'Create News Article'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title *</Label>
              <Input
                value={newsForm.title}
                onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
                placeholder="Article title"
              />
            </div>
            <div>
              <Label>Summary</Label>
              <Input
                value={newsForm.summary}
                onChange={(e) => setNewsForm({...newsForm, summary: e.target.value})}
                placeholder="Brief summary for listings"
              />
            </div>
            <div>
              <Label>Content *</Label>
              <Textarea
                value={newsForm.content}
                onChange={(e) => setNewsForm({...newsForm, content: e.target.value})}
                placeholder="Full article content"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={newsForm.category} onValueChange={(v) => setNewsForm({...newsForm, category: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tournament">Tournament</SelectItem>
                    <SelectItem value="players">Players</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={newsForm.is_published}
                    onCheckedChange={(checked) => setNewsForm({...newsForm, is_published: checked})}
                  />
                  <Label>Publish now</Label>
                </div>
              </div>
            </div>
            <ImagePicker
              label="Article Image"
              value={newsForm.image_url}
              onChange={(url) => setNewsForm({...newsForm, image_url: url})}
              apiUrl={API}
              authToken={localStorage.getItem('webmaster_session')}
              mediaLibrary={mediaLibrary}
              onMediaLibraryRefresh={fetchMediaLibrary}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewsModal(false)}>Cancel</Button>
            <Button onClick={saveNews}>
              <Save className="w-4 h-4 mr-2" /> {editingNews ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sponsor Modal */}
      <Dialog open={showSponsorModal} onOpenChange={setShowSponsorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSponsor ? 'Edit Sponsor' : 'Add Sponsor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={sponsorForm.name}
                onChange={(e) => setSponsorForm({...sponsorForm, name: e.target.value})}
                placeholder="Sponsor name"
              />
            </div>
            <ImagePicker
              label="Sponsor Logo"
              value={sponsorForm.logo_url}
              onChange={(url) => setSponsorForm({...sponsorForm, logo_url: url})}
              apiUrl={API}
              authToken={localStorage.getItem('webmaster_session')}
              mediaLibrary={mediaLibrary}
              onMediaLibraryRefresh={fetchMediaLibrary}
            />
            <div>
              <Label>Website</Label>
              <Input
                value={sponsorForm.website}
                onChange={(e) => setSponsorForm({...sponsorForm, website: e.target.value})}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Tier</Label>
              <Select value={sponsorForm.tier} onValueChange={(v) => setSponsorForm({...sponsorForm, tier: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title Sponsor</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="official">Official Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={sponsorForm.is_active}
                onCheckedChange={(checked) => setSponsorForm({...sponsorForm, is_active: checked})}
              />
              <Label>Active (visible on website)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSponsorModal(false)}>Cancel</Button>
            <Button onClick={saveSponsor}>
              <Save className="w-4 h-4 mr-2" /> {editingSponsor ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Board Member Modal */}
      <Dialog open={showBoardModal} onOpenChange={setShowBoardModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBoard ? 'Edit Board Member' : 'Add Board Member'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={boardForm.name}
                onChange={(e) => setBoardForm({...boardForm, name: e.target.value})}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Title/Position *</Label>
              <Input
                value={boardForm.title}
                onChange={(e) => setBoardForm({...boardForm, title: e.target.value})}
                placeholder="e.g., Chairman, Board Member"
              />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea
                value={boardForm.bio}
                onChange={(e) => setBoardForm({...boardForm, bio: e.target.value})}
                placeholder="Brief biography"
                rows={3}
              />
            </div>
            <ImagePicker
              label="Photo"
              value={boardForm.photo_url}
              onChange={(url) => setBoardForm({...boardForm, photo_url: url})}
              apiUrl={API}
              authToken={localStorage.getItem('webmaster_session')}
              mediaLibrary={mediaLibrary}
              onMediaLibraryRefresh={fetchMediaLibrary}
            />
            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={boardForm.order}
                onChange={(e) => setBoardForm({...boardForm, order: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={boardForm.is_active}
                onCheckedChange={(checked) => setBoardForm({...boardForm, is_active: checked})}
              />
              <Label>Active (visible on website)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBoardModal(false)}>Cancel</Button>
            <Button onClick={saveBoardMember}>
              <Save className="w-4 h-4 mr-2" /> {editingBoard ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page Editor Modal */}
      <Dialog open={showPageModal} onOpenChange={setShowPageModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPage ? 'Edit Page' : 'Create Page'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Page Title *</Label>
                <Input
                  value={pageForm.title}
                  onChange={(e) => {
                    setPageForm({...pageForm, title: e.target.value, slug: pageForm.slug || generateSlug(e.target.value)});
                  }}
                  placeholder="Page Title"
                />
              </div>
              <div>
                <Label>URL Slug *</Label>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-sm">/page/</span>
                  <Input
                    value={pageForm.slug}
                    onChange={(e) => setPageForm({...pageForm, slug: generateSlug(e.target.value)})}
                    placeholder="url-slug"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Content *</Label>
                <Button variant="outline" size="sm" onClick={() => setShowTemplateBrowser(true)}>
                  <Plus className="w-3 h-3 mr-1" /> Template
                </Button>
              </div>
              <RichTextEditor
                value={pageForm.content}
                onChange={(value) => setPageForm({...pageForm, content: value})}
                height="200px"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={pageForm.status} onValueChange={(v) => setPageForm({...pageForm, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">In Review</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ImagePicker
                label="Featured Image"
                value={pageForm.featured_image}
                onChange={(url) => setPageForm({...pageForm, featured_image: url})}
                apiUrl={API}
                authToken={localStorage.getItem('webmaster_session')}
                mediaLibrary={mediaLibrary}
                onMediaLibraryRefresh={fetchMediaLibrary}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowPageModal(false)}>Cancel</Button>
            <Button onClick={savePage}>
              <Save className="w-4 h-4 mr-1" /> {editingPage ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Browser Modal */}
      <Dialog open={showTemplateBrowser} onOpenChange={setShowTemplateBrowser}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Insert Content Template</DialogTitle>
            <DialogDescription>Choose a template to insert into your page</DialogDescription>
          </DialogHeader>
          
          {/* Category Filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button
              variant={templateFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTemplateFilter('all')}
            >
              All
            </Button>
            {templateCategories.map(cat => (
              <Button
                key={cat.id}
                variant={templateFilter === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTemplateFilter(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map(template => (
              <Card 
                key={template.template_id} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => insertTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{template.name}</h4>
                    <Badge variant="outline" className="text-xs">{template.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  <div className="bg-muted p-2 rounded text-xs max-h-24 overflow-hidden">
                    <div dangerouslySetInnerHTML={{ __html: template.content.substring(0, 200) + '...' }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Editor Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Template Name *</Label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                  placeholder="e.g., Hero Section"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={templateForm.category} onValueChange={(v) => setTemplateForm({...templateForm, category: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={templateForm.description}
                onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                placeholder="Brief description..."
              />
            </div>

            <div>
              <Label>Template Content (HTML)</Label>
              <RichTextEditor
                value={templateForm.content}
                onChange={(value) => setTemplateForm({...templateForm, content: value})}
                height="200px"
              />
            </div>
          </div>

          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={() => setShowTemplateModal(false)}>Cancel</Button>
            <Button onClick={saveTemplate}>
              <Save className="w-4 h-4 mr-1" /> {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Champion Modal */}
      <Dialog open={showChampionModal} onOpenChange={setShowChampionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingChampion ? 'Edit Champion' : 'Add Champion'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Year *</Label>
                <Input
                  type="number"
                  value={championForm.year}
                  onChange={(e) => setChampionForm({...championForm, year: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label>Score</Label>
                <Input
                  value={championForm.score}
                  onChange={(e) => setChampionForm({...championForm, score: e.target.value})}
                  placeholder="-17 (271)"
                />
              </div>
            </div>
            <div>
              <Label>Winner Name *</Label>
              <Input
                value={championForm.winner}
                onChange={(e) => setChampionForm({...championForm, winner: e.target.value})}
                placeholder="Champion name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Country</Label>
                <Input
                  value={championForm.country}
                  onChange={(e) => setChampionForm({...championForm, country: e.target.value})}
                  placeholder="South Africa"
                />
              </div>
              <div>
                <Label>Country Code</Label>
                <Input
                  value={championForm.country_code}
                  onChange={(e) => setChampionForm({...championForm, country_code: e.target.value})}
                  placeholder="RSA"
                  maxLength={3}
                />
              </div>
            </div>
            <div>
              <Label>Venue</Label>
              <Input
                value={championForm.venue}
                onChange={(e) => setChampionForm({...championForm, venue: e.target.value})}
                placeholder="Muthaiga Golf Club"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Runner-up</Label>
                <Input
                  value={championForm.runner_up}
                  onChange={(e) => setChampionForm({...championForm, runner_up: e.target.value})}
                  placeholder="Runner-up name"
                />
              </div>
              <div>
                <Label>Prize Fund</Label>
                <Input
                  value={championForm.purse}
                  onChange={(e) => setChampionForm({...championForm, purse: e.target.value})}
                  placeholder="$2,000,000"
                />
              </div>
            </div>
            <ImagePicker
              label="Champion Photo"
              value={championForm.image}
              onChange={(url) => setChampionForm({...championForm, image: url})}
              apiUrl={API}
              authToken={localStorage.getItem('webmaster_session')}
              mediaLibrary={mediaLibrary}
              onMediaLibraryRefresh={fetchMediaLibrary}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChampionModal(false)}>Cancel</Button>
            <Button onClick={saveChampion}>
              <Save className="w-4 h-4 mr-2" /> {editingChampion ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inductee Modal */}
      <Dialog open={showInducteeModal} onOpenChange={setShowInducteeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingInductee ? 'Edit Inductee' : 'Add Inductee'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={inducteeForm.name}
                onChange={(e) => setInducteeForm({...inducteeForm, name: e.target.value})}
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={inducteeForm.category} onValueChange={(v) => setInducteeForm({...inducteeForm, category: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Patron - Kenya Golf Union">Patron - Kenya Golf Union</SelectItem>
                    <SelectItem value="Distinguished Leadership">Distinguished Leadership</SelectItem>
                    <SelectItem value="Distinguished Service">Distinguished Service</SelectItem>
                    <SelectItem value="Lifetime Achievement">Lifetime Achievement</SelectItem>
                    <SelectItem value="Media Excellence">Media Excellence</SelectItem>
                    <SelectItem value="Tournament Excellence">Tournament Excellence</SelectItem>
                    <SelectItem value="Special Recognition">Special Recognition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year</Label>
                <Input
                  type="number"
                  value={inducteeForm.year}
                  onChange={(e) => setInducteeForm({...inducteeForm, year: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <div>
              <Label>Achievement</Label>
              <Textarea
                value={inducteeForm.achievement}
                onChange={(e) => setInducteeForm({...inducteeForm, achievement: e.target.value})}
                placeholder="Description of their contribution"
                rows={3}
              />
            </div>
            <ImagePicker
              label="Inductee Photo"
              value={inducteeForm.image}
              onChange={(url) => setInducteeForm({...inducteeForm, image: url})}
              apiUrl={API}
              authToken={localStorage.getItem('webmaster_session')}
              mediaLibrary={mediaLibrary}
              onMediaLibraryRefresh={fetchMediaLibrary}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInducteeModal(false)}>Cancel</Button>
            <Button onClick={saveInductee}>
              <Save className="w-4 h-4 mr-2" /> {editingInductee ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
