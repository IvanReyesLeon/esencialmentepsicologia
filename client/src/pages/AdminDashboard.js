import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { therapistAPI, pricingAPI, workshopAPI } from '../services/api';
import TherapistsTab from '../components/TherapistsTab';
import PricingTab from '../components/PricingTab';
import WorkshopsTab from '../components/WorkshopsTab';
import BlogTab from '../components/BlogTab';
import BillingTab from '../components/BillingTab';
import BillingDashboard from '../components/BillingDashboard';
import PatientsTab from '../components/PatientsTab';
import RemindersTab from '../components/RemindersTab';
import SyncTab from '../components/SyncTab';
import ProfileTab from '../components/ProfileTab';

import ExpensesTab from '../components/ExpensesTab';
import NotificationBell from '../components/NotificationBell';
import UserMenu from '../components/UserMenu';
import AddTherapistModal from '../components/AddTherapistModal';
import DeleteTherapistModal from '../components/DeleteTherapistModal';
import ErrorBoundary from '../components/ErrorBoundary';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('hub'); // Start at 'hub'
  const [therapists, setTherapists] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTherapistModal, setShowAddTherapistModal] = useState(false);
  const [showDeleteTherapistModal, setShowDeleteTherapistModal] = useState(false);

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
            title="Pacientes"
            icon="👥"
            color="#00BCD4"
            description="Ver y gestionar pacientes"
            onClick={() => setActiveTab('patients')}
          />
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
          <HubCard
            title="Recordatorios"
            icon="📬"
            color="#E91E63"
            description="Cola de emails recordatorios"
            onClick={() => setActiveTab('reminders')}
          />
        </>
      )}


    </div>
  );

  // Billing Submenu Hub - Simplificado
  const renderBillingHub = () => (
    <div className="admin-hub-grid">
      <HubCard
        title="Sesiones Semanales"
        icon="📊"
        color="#4285F4"
        description="Ver y gestionar pagos por semana"
        onClick={() => setActiveTab('billing')}
      />
      {user.role === 'admin' && (
        <>
          <HubCard
            title="Reportes y Estadísticas"
            icon="📈"
            color="#AA00FF"
            description="Dashboard con totales y tendencias"
            onClick={() => setActiveTab('billing-dashboard')}
          />
          <HubCard
            title="Gastos y Facturas"
            icon="💸"
            color="#e03131"
            description="Control de gastos y validación de facturas"
            onClick={() => setActiveTab('expenses')}
          />
        </>
      )}
      {user.role === 'admin' && (
        <HubCard
          title="Añadir terapeuta"
          icon="➕"
          color="#0F9D58"
          description="Añadir al sistema de facturación"
          onClick={() => setShowAddTherapistModal(true)}
        />
      )}
      {user.role === 'admin' && (
        <HubCard
          title="Eliminar terapeuta"
          icon="🗑️"
          color="#DC2626"
          description="Quitar del sistema de facturación"
          onClick={() => setShowDeleteTherapistModal(true)}
        />
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
          </div>

          <div className="header-actions">
            <NotificationBell />
            <UserMenu
              user={user}
              onLogout={handleLogout}
              onProfileClick={() => setActiveTab('profile')}
            />
          </div>
        </div>
      </header>

      <div className="dashboard-content-wrapper">
        {/* Back Button - Now in content area */}
        {activeTab !== 'hub' && (
          <div className="content-back-nav">
            <button className="btn-back-content" onClick={() => setActiveTab(activeTab === 'billing' ? 'billing-hub' : 'hub')}>
              ← {activeTab === 'billing' ? 'Volver a Facturación' : 'Volver al Menú'}
            </button>
          </div>
        )}

        {activeTab === 'hub' && renderHub()}
        {activeTab === 'billing-hub' && renderBillingHub()}

        {/* Content Views */}
        <div className={`tab-content ${!['hub', 'billing-hub'].includes(activeTab) ? 'visible' : 'hidden'}`}>
          <ErrorBoundary key={activeTab} onBack={() => setActiveTab('hub')}>
            {activeTab === 'therapists' && <TherapistsTab therapists={therapists} onRefresh={fetchData} />}
            {activeTab === 'pricing' && <PricingTab pricing={pricing} onRefresh={fetchData} />}
            {activeTab === 'workshops' && <WorkshopsTab workshops={workshops} onRefresh={fetchData} />}
            {activeTab === 'blog' && <BlogTab />}
            {activeTab === 'billing' && <BillingTab user={user} calendarId={CALENDAR_ID} />}
            {activeTab === 'billing-dashboard' && <BillingDashboard user={user} />}
            {activeTab === 'expenses' && <ExpensesTab user={user} />}
            {activeTab === 'patients' && <PatientsTab user={user} />}
            {activeTab === 'reminders' && <RemindersTab />}
            {activeTab === 'profile' && <ProfileTab user={user} onLogout={handleLogout} />}
          </ErrorBoundary>
        </div>
      </div>

      {/* Modal para añadir terapeuta al sistema de facturación */}
      <AddTherapistModal
        isOpen={showAddTherapistModal}
        onClose={() => setShowAddTherapistModal(false)}
        onSuccess={fetchData}
      />

      {/* Modal para eliminar terapeuta del sistema de facturación */}
      <DeleteTherapistModal
        isOpen={showDeleteTherapistModal}
        onClose={() => setShowDeleteTherapistModal(false)}
        onSuccess={fetchData}
      />
    </div >
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
    case 'billing': return 'Sesiones Semanales';
    case 'billing-dashboard': return 'Reportes y Estadísticas';
    case 'patients': return 'Gestión de Pacientes';
    case 'reminders': return 'Cola de Recordatorios';
    case 'profile': return 'Mi Cuenta';
    default: return 'Panel';
  }
};

export default AdminDashboard;
