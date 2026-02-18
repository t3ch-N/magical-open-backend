import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from 'sonner';
import { 
  LayoutDashboard,
  Users,
  FileText,
  Image,
  Trophy,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  Send,
  Upload,
  Copy,
  ImageIcon
} from 'lucide-react';

// Admin Dashboard Component
export default function AdminDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState({
    pendingRequests: 0,
    totalUsers: 0,
    totalArticles: 0,
    totalEnquiries: 0
  });

  useEffect(() => {
    // Fetch basic stats
    Promise.all([
      fetch(`${API}/admin/registration-requests?status=pending`, { credentials: 'include' }).then(r => r.json()).catch(() => []),
      fetch(`${API}/admin/users`, { credentials: 'include' }).then(r => r.json()).catch(() => []),
      fetch(`${API}/news`, { credentials: 'include' }).then(r => r.json()).catch(() => []),
      fetch(`${API}/admin/enquiries`, { credentials: 'include' }).then(r => r.json()).catch(() => [])
    ]).then(([requests, users, articles, enquiries]) => {
      setStats({
        pendingRequests: requests.length,
        totalUsers: users.length,
        totalArticles: articles.length,
        totalEnquiries: enquiries.length
      });
    });
  }, []);

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/content', label: 'Content', icon: FileText },
    { path: '/admin/uploads', label: 'Media', icon: ImageIcon },
    { path: '/admin/policies', label: 'Policies', icon: FileText },
    { path: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/admin/enquiries', label: 'Enquiries', icon: Mail }
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div data-testid="admin-dashboard">
      {/* Admin Header */}
      <section className="bg-primary text-primary-foreground py-6">
        <div className="container-custom">
          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-accent text-accent-foreground mb-2">Admin Panel</Badge>
              <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              {user?.picture && (
                <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
              )}
              <span className="font-body">{user?.name}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background sticky top-20 z-40">
        <div className="container-custom">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-subheading font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                  isActive(item.path, item.exact)
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <section className="section-spacing">
        <div className="container-custom">
          <Routes>
            <Route index element={<DashboardOverview stats={stats} />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="content" element={<ContentManagement />} />
            <Route path="uploads" element={<MediaUploads />} />
            <Route path="policies" element={<PoliciesManagement />} />
            <Route path="leaderboard" element={<LeaderboardManagement />} />
            <Route path="enquiries" element={<EnquiriesManagement />} />
          </Routes>
        </div>
      </section>
    </div>
  );
}

// Dashboard Overview
function DashboardOverview({ stats }) {
  return (
    <div data-testid="admin-overview">
      <h2 className="font-heading text-2xl font-bold mb-6">Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="card-default">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="font-subheading text-3xl font-bold text-secondary">{stats.pendingRequests}</p>
              </div>
              <Clock className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-default">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="font-subheading text-3xl font-bold text-primary">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-default">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Articles</p>
                <p className="font-subheading text-3xl font-bold text-primary">{stats.totalArticles}</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-default">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enquiries</p>
                <p className="font-subheading text-3xl font-bold text-accent">{stats.totalEnquiries}</p>
              </div>
              <Mail className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-default">
          <CardHeader>
            <CardTitle className="font-heading">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/content" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="w-4 h-4" /> Create News Article
              </Button>
            </Link>
            <Link to="/admin/users" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Users className="w-4 h-4" /> Review Registrations
              </Button>
            </Link>
            <Link to="/admin/leaderboard" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Trophy className="w-4 h-4" /> Update Leaderboard
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="card-default">
          <CardHeader>
            <CardTitle className="font-heading">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted">
                <span className="font-body">API Status</span>
                <Badge className="bg-green-100 text-green-700">Online</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted">
                <span className="font-body">Database</span>
                <Badge className="bg-green-100 text-green-700">Connected</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted">
                <span className="font-body">Tournament Status</span>
                <Badge className="bg-yellow-100 text-yellow-700">Pre-Event</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Users Management
function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, requestsRes] = await Promise.all([
        fetch(`${API}/admin/users`, { credentials: 'include' }),
        fetch(`${API}/admin/registration-requests?status=pending`, { credentials: 'include' })
      ]);
      
      setUsers(await usersRes.json());
      setPendingRequests(await requestsRes.json());
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (userId) => {
    try {
      const response = await fetch(`${API}/admin/users/${userId}/approve`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast.success('User approved successfully');
        fetchData();
      } else {
        toast.error('Failed to approve user');
      }
    } catch (error) {
      toast.error('Failed to approve user');
    }
  };

  const handleReject = async (userId) => {
    try {
      const response = await fetch(`${API}/admin/users/${userId}/reject`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast.success('User rejected');
        fetchData();
      } else {
        toast.error('Failed to reject user');
      }
    } catch (error) {
      toast.error('Failed to reject user');
    }
  };

  const filteredUsers = filter === 'all' ? users : users.filter(u => u.role === filter);

  return (
    <div data-testid="admin-users">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold">User Management</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="volunteer">Volunteers</SelectItem>
            <SelectItem value="vendor">Vendors</SelectItem>
            <SelectItem value="junior_golf">Junior Golf</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="card-default mb-6 border-secondary/50">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary" />
              Pending Registration Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((req) => {
                const user = users.find(u => u.user_id === req.user_id);
                return (
                  <div key={req.request_id} className="flex items-center justify-between p-4 bg-muted">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {user?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-body font-medium">{user?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">{req.requested_role}</Badge>
                      <Button 
                        size="sm" 
                        onClick={() => handleApprove(req.user_id)}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid={`approve-${req.user_id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleReject(req.user_id)}
                        data-testid={`reject-${req.user_id}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Users */}
      <Card className="card-default">
        <CardHeader>
          <CardTitle className="font-heading">All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        user.role_status === 'approved' ? 'bg-green-100 text-green-700' :
                        user.role_status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }>
                        {user.role_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Content Management
function ContentManagement() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'news',
    featured_image: '',
    tags: ''
  });

  const fetchArticles = async () => {
    try {
      const response = await fetch(`${API}/news?status=`);
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    try {
      const articleData = {
        ...newArticle,
        tags: newArticle.tags.split(',').map(t => t.trim()).filter(t => t)
      };
      
      const response = await fetch(`${API}/admin/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(articleData)
      });

      if (response.ok) {
        toast.success('Article created successfully');
        setDialogOpen(false);
        setNewArticle({ title: '', excerpt: '', content: '', category: 'news', featured_image: '', tags: '' });
        fetchArticles();
      } else {
        toast.error('Failed to create article');
      }
    } catch (error) {
      toast.error('Failed to create article');
    }
  };

  const handlePublish = async (articleId) => {
    try {
      const response = await fetch(`${API}/admin/news/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'published' })
      });

      if (response.ok) {
        toast.success('Article published');
        fetchArticles();
      }
    } catch (error) {
      toast.error('Failed to publish article');
    }
  };

  const handleDelete = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    
    try {
      const response = await fetch(`${API}/admin/news/${articleId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Article deleted');
        fetchArticles();
      }
    } catch (error) {
      toast.error('Failed to delete article');
    }
  };

  return (
    <div data-testid="admin-content">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold">Content Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary gap-2" data-testid="create-article-btn">
              <Plus className="w-4 h-4" /> New Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading">Create New Article</DialogTitle>
              <DialogDescription className="font-body">
                Create a new news article or announcement
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateArticle} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={newArticle.category}
                  onValueChange={(value) => setNewArticle(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="tournament">Tournament</SelectItem>
                    <SelectItem value="players">Players</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="featured_image">Featured Image URL</Label>
                <Input
                  id="featured_image"
                  value={newArticle.featured_image}
                  onChange={(e) => setNewArticle(prev => ({ ...prev, featured_image: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="excerpt">Excerpt *</Label>
                <Textarea
                  id="excerpt"
                  value={newArticle.excerpt}
                  onChange={(e) => setNewArticle(prev => ({ ...prev, excerpt: e.target.value }))}
                  required
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={newArticle.content}
                  onChange={(e) => setNewArticle(prev => ({ ...prev, content: e.target.value }))}
                  required
                  rows={6}
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={newArticle.tags}
                  onChange={(e) => setNewArticle(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="golf, tournament, kenya"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary">
                  Create Article
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="card-default">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No articles yet. Create your first one!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow key={article.article_id}>
                    <TableCell className="font-medium max-w-xs truncate">{article.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{article.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        article.status === 'published' ? 'bg-green-100 text-green-700' :
                        article.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }>
                        {article.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(article.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {article.status !== 'published' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePublish(article.article_id)}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDelete(article.article_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Leaderboard Management
function LeaderboardManagement() {
  const [players, setPlayers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/players`).then(r => r.json()).catch(() => []),
      fetch(`${API}/leaderboard`).then(r => r.json()).catch(() => [])
    ]).then(([playersData, leaderboardData]) => {
      setPlayers(playersData);
      setLeaderboard(leaderboardData);
      setLoading(false);
    });
  }, []);

  return (
    <div data-testid="admin-leaderboard">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold">Leaderboard Management</h2>
        <Badge className="bg-yellow-100 text-yellow-700">
          Mock Data Mode
        </Badge>
      </div>

      <Card className="card-default mb-6">
        <CardHeader>
          <CardTitle className="font-heading">Tournament Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground font-body">
            The leaderboard is currently displaying mock/simulated data. During the tournament, 
            you can manually update scores here or integrate with live scoring APIs.
          </p>
        </CardContent>
      </Card>

      <Card className="card-default">
        <CardHeader>
          <CardTitle className="font-heading">Current Leaderboard ({leaderboard.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No leaderboard data. Add players and scores to begin.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pos</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>R1</TableHead>
                  <TableHead>R2</TableHead>
                  <TableHead>R3</TableHead>
                  <TableHead>R4</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry) => (
                  <TableRow key={entry.entry_id}>
                    <TableCell className="font-subheading font-bold">{entry.position}</TableCell>
                    <TableCell className="font-medium">{entry.player_name || 'Unknown'}</TableCell>
                    <TableCell>{entry.round1 || '-'}</TableCell>
                    <TableCell>{entry.round2 || '-'}</TableCell>
                    <TableCell>{entry.round3 || '-'}</TableCell>
                    <TableCell>{entry.round4 || '-'}</TableCell>
                    <TableCell className="font-subheading font-bold">
                      {entry.score_to_par > 0 ? `+${entry.score_to_par}` : entry.score_to_par || 'E'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Enquiries Management
function EnquiriesManagement() {
  const [enquiries, setEnquiries] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/admin/enquiries`, { credentials: 'include' }).then(r => r.json()).catch(() => []),
      fetch(`${API}/admin/contact`, { credentials: 'include' }).then(r => r.json()).catch(() => [])
    ]).then(([enquiriesData, messagesData]) => {
      setEnquiries(enquiriesData);
      setMessages(messagesData);
      setLoading(false);
    });
  }, []);

  return (
    <div data-testid="admin-enquiries">
      <h2 className="font-heading text-2xl font-bold mb-6">Enquiries & Messages</h2>

      <Tabs defaultValue="enquiries">
        <TabsList className="mb-6">
          <TabsTrigger value="enquiries">Ticket Enquiries ({enquiries.length})</TabsTrigger>
          <TabsTrigger value="messages">Contact Messages ({messages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="enquiries">
          <Card className="card-default">
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : enquiries.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No enquiries yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enquiries.map((enq) => (
                      <TableRow key={enq.enquiry_id}>
                        <TableCell className="font-medium">{enq.name}</TableCell>
                        <TableCell>{enq.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{enq.enquiry_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            enq.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            enq.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }>
                            {enq.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(enq.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card className="card-default">
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No contact messages yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((msg) => (
                      <TableRow key={msg.message_id}>
                        <TableCell className="font-medium">{msg.name}</TableCell>
                        <TableCell>{msg.email}</TableCell>
                        <TableCell>{msg.subject}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Media Uploads Management
function MediaUploads() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchUploads = async () => {
    try {
      const response = await fetch(`${API}/admin/uploads`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setUploads(data);
      }
    } catch (error) {
      console.error('Failed to fetch uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, GIF, WebP allowed.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API}/admin/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Image uploaded successfully!');
        fetchUploads();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`${API}/admin/uploads/${filename}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Image deleted');
        fetchUploads();
      } else {
        toast.error('Failed to delete image');
      }
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  const copyUrl = (url) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('URL copied to clipboard!');
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div data-testid="admin-uploads">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold">Media Library</h2>
          <p className="text-muted-foreground text-sm font-body">
            Upload and manage images for news articles and gallery
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="file-input"
          />
          <Button 
            className="btn-primary gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            data-testid="upload-button"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Image
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Upload Info */}
      <Card className="card-default mb-6 bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <ImageIcon className="w-5 h-5" />
            <span>Supported formats: JPEG, PNG, GIF, WebP • Max file size: 10MB</span>
          </div>
        </CardContent>
      </Card>

      {/* Gallery Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : uploads.length === 0 ? (
        <Card className="card-default">
          <CardContent className="py-16 text-center">
            <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading text-lg font-bold mb-2">No images uploaded yet</h3>
            <p className="text-muted-foreground font-body mb-4">
              Upload images to use in news articles and gallery
            </p>
            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Your First Image
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {uploads.map((file) => (
            <Card key={file.filename} className="card-default group overflow-hidden" data-testid={`upload-${file.filename}`}>
              <div className="aspect-square relative">
                <img 
                  src={file.url}
                  alt={file.filename}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => copyUrl(file.url)}
                    title="Copy URL"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDelete(file.filename)}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-xs font-mono truncate text-muted-foreground" title={file.filename}>
                  {file.filename}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Usage Instructions */}
      <Card className="card-default mt-8">
        <CardHeader>
          <CardTitle className="font-heading text-lg">How to Use Uploaded Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm font-body text-muted-foreground">
            <li>Upload an image using the button above</li>
            <li>Hover over the image and click the copy icon to copy the URL</li>
            <li>Paste the URL in the "Featured Image" field when creating news articles</li>
            <li>Or use the URL in gallery items</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

// Policies Management
function PoliciesManagement() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    title: '',
    description: '',
    category: 'general'
  });
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchPolicies = async () => {
    try {
      const response = await fetch(`${API}/admin/policies`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
      }
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 20MB.');
      return;
    }

    setSelectedFile(file);
    setNewPolicy(prev => ({
      ...prev,
      title: prev.title || file.name.replace('.pdf', '').replace(/_/g, ' ')
    }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a PDF file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', newPolicy.title);
    formData.append('description', newPolicy.description);
    formData.append('category', newPolicy.category);

    try {
      const response = await fetch(`${API}/admin/policies/upload?title=${encodeURIComponent(newPolicy.title)}&description=${encodeURIComponent(newPolicy.description)}&category=${newPolicy.category}`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        toast.success('Policy document uploaded successfully!');
        setDialogOpen(false);
        setNewPolicy({ title: '', description: '', category: 'general' });
        setSelectedFile(null);
        fetchPolicies();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (policyId) => {
    if (!window.confirm('Are you sure you want to delete this policy document?')) return;

    try {
      const response = await fetch(`${API}/admin/policies/${policyId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Policy deleted');
        fetchPolicies();
      } else {
        toast.error('Failed to delete policy');
      }
    } catch (error) {
      toast.error('Failed to delete policy');
    }
  };

  const toggleActive = async (policyId, isActive) => {
    try {
      const response = await fetch(`${API}/admin/policies/${policyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !isActive })
      });

      if (response.ok) {
        toast.success(`Policy ${!isActive ? 'activated' : 'deactivated'}`);
        fetchPolicies();
      }
    } catch (error) {
      toast.error('Failed to update policy');
    }
  };

  const categoryLabels = {
    general: 'General',
    governance: 'Governance',
    compliance: 'Compliance',
    conduct: 'Code of Conduct',
    other: 'Other'
  };

  return (
    <div data-testid="admin-policies">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold">Policy Documents</h2>
          <p className="text-muted-foreground text-sm font-body">
            Upload and manage policy PDFs for the KOGL website
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary gap-2" data-testid="upload-policy-btn">
              <Upload className="w-4 h-4" />
              Upload Policy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Upload Policy Document</DialogTitle>
              <DialogDescription className="font-body">
                Upload a PDF document for the policies section
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label>PDF File *</Label>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full justify-start"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {selectedFile ? selectedFile.name : 'Choose PDF file...'}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="policy-title">Title *</Label>
                <Input
                  id="policy-title"
                  value={newPolicy.title}
                  onChange={(e) => setNewPolicy(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="policy-category">Category</Label>
                <Select 
                  value={newPolicy.category}
                  onValueChange={(value) => setNewPolicy(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="governance">Governance</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="conduct">Code of Conduct</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="policy-description">Description</Label>
                <Textarea
                  id="policy-description"
                  value={newPolicy.description}
                  onChange={(e) => setNewPolicy(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary" disabled={uploading || !selectedFile}>
                  {uploading ? 'Uploading...' : 'Upload Policy'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Policies List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : policies.length === 0 ? (
        <Card className="card-default">
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading text-lg font-bold mb-2">No policy documents yet</h3>
            <p className="text-muted-foreground font-body mb-4">
              Upload PDF documents to display on the KOGL policies page
            </p>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Your First Policy
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="card-default">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.policy_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{policy.title}</p>
                        {policy.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {policy.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{categoryLabels[policy.category] || policy.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={policy.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {policy.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(policy.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <a href={policy.file_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" title="View PDF">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </a>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toggleActive(policy.policy_id, policy.is_active)}
                          title={policy.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {policy.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDelete(policy.policy_id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="card-default mt-8 bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Policy Document Guidelines</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Only PDF files are accepted (max 20MB)</li>
                <li>Active policies are displayed on the public KOGL page</li>
                <li>Use clear, descriptive titles for better organization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


