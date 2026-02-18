import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { API } from '../App';
import { Loader2 } from 'lucide-react';

export default function CMSPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await fetch(`${API}/pages/${slug}`);
        if (response.ok) {
          setPage(await response.json());
        } else {
          setError('Page not found');
        }
      } catch (err) {
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
        <p className="text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{page.meta_title || page.title} - Magical Kenya Open</title>
        {page.meta_description && <meta name="description" content={page.meta_description} />}
      </Helmet>

      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d]">
        {page.featured_image && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${page.featured_image})` }}
          />
        )}
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{page.title}</h1>
          {page.excerpt && (
            <p className="text-xl text-white/80 max-w-2xl">{page.excerpt}</p>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div 
            className="prose prose-lg max-w-4xl mx-auto"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </section>

      <style>{`
        .prose h1 { font-size: 2.25rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; color: #1a1a1a; }
        .prose h2 { font-size: 1.875rem; font-weight: 600; margin-top: 1.75rem; margin-bottom: 0.75rem; color: #1a1a1a; }
        .prose h3 { font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #1a1a1a; }
        .prose p { margin-bottom: 1.25rem; line-height: 1.8; color: #374151; }
        .prose ul, .prose ol { margin-bottom: 1.25rem; padding-left: 1.5rem; }
        .prose li { margin-bottom: 0.5rem; }
        .prose a { color: #D50032; text-decoration: underline; }
        .prose img { border-radius: 8px; margin: 1.5rem 0; }
        .prose blockquote { border-left: 4px solid #D50032; padding-left: 1rem; font-style: italic; color: #6b7280; }
      `}</style>
    </>
  );
}
