import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { therapistAPI, pricingAPI, API_ROOT } from '../services/api';
import './AdminDashboard.css';

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast-notification ${type || ''}`}>
      <span className="toast-icon">{type === 'error' ? '❌' : '✅'}</span>
      <span className="toast-message">{message}</span>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('therapists');
  const [therapists, setTherapists] = useState([]);
  const [pricing, setPricing] = useState([]);
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
      const [therapistsRes, pricingRes] = await Promise.all([
        therapistAPI.getAll(),
        pricingAPI.getAll()
      ]);
      setTherapists(therapistsRes.data);
      setPricing(pricingRes.data);
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
        </main>
      </div>
    </div>
  );
};

// ============= THERAPISTS TAB =============
const TherapistsTab = ({ therapists, onRefresh }) => {
  const [toast, setToast] = useState(null);

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que quieres elim inar este terapeuta?')) {
      try {
        await therapistAPI.delete(id);
        onRefresh();
        setToast({ message: '✓ Terapeuta eliminado', type: 'success' });
      } catch (error) {
        setToast({ message: 'Error al eliminar', type: 'error' });
      }
    }
  };

  return (
    <div className="tab-content">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="tab-header">
        <h2>👨‍⚕️ Gestión de Terapeutas</h2>
      </div>

      <div className="items-list">
        {therapists.length === 0 ? (
          <p className="empty-state">No hay terapeutas aún</p>
        ) : (
          therapists.map(therapist => (
            <div key={therapist.id} className="item-card">
              <div className="therapist-photo-wrapper">
                <div className="therapist-photo">
                  {therapist.photo ? (
                    <img src={`${API_ROOT}/uploads/terapeutas/${therapist.photo}`} alt={therapist.full_name} />
                  ) : (
                    <div className="no-photo">
                      {therapist.full_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div className="item-info">
                <h3>{therapist.full_name}</h3>
                <p className="item-meta">
                  {therapist.specializations && Array.isArray(therapist.specializations)
                    ? therapist.specializations.join(', ')
                    : (therapist.specializations || 'Sin especialidades')}
                </p>
                <p className="item-detail">{therapist.experience} años de experiencia</p>
              </div>
              <div className="item-actions">
                <button className="btn btn-small btn-danger" onClick={() => handleDelete(therapist.id)}>
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============= PRICING TAB - GESTIÓN DE PRECIOS =============
const PricingTab = ({ pricing, onRefresh }) => {
  const [editing, setEditing] = useState({});
  const [toast, setToast] = useState(null);
  const [localPricing, setLocalPricing] = useState([]);

  // Sincronizar estado local con props
  useEffect(() => {
    setLocalPricing(pricing);
  }, [pricing]);

  const sessionTypes = [
    { name: 'Individual', key: 'individual' },
    { name: 'Pareja', key: 'couple' },
    { name: 'Familiar', key: 'family' },
    { name: 'Grupal', key: 'group' }
  ];

  const handleEdit = (priceItem) => {
    setEditing({
      ...editing,
      [priceItem.id]: {
        price: priceItem.price,
        duration: priceItem.duration,
        description: priceItem.description || '',
        is_active: priceItem.is_active
      }
    });
  };

  const handleCancel = (id) => {
    const newEditing = { ...editing };
    delete newEditing[id];
    setEditing(newEditing);
  };

  const handleSave = async (priceItem) => {
    try {
      const updates = editing[priceItem.id];
      await pricingAPI.update(priceItem.id, updates);
      await onRefresh();
      handleCancel(priceItem.id);
      setToast({
        message: '✓ Precio actualizado correctamente',
        type: 'success'
      });
    } catch (error) {
      setToast({
        message: 'Error al actualizar precio',
        type: 'error'
      });
    }
  };

  const toggleVisibility = async (priceItem) => {
    try {
      const newActiveState = !priceItem.is_active;

      // Actualizar estado local inmediatamente para feedback visual
      setLocalPricing(prev => prev.map(p =>
        p.id === priceItem.id ? { ...p, is_active: newActiveState } : p
      ));

      // Actualizar en el servidor
      await pricingAPI.update(priceItem.id, { is_active: newActiveState });

      // Refrescar datos del servidor
      await onRefresh();

      setToast({
        message: `✓ Precio ${newActiveState ? 'activado' : 'desactivado'}`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error toggling visibility:', error);
      // Revertir cambio local en caso de error
      setLocalPricing(pricing);
      setToast({
        message: 'Error al cambiar visibilidad',
        type: 'error'
      });
    }
  };

  const updateField = (id, field, value) => {
    setEditing({
      ...editing,
      [id]: {
        ...editing[id],
        [field]: value
      }
    });
  };

  return (
    <div className="tab-content">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="tab-header">
        <h2>💰 Gestión de Precios</h2>
      </div>

      <div className="pricing-list">
        {sessionTypes.map(type => {
          const priceItem = localPricing.find(p => p.session_type_name === type.key);
          const isEditing = priceItem && editing[priceItem.id];
          const editData = isEditing ? editing[priceItem.id] : {};

          return (
            <div key={type.key} className="pricing-card">
              <div className="pricing-header">
                <h3>{type.name}</h3>
                {priceItem && (
                  <div className="pricing-actions">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={priceItem.is_active}
                        onChange={() => toggleVisibility(priceItem)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span className="toggle-label">
                      {priceItem.is_active ? 'Visible' : 'Oculto'}
                    </span>
                  </div>
                )}
              </div>

              {priceItem ? (
                isEditing ? (
                  <div className="pricing-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Precio (€)</label>
                        <input
                          type="number"
                          value={editData.price || ''}
                          onChange={(e) => updateField(priceItem.id, 'price', e.target.value)}
                          placeholder="50"
                        />
                      </div>
                      <div className="form-group">
                        <label>Duración (min)</label>
                        <input
                          type="number"
                          value={editData.duration || ''}
                          onChange={(e) => updateField(priceItem.id, 'duration', e.target.value)}
                          placeholder="60"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Descripción</label>
                      <textarea
                        value={editData.description || ''}
                        onChange={(e) => updateField(priceItem.id, 'description', e.target.value)}
                        rows="3"
                        placeholder="Descripción opcional del servicio"
                      />
                    </div>
                    <div className="form-actions">
                      <button className="btn btn-primary btn-small" onClick={() => handleSave(priceItem)}>
                        ✓ Guardar
                      </button>
                      <button className="btn btn-secondary btn-small" onClick={() => handleCancel(priceItem.id)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pricing-display">
                    <div className="pricing-info">
                      <div className="pricing-price">{priceItem.price}€</div>
                      <div className="pricing-duration">{priceItem.duration} minutos</div>
                      {priceItem.description && (
                        <p className="pricing-description">{priceItem.description}</p>
                      )}
                    </div>
                    <button className="btn btn-small" onClick={() => handleEdit(priceItem)}>
                      ✏️ Editar
                    </button>
                  </div>
                )
              ) : (
                <div className="pricing-empty">
                  <p>No configurado aún</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboard;
