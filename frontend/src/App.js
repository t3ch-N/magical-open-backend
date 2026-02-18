import { useEffect, useRef, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";

// Pages
import HomePage from "./pages/HomePage";
import TournamentPage from "./pages/TournamentPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import TicketsPage from "./pages/TicketsPage";
import TravelPage from "./pages/TravelPage";
import MediaPage from "./pages/MediaPage";
import RegistrationPage from "./pages/RegistrationPage";
import NewsPage from "./pages/NewsPage";
import GalleryPage from "./pages/GalleryPage";
import AboutPage from "./pages/AboutPage";
import AboutKOGLPage from "./pages/AboutKOGLPage";
import ContactPage from "./pages/ContactPage";
import AdminDashboard from "./pages/AdminDashboard";
import VolunteerRegisterPage from "./pages/VolunteerRegisterPage";
import MarshalLoginPage from "./pages/MarshalLoginPage";
import MarshalDashboardPage from "./pages/MarshalDashboardPage";
import OperationsDashboardPage from "./pages/OperationsDashboardPage";
import PublicApplicationPage from "./pages/PublicApplicationPage";
import ApplyPage from "./pages/ApplyPage";
import ProAmPage from "./pages/ProAmPage";
import ProAmRegisterPage from "./pages/ProAmRegisterPage";
import WebmasterLoginPage from "./pages/WebmasterLoginPage";
import WebmasterDashboard from "./pages/WebmasterDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import HallOfFamePage from "./pages/HallOfFamePage";
import CMSPage from "./pages/CMSPage";

// Components
import MainLayout from "./components/MainLayout";
import AuthCallback from "./components/AuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";

import { Toaster } from "./components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth context
import { AuthProvider } from "./context/AuthContext";

function AppRouter() {
  const location = useLocation();
  
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  // Check URL fragment for session_id synchronously during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      {/* Marshal Dashboard Routes - Outside MainLayout, no indexing */}
      <Route path="/marshal-login" element={<MarshalLoginPage />} />
      <Route path="/marshal-dashboard" element={<MarshalDashboardPage />} />
      <Route path="/operations-dashboard" element={<OperationsDashboardPage />} />
      
      {/* Public Application Pages */}
      <Route path="/apply/:moduleSlug" element={<PublicApplicationPage />} />
      <Route path="/apply" element={<ApplyPage />} />
      
      {/* Pro-Am Pages */}
      <Route path="/pro-am" element={<ProAmPage />} />
      <Route path="/pro-am/register" element={<ProAmRegisterPage />} />
      
      {/* Webmaster Portal */}
      <Route path="/webmaster-login" element={<WebmasterLoginPage />} />
      <Route path="/webmaster-dashboard" element={<WebmasterDashboard />} />
      
      {/* Super Admin Dashboard (CIO Only) */}
      <Route path="/super-admin-dashboard" element={<SuperAdminDashboard />} />
      
      {/* Main Site Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tournament" element={<TournamentPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/players/:playerId" element={<LeaderboardPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/travel" element={<TravelPage />} />
        <Route path="/media" element={<MediaPage />} />
        <Route path="/registration" element={<RegistrationPage />} />
        <Route path="/volunteer-register" element={<VolunteerRegisterPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:articleId" element={<NewsPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/about-kogl" element={<AboutKOGLPage />} />
        <Route path="/hall-of-fame" element={<HallOfFamePage />} />
        <Route path="/page/:slug" element={<CMSPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
