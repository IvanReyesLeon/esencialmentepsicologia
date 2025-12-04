import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import Home from './pages/Home';
import Services from './pages/Services';
import Therapists from './pages/Therapists';
import TherapistDetail from './pages/TherapistDetail';
import Contact from './pages/Contact';
import Location from './pages/Location';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/terapeutas" element={<Therapists />} />
            <Route path="/terapeutas/:id" element={<TherapistDetail />} />
            <Route path="/servicios" element={<Services />} />
            <Route path="/donde-estamos" element={<Location />} />
            <Route path="/contacto" element={<Contact />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </main>
        <Footer />
        <CookieConsent />
      </div>
    </Router>
  );
}

export default App;
