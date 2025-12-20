import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Services from './pages/Services';
import Therapists from './pages/Therapists';
import TherapistDetail from './pages/TherapistDetail';
import Contact from './pages/Contact';
import Location from './pages/Location';
import Workshops from './pages/Workshops';
import WorkshopDetail from './pages/WorkshopDetail';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

// Layout wrapper that conditionally shows Navbar/Footer
const Layout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="App">
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
          <Route path="/donde-estamos" element={<Location />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/talleres" element={<Workshops />} />
          <Route path="/talleres/:id" element={<WorkshopDetail />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />

          {/* Admin Routes - No Navbar/Footer */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
