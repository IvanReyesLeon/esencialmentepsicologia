import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Toaster } from 'sileo';
import 'sileo/styles.css';
import CookieConsent from './components/CookieConsent';
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
import './App.css';

// Layout wrapper that conditionally shows Navbar/Footer
const Layout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="App">
      <Toaster position="top-center" />
      {!isAdminRoute && <Navbar />}
      <main>{children}</main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <CookieConsent />}
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
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
