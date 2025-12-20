import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { therapistAPI, pricingAPI, workshopAPI } from '../services/api';
import TherapistsTab from '../components/TherapistsTab';
import PricingTab from '../components/PricingTab';
import WorkshopsTab from '../components/WorkshopsTab';
import BlogTab from '../components/BlogTab';
import BillingTab from '../components/BillingTab';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('hub'); // Start at 'hub'

  // Password Change State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });
  const [therapists, setTherapists] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calendar ID provided by user
  const CALENDAR_ID = 'esencialmentepsicologia@gmail.com';

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/admin');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      // Ensure role exists (handle legacy login data)
      if (!parsedUser.role) parsedUser.role = 'admin';
      setUser(parsedUser);
    } catch (error) {
      navigate('/admin');
    }
  }, [navigate]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Solo fetch si es admin, o si se requiere para una vista.
      // Si el user es terapeuta, quizás no necesita cargar todos los workhops etc.
      // Pero por simplicidad cargamos.
      const [therapistsRes, pricingRes, workshopsRes] = await Promise.all([
        therapistAPI.getAll(),
        pricingAPI.getAll(),
        workshopAPI.getAll(true)
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
    // Fetch data only if user is logged in
    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user, fetchData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword: pwdCurrent, newPassword: pwdNew })
      });
      const data = await res.json();

      if (res.ok) {
        setPwdMsg({ type: 'success', text: 'Contraseña actualizada correctamente' });
        setPwdCurrent('');
        setPwdNew('');
        setTimeout(() => setShowPasswordModal(false), 2000);
      } else {
        setPwdMsg({ type: 'error', text: data.message || 'Error al cambiar la contraseña' });
      }
    } catch (error) {
      setPwdMsg({ type: 'error', text: 'Error de conexión' });
    }
  };

  const renderPasswordModal = () => {
    if (!showPasswordModal) return null;
    return (
      <div className="modal-overlay">
        <div className="modal-content password-modal">
          <h3>🔐 Cambiar Contraseña</h3>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Contraseña Actual:</label>
              <input
                type="password"
                value={pwdCurrent}
                onChange={(e) => setPwdCurrent(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Nueva Contraseña:</label>
              <input
                type="password"
                value={pwdNew}
                onChange={(e) => setPwdNew(e.target.value)}
                required
              />
            </div>
            {pwdMsg.text && <p className={`msg ${pwdMsg.type}`}>{pwdMsg.text}</p>}
            <div className="modal-actions">
              <button type="submit" className="btn-confirm">Actualizar</button>
              <button type="button" className="btn-cancel" onClick={() => setShowPasswordModal(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const HubCard = ({ title, icon, color, onClick, description }) => (
    <div className="hub-card" onClick={onClick} style={{ borderTopColor: color }}>
      <div className="hub-icon" style={{ backgroundColor: color + '20', color: color }}>
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );

  const renderHub = () => (
    <div className="admin-hub-grid">
      {/* Billing is available for Everyone (view tailored by role) */}
      <HubCard
        title="Facturación y Horas"
        icon="📅"
        color="#4285F4"
        description={user.role === 'admin' ? "Gestión financiera del equipo" : "Mis horas semanales"}
        onClick={() => setActiveTab('billing-hub')}
      />

      {/* Admin Only Sections */}
      {user.role === 'admin' && (
        <>
          <HubCard
            title="Terapeutas"
            icon="👨‍⚕️"
            color="#0F9D58"
            description="Gestionar perfiles del equipo"
            onClick={() => setActiveTab('therapists')}
          />
          <HubCard
            title="Precios y Tarifas"
            icon="💰"
            color="#F4B400"
            description="Editar precios de sesiones"
            onClick={() => setActiveTab('pricing')}
          />
          <HubCard
            title="Talleres"
            icon="🎓"
            color="#DB4437"
            description="Crear y gestionar talleres"
            onClick={() => setActiveTab('workshops')}
          />
          <HubCard
            title="Blog"
            icon="📰"
            color="#9C27B0"
            description="Escribir artículos y noticias"
            onClick={() => setActiveTab('blog')}
          />
        </>
      )}
    </div>
  );

  // Billing Submenu Hub
  const renderBillingHub = () => (
    <div className="admin-hub-grid">
      <HubCard
        title="Calendario y Horas"
        icon="📊"
        color="#4285F4"
        description="Ver horas trabajadas esta semana"
        onClick={() => setActiveTab('billing')}
      />
      <HubCard
        title="Registrar Pagos"
        icon="💳"
        color="#00C853"
        description="Marcar sesiones como pagadas"
        onClick={() => setActiveTab('billing')} // Same view for now
      />
      {user.role === 'admin' && (
        <>
          <HubCard
            title="Historial de Pagos"
            icon="📋"
            color="#FF6D00"
            description="Ver historial de facturación"
            onClick={() => setActiveTab('billing')} // Same view for now
          />
          <HubCard
            title="Resumen Mensual"
            icon="📈"
            color="#AA00FF"
            description="Estadísticas del mes"
            onClick={() => setActiveTab('billing')} // Same view for now
          />
        </>
      )}
    </div>
  );

  if (!user) return null;

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>{activeTab === 'hub' ? 'Panel de Gestión' : getTitle(activeTab)}</h1>
            {activeTab !== 'hub' && (
              <button className="btn-back" onClick={() => setActiveTab(activeTab === 'billing' ? 'billing-hub' : 'hub')}>
                ← {activeTab === 'billing' ? 'Volver a Facturación' : 'Volver al Menú'}
              </button>
            )}
          </div>

          <div className="header-actions">
            <div className="user-info">
              <span className="user-role">{user.role === 'admin' ? 'Administrador' : 'Terapeuta'}</span>
              <span className="user-email">{user.email}</span>
            </div>
            <button onClick={() => setShowPasswordModal(true)} className="btn btn-secondary btn-sm">
              🔐 Contraseña
            </button>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content-wrapper">
        {activeTab === 'hub' && renderHub()}
        {activeTab === 'billing-hub' && renderBillingHub()}

        {/* Content Views */}
        <div className={`tab-content ${!['hub', 'billing-hub'].includes(activeTab) ? 'visible' : 'hidden'}`}>
          {activeTab === 'therapists' && <TherapistsTab therapists={therapists} onRefresh={fetchData} />}
          {activeTab === 'pricing' && <PricingTab pricing={pricing} onRefresh={fetchData} />}
          {activeTab === 'workshops' && <WorkshopsTab workshops={workshops} onRefresh={fetchData} />}
          {activeTab === 'blog' && <BlogTab />}
          {activeTab === 'billing' && <BillingTab user={user} calendarId={CALENDAR_ID} />}
        </div>
      </div>
      {renderPasswordModal()}
    </div>
  );
};

// Helper
const getTitle = (tab) => {
  switch (tab) {
    case 'therapists': return 'Gestión de Terapeutas';
    case 'pricing': return 'Precios y Tarifas';
    case 'workshops': return 'Gestión de Talleres';
    case 'blog': return 'Blog y Noticias';
    case 'billing-hub': return 'Facturación y Horas';
    case 'billing': return 'Calendario y Horas';
    default: return 'Panel';
  }
};

export default AdminDashboard;
