import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API } from '../App';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Search,
  Calendar,
  User,
  ArrowLeft,
  Tag,
  Share2,
  Clock
} from 'lucide-react';

export default function NewsPage() {
  const { articleId } = useParams();
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (articleId) {
      // Fetch single article
      fetch(`${API}/news/${articleId}`)
        .then(r => r.json())
        .then(data => {
          setSelectedArticle(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      // Fetch all articles
      fetch(`${API}/news`)
        .then(r => r.json())
        .then(data => {
          setArticles(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => {
          setArticles([]);
          setLoading(false);
        });
    }
  }, [articleId]);

  const categories = ['all', 'tournament', 'players', 'course', 'community'];

  const filteredArticles = articles.filter(article => {
    const title = article.title || '';
    const excerpt = article.excerpt || article.summary || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Single article view
  if (articleId && selectedArticle) {
    const articleImage = selectedArticle.image_url || selectedArticle.featured_image;
    const articleAuthor = selectedArticle.author || selectedArticle.author_name || 'MKO Press';
    const articleExcerpt = selectedArticle.summary || selectedArticle.excerpt || '';
    
    return (
      <div data-testid="article-page">
        {/* Back Navigation */}
        <div className="container-custom pt-6">
          <Link to="/news" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 font-body">
            <ArrowLeft className="w-4 h-4" /> Back to News
          </Link>
        </div>

        {/* Article Header */}
        <section className="container-custom pb-6">
          <Badge className="bg-primary text-white mb-4">{selectedArticle.category}</Badge>
          <h1 className="font-heading text-3xl md:text-4xl font-bold max-w-4xl mb-4">
            {selectedArticle.title}
          </h1>
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {articleAuthor}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(selectedArticle.created_at || selectedArticle.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <Button variant="ghost" size="sm" className="ml-auto gap-2">
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>
        </section>

        {/* Featured Image - Full Width */}
        {articleImage && (
          <section className="container-custom pb-8">
            <div className="rounded-lg overflow-hidden">
              <img 
                src={articleImage} 
                alt={selectedArticle.title}
                className="w-full h-auto max-h-[500px] object-contain bg-muted"
                onError={(e) => { e.target.parentElement.style.display = 'none'; }}
              />
            </div>
          </section>
        )}

        {/* Article Content */}
        <section className="section-spacing pt-0">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto">
              {/* Excerpt */}
              {articleExcerpt && (
                <p className="text-xl font-body text-muted-foreground mb-8 leading-relaxed border-l-4 border-primary pl-4">
                  {articleExcerpt}
                </p>
              )}

              {/* Content */}
              <div className="prose prose-lg font-body max-w-none">
                <div dangerouslySetInnerHTML={{ __html: selectedArticle.content?.replace(/\n/g, '<br/>') || '' }} />
              </div>

              {/* Tags */}
              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-border/40">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  {selectedArticle.tags.map((tag, i) => (
                    <Badge key={i} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // News listing view
  return (
    <div data-testid="news-page">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container-custom">
          <Badge className="bg-accent text-accent-foreground mb-4 px-4 py-2">
            Latest Updates
          </Badge>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            News & Stories
          </h1>
          <p className="text-primary-foreground/80 text-lg font-body max-w-2xl">
            Stay up to date with all the latest from the Magical Kenya Open
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b border-border/40 sticky top-20 bg-background z-40">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search news..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="news-search"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="capitalize whitespace-nowrap"
                  data-testid={`category-${cat}`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="section-spacing">
        <div className="container-custom">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground font-body">No articles found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.map((article) => (
                <Link 
                  key={article.news_id || article.article_id} 
                  to={`/news/${article.news_id || article.article_id}`}
                  data-testid={`article-card-${article.news_id || article.article_id}`}
                >
                  <Card className="card-default group hover-lift h-full overflow-hidden">
                    {(article.image_url || article.featured_image) && (
                      <div className="aspect-video overflow-hidden bg-muted">
                        <img 
                          src={article.image_url || article.featured_image} 
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <Badge variant="outline" className="mb-3 capitalize">{article.category}</Badge>
                      <h3 className="font-heading text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-muted-foreground font-body text-sm line-clamp-3 mb-4">
                        {article.summary || article.excerpt || article.content?.substring(0, 150) + '...'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {article.author || article.author_name || 'MKO Press'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(article.created_at || article.published_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
