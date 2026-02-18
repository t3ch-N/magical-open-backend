import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { 
  Menu, 
  X, 
  ChevronDown,
  User,
  LogOut,
  Settings,
  Shield,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const MKO_LOGO_URL = "https://customer-assets.emergentagent.com/job_kenya-golf-tourney/artifacts/n9g48emm_MKO%20logo.jpeg";

// Social media links
const socialLinks = [
  { name: 'Facebook', icon: Facebook, url: 'https://www.facebook.com/MagicalKenyaOpen' },
  { name: 'Twitter', icon: Twitter, url: 'https://twitter.com/MagicalKenyaOpn' },
  { name: 'Instagram', icon: Instagram, url: 'https://www.instagram.com/magicalkenyaopen/' },
  { name: 'YouTube', icon: Youtube, url: 'https://www.youtube.com/@MagicalKenyaOpen' },
  { name: 'LinkedIn', icon: Linkedin, url: 'https://www.linkedin.com/company/kenya-open-golf-limited/' },
];

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'Leaderboard', path: '/leaderboard' },
  { name: 'Tickets', path: '/tickets' },
  { name: 'Hall of Fame', path: '/hall-of-fame' },
  { name: 'News', path: '/news' },
  { name: 'History', path: '/about' },
  { name: 'About KOGL', path: '/about-kogl' },
  { 
    name: 'More', 
    children: [
      { name: 'Tournament Info', path: '/tournament' },
      { name: 'Travel', path: '/travel' },
      { name: 'Media', path: '/media' },
      { name: 'Gallery', path: '/gallery' },
      { name: 'Contact', path: '/contact' },
    ]
  },
];

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/40" data-testid="main-header">
        <div className="container-custom">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
              <img 
                src={MKO_LOGO_URL} 
                alt="Magical Kenya Open" 
                className="h-14 w-auto"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1" data-testid="desktop-nav">
              {navItems.map((item) => (
                item.children ? (
                  <DropdownMenu key={item.name}>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 px-4 py-2 text-sm font-subheading font-semibold uppercase tracking-wider text-foreground hover:text-primary transition-colors">
                        {item.name}
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {item.children.map((child) => (
                        <DropdownMenuItem key={child.path} asChild>
                          <Link 
                            to={child.path}
                            className="w-full font-body"
                          >
                            {child.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 text-sm font-subheading font-semibold uppercase tracking-wider transition-colors ${
                      isActive(item.path) 
                        ? 'text-primary' 
                        : 'text-foreground hover:text-primary'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              ))}
            </nav>

            {/* Right side - Auth & Register */}
            <div className="hidden lg:flex items-center gap-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-body" data-testid="user-menu-button">
                      {user.picture ? (
                        <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          {user.name?.charAt(0)}
                        </div>
                      )}
                      <span className="hidden xl:block">{user.name}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">
                        Role: {user.role} ({user.role_status})
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    {user.role === 'admin' && user.role_status === 'approved' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/registration" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        My Registration
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button className="btn-primary opacity-75 cursor-not-allowed" disabled data-testid="register-button">
                  Register
                  <span className="ml-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Soon</span>
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-button"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border/40 bg-background" data-testid="mobile-nav">
            <div className="container-custom py-4">
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  item.children ? (
                    <div key={item.name} className="py-2">
                      <p className="text-xs font-subheading font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        {item.name}
                      </p>
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-2 pl-4 text-sm font-body hover:text-primary"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`py-2 text-sm font-subheading font-semibold uppercase tracking-wider ${
                        isActive(item.path) ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {item.name}
                    </Link>
                  )
                ))}
                <div className="pt-4 border-t border-border/40 mt-2">
                  {user ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{user.name}</p>
                      {user.role === 'admin' && user.role_status === 'approved' && (
                        <Link 
                          to="/admin" 
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-2 text-sm"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button onClick={logout} className="text-sm text-destructive">
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <Button className="btn-primary w-full opacity-75 cursor-not-allowed" disabled>
                      Register
                      <span className="ml-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Coming Soon</span>
                    </Button>
                  )}
                </div>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer - Improved spacing and readability */}
      <footer className="bg-[#373A36] text-white" data-testid="main-footer">
        <div className="container-custom py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
            {/* Brand */}
            <div>
              <img 
                src={MKO_LOGO_URL} 
                alt="Magical Kenya Open" 
                className="h-20 w-auto mb-8 brightness-0 invert"
              />
              <p className="text-white/70 font-body text-base leading-relaxed mb-6">
                Experience world-class golf in the heart of Kenya. A DP World Tour event showcasing Africa's finest golfing talent.
              </p>
              {/* Social Links */}
              <div className="flex gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 bg-white/10 rounded flex items-center justify-center hover:bg-[#D50032] transition-colors"
                    data-testid={`social-${social.name.toLowerCase()}`}
                    title={social.name}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-subheading font-bold uppercase tracking-wider text-base mb-8 text-white">Quick Links</h4>
              <ul className="space-y-4">
                {['Tournament', 'Leaderboard', 'Tickets', 'News'].map((item) => (
                  <li key={item}>
                    <Link 
                      to={`/${item.toLowerCase()}`}
                      className="text-white/70 hover:text-[#D50032] text-base font-body transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Information */}
            <div>
              <h4 className="font-subheading font-bold uppercase tracking-wider text-base mb-8 text-white">Information</h4>
              <ul className="space-y-4">
                {['About Tournament', 'About KOGL', 'Media', 'Contact'].map((item) => (
                  <li key={item}>
                    <Link 
                      to={`/${item.toLowerCase().replace(' ', '-')}`}
                      className="text-white/70 hover:text-[#D50032] text-base font-body transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-subheading font-bold uppercase tracking-wider text-base mb-8 text-white">Contact</h4>
              <address className="not-italic text-white/70 text-base font-body space-y-3">
                <p>Kenya Open Golf Limited</p>
                <p>Nairobi, Kenya</p>
                <p className="pt-3">
                  <a href="mailto:info@magicalkenyaopen.com" className="hover:text-[#D50032] transition-colors">
                    info@magicalkenyaopen.com
                  </a>
                </p>
              </address>
              {/* Admin Login Link */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <Link 
                  to="/registration"
                  className="inline-flex items-center gap-2 text-white/50 hover:text-[#D50032] text-sm font-body transition-colors"
                  data-testid="admin-login-link"
                >
                  <Shield className="w-4 h-4" />
                  Admin Login
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-white/20 mt-16 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-white/50 text-sm font-body">
              © {new Date().getFullYear()} Kenya Open Golf Limited. All rights reserved.
            </p>
            <div className="flex items-center gap-8">
              <a href="#" className="text-white/50 hover:text-white text-sm font-body transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-white/50 hover:text-white text-sm font-body transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
