import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { therapistAPI, pricingAPI, authAPI } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('therapists');
  const [therapists, setTherapists] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Therapist form state
  const [therapistForm, setTherapistForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    specialization: '',
    bio: '',
    experience: '',
    languages: '',
    sessionTypes: []
  });

  // Pricing form state
  const [pricingForm, setPricingForm] = useState({
    sessionType: 'individual',
    price: '',
    duration: '',
    description: ''
  });

  const [editingTherapist, setEditingTherapist] = useState(null);
  const [editingPricing, setEditingPricing] = useState(null);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin');
      return;
    }

    try {
      const response = await authAPI.getMe();
      if (response.data.role !== 'admin') {
        navigate('/admin');
        return;
      }
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/admin');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
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
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleTherapistSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...therapistForm,
        specialization: therapistForm.specialization.split(',').map(s => s.trim()),
        languages: therapistForm.languages.split(',').map(l => l.trim()),
        experience: parseInt(therapistForm.experience)
      };

      if (editingTherapist) {
        await therapistAPI.update(editingTherapist._id, formData);
      } else {
        await therapistAPI.create(formData);
      }

      resetTherapistForm();
      fetchData();
    } catch (error) {
      alert('Error al guardar terapeuta: ' + (error.response?.data?.message || error.message));
    }
  };

  const handlePricingSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...pricingForm,
        price: parseFloat(pricingForm.price),
        duration: parseInt(pricingForm.duration)
      };

      await pricingAPI.update(formData);
      resetPricingForm();
      fetchData();
    } catch (error) {
      alert('Error al guardar precio: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetTherapistForm = () => {
    setTherapistForm({
      username: '',
      email: '',
      password: '',
      fullName: '',
      specialization: '',
      bio: '',
      experience: '',
      languages: '',
      sessionTypes: []
    });
    setEditingTherapist(null);
  };

  const resetPricingForm = () => {
    setPricingForm({
      sessionType: 'individual',
      price: '',
      duration: '',
      description: ''
    });
    setEditingPricing(null);
  };

  const editTherapist = (therapist) => {
    setTherapistForm({
      username: therapist.user?.username || '',
      email: therapist.user?.email || '',
      password: '',
      fullName: therapist.fullName,
      specialization: therapist.specialization.join(', '),
      bio: therapist.bio,
      experience: therapist.experience.toString(),
      languages: therapist.languages?.join(', ') || '',
      sessionTypes: therapist.sessionTypes || []
    });
    setEditingTherapist(therapist);
  };

  const editPricing = (price) => {
    setPricingForm({
      sessionType: price.sessionType,
      price: price.price.toString(),
      duration: price.duration.toString(),
      description: price.description
    });
    setEditingPricing(price);
  };

  const deleteTherapist = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este terapeuta?')) {
      try {
        await therapistAPI.delete(id);
        fetchData();
      } catch (error) {
        alert('Error al eliminar terapeuta');
      }
    }
  };

  const deletePricing = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este precio?')) {
      try {
        await pricingAPI.delete(id);
        fetchData();
      } catch (error) {
        alert('Error al eliminar precio');
      }
    }
  };

  const handleSessionTypeChange = (type) => {
    const updatedTypes = therapistForm.sessionTypes.includes(type)
      ? therapistForm.sessionTypes.filter(t => t !== type)
      : [...therapistForm.sessionTypes, type];
    
    setTherapistForm({ ...therapistForm, sessionTypes: updatedTypes });
  };

  if (!user) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Panel de Administración</h1>
          <div className="header-actions">
            <span>Bienvenida, {user.username}</span>
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
            Terapeutas
          </button>
          <button 
            className={`nav-btn ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            Precios
          </button>
        </nav>

        <main className="dashboard-main">
          {activeTab === 'therapists' && (
            <div className="therapists-section">
              <h2>Gestión de Terapeutas</h2>
              
              <div className="form-section">
                <h3>{editingTherapist ? 'Editar Terapeuta' : 'Añadir Nuevo Terapeuta'}</h3>
                <form onSubmit={handleTherapistSubmit} className="therapist-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Usuario</label>
                      <input
                        type="text"
                        value={therapistForm.username}
                        onChange={(e) => setTherapistForm({...therapistForm, username: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={therapistForm.email}
                        onChange={(e) => setTherapistForm({...therapistForm, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Contraseña {editingTherapist && '(dejar vacío para mantener)'}</label>
                      <input
                        type="password"
                        value={therapistForm.password}
                        onChange={(e) => setTherapistForm({...therapistForm, password: e.target.value})}
                        required={!editingTherapist}
                      />
                    </div>
                    <div className="form-group">
                      <label>Nombre Completo</label>
                      <input
                        type="text"
                        value={therapistForm.fullName}
                        onChange={(e) => setTherapistForm({...therapistForm, fullName: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Especialización (separar con comas)</label>
                    <input
                      type="text"
                      value={therapistForm.specialization}
                      onChange={(e) => setTherapistForm({...therapistForm, specialization: e.target.value})}
                      placeholder="Ej: Ansiedad, Depresión, Terapia de pareja"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Biografía</label>
                    <textarea
                      value={therapistForm.bio}
                      onChange={(e) => setTherapistForm({...therapistForm, bio: e.target.value})}
                      rows="4"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Años de Experiencia</label>
                      <input
                        type="number"
                        value={therapistForm.experience}
                        onChange={(e) => setTherapistForm({...therapistForm, experience: e.target.value})}
                        min="0"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Idiomas (separar con comas)</label>
                      <input
                        type="text"
                        value={therapistForm.languages}
                        onChange={(e) => setTherapistForm({...therapistForm, languages: e.target.value})}
                        placeholder="Ej: Español, Inglés, Francés"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Tipos de Sesión</label>
                    <div className="checkbox-group">
                      {['individual', 'couple', 'family', 'group'].map(type => (
                        <label key={type} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={therapistForm.sessionTypes.includes(type)}
                            onChange={() => handleSessionTypeChange(type)}
                          />
                          {type === 'individual' && 'Individual'}
                          {type === 'couple' && 'Pareja'}
                          {type === 'family' && 'Familiar'}
                          {type === 'group' && 'Grupal'}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                      {editingTherapist ? 'Actualizar' : 'Crear'} Terapeuta
                    </button>
                    {editingTherapist && (
                      <button type="button" onClick={resetTherapistForm} className="btn btn-secondary">
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="list-section">
                <h3>Terapeutas Existentes</h3>
                {loading ? (
                  <div className="loading">Cargando...</div>
                ) : (
                  <div className="therapists-list">
                    {therapists.map(therapist => (
                      <div key={therapist._id} className="therapist-item">
                        <div className="therapist-info">
                          <h4>{therapist.fullName}</h4>
                          <p>{therapist.specialization.join(', ')}</p>
                          <p>{therapist.experience} años de experiencia</p>
                        </div>
                        <div className="therapist-actions">
                          <button onClick={() => editTherapist(therapist)} className="btn btn-small">
                            Editar
                          </button>
                          <button onClick={() => deleteTherapist(therapist._id)} className="btn btn-small btn-danger">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="pricing-section">
              <h2>Gestión de Precios</h2>
              
              <div className="form-section">
                <h3>{editingPricing ? 'Editar Precio' : 'Añadir/Actualizar Precio'}</h3>
                <form onSubmit={handlePricingSubmit} className="pricing-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tipo de Sesión</label>
                      <select
                        value={pricingForm.sessionType}
                        onChange={(e) => setPricingForm({...pricingForm, sessionType: e.target.value})}
                        required
                      >
                        <option value="individual">Individual</option>
                        <option value="couple">Pareja</option>
                        <option value="family">Familiar</option>
                        <option value="group">Grupal</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Precio (€)</label>
                      <input
                        type="number"
                        value={pricingForm.price}
                        onChange={(e) => setPricingForm({...pricingForm, price: e.target.value})}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Duración (minutos)</label>
                    <input
                      type="number"
                      value={pricingForm.duration}
                      onChange={(e) => setPricingForm({...pricingForm, duration: e.target.value})}
                      min="30"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Descripción</label>
                    <textarea
                      value={pricingForm.description}
                      onChange={(e) => setPricingForm({...pricingForm, description: e.target.value})}
                      rows="3"
                      required
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                      {editingPricing ? 'Actualizar' : 'Guardar'} Precio
                    </button>
                    {editingPricing && (
                      <button type="button" onClick={resetPricingForm} className="btn btn-secondary">
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="list-section">
                <h3>Precios Existentes</h3>
                {loading ? (
                  <div className="loading">Cargando...</div>
                ) : (
                  <div className="pricing-list">
                    {pricing.map(price => (
                      <div key={price._id} className="pricing-item">
                        <div className="pricing-info">
                          <h4>
                            {price.sessionType === 'individual' && 'Terapia Individual'}
                            {price.sessionType === 'couple' && 'Terapia de Pareja'}
                            {price.sessionType === 'family' && 'Terapia Familiar'}
                            {price.sessionType === 'group' && 'Terapia Grupal'}
                          </h4>
                          <p>{price.description}</p>
                          <p><strong>{price.price}€</strong> - {price.duration} minutos</p>
                        </div>
                        <div className="pricing-actions">
                          <button onClick={() => editPricing(price)} className="btn btn-small">
                            Editar
                          </button>
                          <button onClick={() => deletePricing(price._id)} className="btn btn-small btn-danger">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
