import React, { useState, useEffect } from 'react';
import { therapistAPI, API_ROOT } from '../services/api';
import './Admin.css';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [therapists, setTherapists] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    specialization: '',
    bio: '',
    experience: '',
    languages: '',
    photo: null,
    sessionTypes: []
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchTherapists();
    }
  }, [isAuthenticated]);

  // Simple password check (in production, use proper authentication)
  const handleLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'admin2024') { // Change this password as needed
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Contraseña incorrecta');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-container">
          <div className="login-form">
            <h2>Acceso Administrador</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Contraseña de Administrador</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Ingresa la contraseña"
                  required
                />
              </div>
              {loginError && (
                <div className="message error">{loginError}</div>
              )}
              <button type="submit" className="btn btn-primary">
                Acceder
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const fetchTherapists = async () => {
    try {
      const response = await therapistAPI.getAll();
      setTherapists(response.data);
    } catch (error) {
      console.error('Error fetching therapists:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        sessionTypes: checked 
          ? [...prev.sessionTypes, value]
          : prev.sessionTypes.filter(type => type !== value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      photo: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validate required fields
      if (!formData.fullName || !formData.specialization || !formData.bio || !formData.experience || formData.sessionTypes.length === 0) {
        setMessage('Por favor, completa todos los campos obligatorios');
        setLoading(false);
        return;
      }

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('fullName', formData.fullName);
      submitData.append('bio', formData.bio);
      submitData.append('experience', parseInt(formData.experience));

      // specialization: split CSV and append as repeated fields
      const specs = (formData.specialization || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (specs.length > 0) {
        specs.forEach(s => submitData.append('specialization', s));
      }

      // languages: split CSV and append as repeated fields
      const langs = (formData.languages || '')
        .split(',')
        .map(l => l.trim())
        .filter(Boolean);
      if (langs.length > 0) {
        langs.forEach(l => submitData.append('languages', l));
      }

      // sessionTypes: append each selected value directly (no JSON.stringify)
      if (Array.isArray(formData.sessionTypes) && formData.sessionTypes.length > 0) {
        formData.sessionTypes.forEach(t => submitData.append('sessionTypes', t));
      }
      
      // Append photo file if selected
      if (formData.photo) {
        submitData.append('photo', formData.photo);
      }

      console.log('Enviando datos con archivo...');
      
      const response = await therapistAPI.create(submitData);
      const result = response.data;
      console.log('Respuesta del servidor:', result);
      
      setMessage('✅ Terapeuta añadido exitosamente con imagen');
      setShowForm(false);
      setFormData({
        fullName: '',
        specialization: '',
        bio: '',
        experience: '',
        languages: '',
        photo: null,
        sessionTypes: []
      });
      
      // Recargar la lista de terapeutas
      await fetchTherapists();
      
    } catch (error) {
      console.error('Error completo:', error);
      const backendMsg = error.response?.data?.message;
      const status = error.response?.status;
      const errorMessage = backendMsg || error.message || 'Error desconocido';
      setMessage(`❌ Error al añadir terapeuta${status ? ` (HTTP ${status})` : ''}: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás segura de que quieres eliminar este terapeuta?')) {
      try {
        await therapistAPI.delete(id);
        setMessage('Terapeuta eliminado exitosamente');
        fetchTherapists();
      } catch (error) {
        setMessage('Error al eliminar terapeuta: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const updateTherapistPhoto = async (therapistId, photoName) => {
    try {
      await therapistAPI.updatePhoto(therapistId, { photo: photoName });
      console.log(`Foto actualizada para terapeuta ${therapistId}: ${photoName}`);
      fetchTherapists(); // Recargar lista
    } catch (error) {
      console.error('Error actualizando foto:', error);
    }
  };

  return (
    <div className="admin-panel">
      <div className="container">
        <div className="admin-header">
          <h1>Panel de Administración - Terapeutas</h1>
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancelar' : 'Añadir Nuevo Terapeuta'}
          </button>
        </div>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="therapist-form">
            <h2>Añadir Nuevo Terapeuta</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Especializaciones * (separadas por comas)</label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="Ansiedad, Depresión, Terapia de Pareja"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Años de Experiencia *</label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Idiomas (separados por comas)</label>
                <input
                  type="text"
                  name="languages"
                  value={formData.languages}
                  onChange={handleInputChange}
                  placeholder="Español, Catalán, Inglés"
                />
              </div>

              <div className="form-group">
                <label>Biografía *</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Descripción profesional del terapeuta..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Foto del Terapeuta</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <small>Nota: Después de seleccionar la foto, cópiala manualmente a la carpeta /assets/terapeutas/</small>
              </div>

              <div className="form-group">
                <label>Tipos de Sesión *</label>
                <div className="checkbox-group">
                  {['individual', 'couple', 'family', 'group'].map(type => (
                    <label key={type} className="checkbox-label">
                      <input
                        type="checkbox"
                        value={type}
                        checked={formData.sessionTypes.includes(type)}
                        onChange={handleInputChange}
                      />
                      {type === 'individual' ? 'Individual' : 
                       type === 'couple' ? 'Pareja' :
                       type === 'family' ? 'Familiar' : 'Grupal'}
                    </label>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Añadiendo...' : 'Añadir Terapeuta'}
              </button>
            </form>
          </div>
        )}

        <div className="therapists-list">
          <h2>Terapeutas Actuales</h2>
          <div className="therapists-grid">
            {therapists.map(therapist => (
              <div key={therapist._id} className="therapist-card">
                <div className="therapist-photo">
                  {therapist.photo ? (
                    <img 
                      src={`${API_ROOT}/uploads/terapeutas/${therapist.photo}`}
                      alt={therapist.fullName}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `/assets/terapeutas/${therapist.photo}`; }}
                    />
                  ) : (
                    <div className="no-photo">Sin foto</div>
                  )}
                </div>
                <div className="therapist-info">
                  <h3>{therapist.fullName}</h3>
                  <p className="specializations">
                    {therapist.specialization.join(', ')}
                  </p>
                  <p className="experience">{therapist.experience} años de experiencia</p>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(therapist._id)}
                  >
                    Eliminar
                  </button>
                  {therapist.fullName.includes('Anna') && (
                    <button 
                      type="button"
                      className="btn btn-info btn-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateTherapistPhoto(therapist._id, 'anna_becerra.jpg');
                      }}
                      style={{ 
                        cursor: 'pointer', 
                        pointerEvents: 'auto',
                        zIndex: 100,
                        position: 'relative'
                      }}
                    >
                      Fijar Foto Anna
                    </button>
                  )}
                  {therapist.fullName.includes('Lucía') && (
                    <button 
                      type="button"
                      className="btn btn-info btn-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateTherapistPhoto(therapist._id, 'lucia_gomez.jpeg');
                      }}
                      style={{ 
                        cursor: 'pointer', 
                        pointerEvents: 'auto',
                        zIndex: 100,
                        position: 'relative'
                      }}
                    >
                      Fijar Foto Lucía
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
