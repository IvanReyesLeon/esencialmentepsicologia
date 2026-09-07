import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Toaster } from 'sileo';
import 'sileo/styles.css';
import CookieConsent from './components/CookieConsent';
import StickyWhatsApp from './components/StickyWhatsApp';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Services from './pages/Services';
import Therapists from './pages/Therapists';
import TherapistDetail from './pages/TherapistDetail';
import Contact from './pages/Contact';
import LocationPage from './pages/Location';
import './App.css';

// Ensure global styles handle text-white! override if necessary, 
// though sileo might handle inline styles via this prop pattern.
// Just in case, define css if needed elsewhere, but let's assume standard css or inline handling.
import Workshops from './pages/Workshops';
import WorkshopDetail from './pages/WorkshopDetail';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PsicoAccesible from './pages/PsicoAccesible';
import LocalHub from './pages/LocalHub';
import LocalCityPage from './pages/LocalCityPage';
import OnlineTherapy from './pages/OnlineTherapy';

// Layout wrapper that conditionally shows Navbar/Footer and manages analytics exclusion
const Layout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Sincronizar exclusión de GA4 para rutas administrativas durante navegación cliente (SPA)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isAdminRoute) {
        window['ga-disable-G-MWQB9NXPFJ'] = true;
      } else {
        window['ga-disable-G-MWQB9NXPFJ'] = false;
      }
    }
  }, [isAdminRoute]);

  return (
    <div className="App">
      <Toaster position="top-center" />
      {!isAdminRoute && <Navbar />}
      <main>{children}</main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <CookieConsent />}
      {!isAdminRoute && <StickyWhatsApp />}
    </div>
  );
};

function App() {
  React.useEffect(() => {
    // Ping al servidor para despertar el servicio en Render
    fetch('https://esencialmentepsicologia.onrender.com')
      .then(() => console.log('Server pinged'))
      .catch(err => console.log('Ping error:', err));
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/terapeutas" element={<Therapists />} />
          <Route path="/terapeutas/:id" element={<TherapistDetail />} />
          <Route path="/servicios" element={<Services />} />
          <Route path="/terapia-online" element={<OnlineTherapy />} />
          <Route path="/donde-estamos" element={<LocationPage />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/talleres" element={<Workshops />} />
          <Route path="/talleres/:id" element={<WorkshopDetail />} />
          <Route path="/psico-accesible" element={<PsicoAccesible />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />

          <Route path="/politica-privacidad" element={<PrivacyPolicy />} />
          <Route path="/politica-cookies" element={<CookiePolicy />} />

          {/* Admin Routes - No Navbar/Footer */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* Regional SEO & GEO Routes */}
          <Route path="/psicologo-valles-occidental" element={<LocalHub />} />
          <Route path="/psicologo-cerdanyola-del-valle" element={<Navigate to="/psicologo-cerdanyola-del-valles" replace />} />
          <Route path="/psicologo-barbera-del-valle" element={<Navigate to="/psicologo-barbera-del-valles" replace />} />
          <Route path="/psicologo-cerdanyola-del-valles" element={<LocalCityPage citySlug="cerdanyola-del-valles" />} />
          <Route path="/psicologo-sabadell" element={<LocalCityPage citySlug="sabadell" />} />
          <Route path="/psicologo-sant-cugat" element={<LocalCityPage citySlug="sant-cugat" />} />
          <Route path="/psicologo-rubi" element={<LocalCityPage citySlug="rubi" />} />
          <Route path="/psicologo-terrassa" element={<LocalCityPage citySlug="terrassa" />} />
          <Route path="/psicologo-barbera-del-valles" element={<LocalCityPage citySlug="barbera-del-valles" />} />

          {/* 404 Fallback Safe Route */}
          <Route path="*" element={
            <div className="container" style={{ padding: '80px 20px', textAlign: 'center', minHeight: '60vh' }}>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '15px', color: '#333' }}>404 - Página no encontrada</h1>
              <p style={{ margin: '20px 0', fontSize: '1.1rem', color: '#666' }}>Lo sentimos, la página que estás buscando no existe o ha cambiado de dirección.</p>
              <a href="/" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '15px', padding: '12px 28px', borderRadius: '30px', textDecoration: 'none' }}>Volver al Inicio</a>
            </div>
          } />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
