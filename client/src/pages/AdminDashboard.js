import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { therapistAPI, pricingAPI, workshopAPI } from '../services/api';
import TherapistsTab from '../components/TherapistsTab';
import PricingTab from '../components/PricingTab';
import WorkshopsTab from '../components/WorkshopsTab';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('therapists');
  const [therapists, setTherapists] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/admin');
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      navigate('/admin');
    }
  }, [navigate]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [therapistsRes, pricingRes, workshopsRes] = await Promise.all([
        therapistAPI.getAll(),
        pricingAPI.getAll(),
        workshopAPI.getAll(true)  // incluir inactivos en admin
      ]);
      setTherapists(therapistsRes.data);
      setPricing(pricingRes.data);
      setWorkshops(workshopsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [activeTab, user, fetchData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin');
  };

  if (!user) return null;

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>📊 Panel de Administración</h1>
          <div className="header-actions">
            <span>Hola, {user.email}</span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <nav className="dashboard-nav">
          <button
            className={`nav-btn ${activeTab === 'therapists' ? 'active' : ''}`}
            onClick={() => setActiveTab('therapists')}
          >
            👨‍⚕️ Terapeutas
          </button>
          <button
            className={`nav-btn ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            💰 Precios
          </button>
          <button
            className={`nav-btn ${activeTab === 'workshops' ? 'active' : ''}`}
            onClick={() => setActiveTab('workshops')}
          >
            🎓 Talleres
          </button>
        </nav>

        <main className="dashboard-main">
          {activeTab === 'therapists' && (
            <TherapistsTab
              therapists={therapists}
              onRefresh={fetchData}
            />
          )}
          {activeTab === 'pricing' && (
            <PricingTab
              pricing={pricing}
              onRefresh={fetchData}
            />
          )}
          {activeTab === 'workshops' && (
            <WorkshopsTab
              workshops={workshops}
              onRefresh={fetchData}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
