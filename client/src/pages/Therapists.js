import React, { useState, useEffect } from 'react';
import { therapistAPI } from '../services/api';
import './Therapists.css';

const Therapists = () => {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTherapists();
  }, []);

  const fetchTherapists = async () => {
    try {
      const response = await therapistAPI.getAll();
      setTherapists(response.data);
    } catch (err) {
      setError('Error al cargar los terapeutas');
      console.error('Error fetching therapists:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="therapists">
        <div className="container">
          <div className="loading">Cargando terapeutas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="therapists">
      {/* Hero Section */}
      <section className="therapists-hero">
        <div className="container">
          <h1>Nuestos profesionales</h1>
          <p>Conoce a nuestro equipo de especialistas en psicología</p>
        </div>
      </section>

      <div className="therapists-content">
        <div className="container">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {therapists.length === 0 && !error ? (
            <div className="no-therapists">
              <h2>Próximamente</h2>
              <p>Estamos preparando la información de nuestros terapeutas. Vuelve pronto para conocer a nuestro equipo.</p>
            </div>
          ) : (
            <div className="therapists-grid">
              {therapists.map((therapist) => (
                <div key={therapist._id} className="therapist-card">
                  <div className="therapist-image">
                    {therapist.photo ? (
                      <img 
                        src={`/assets/terapeutas/${therapist.photo}`} 
                        alt={therapist.fullName}
                        className="therapist-photo"
                      />
                    ) : (
                      <div className="placeholder-avatar">
                        <span>👤</span>
                      </div>
                    )}
                  </div>
                  <div className="therapist-info">
                    <h3>{therapist.fullName}</h3>
                    <p className="therapist-title">{therapist.specialization.join(' • ')}</p>
                    <p className="therapist-description">{therapist.bio}</p>
                    <button className="btn btn-secondary therapist-btn">CONOCER MÁS</button>
                    <p className="bio">{therapist.bio}</p>

                    <div className="details">
                      <div className="detail-item">
                        <strong>Experiencia:</strong> {therapist.experience} años
                      </div>
                      
                      {therapist.languages && therapist.languages.length > 0 && (
                        <div className="detail-item">
                          <strong>Idiomas:</strong> {therapist.languages.join(', ')}
                        </div>
                      )}

                      {therapist.sessionTypes && therapist.sessionTypes.length > 0 && (
                        <div className="detail-item">
                          <strong>Tipos de sesión:</strong>
                          <div className="session-types">
                            {therapist.sessionTypes.map((type, index) => (
                              <span key={index} className="session-type">
                                {type === 'individual' && 'Individual'}
                                {type === 'couple' && 'Pareja'}
                                {type === 'family' && 'Familiar'}
                                {type === 'group' && 'Grupal'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {therapist.education && therapist.education.length > 0 && (
                        <div className="detail-item">
                          <strong>Formación:</strong>
                          <ul className="education-list">
                            {therapist.education.map((edu, index) => (
                              <li key={index}>
                                {edu.degree} - {edu.university} ({edu.year})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="cta-section">
            <h2>¿Quieres solicitar una cita?</h2>
            <p>Contacta con nosotros para programar tu primera sesión</p>
            <a href="/contacto" className="btn btn-primary">Solicitar Cita</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Therapists;
