import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { therapistAPI, API_ROOT } from '../services/api';
import './Therapists.css';

import SEOHead from '../components/SEOHead';

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
      <SEOHead
        title="Nuestros Psicólogos | Esencialmente Psicología"
        description="Conoce a nuestro equipo de psicólogos en Barcelona. Especialistas en terapia individual, de pareja y familiar."
      />
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
                <div key={therapist.id} className="therapist-card">
                  <div className="therapist-image">
                    {therapist.photo ? (
                      <img
                        src={`${API_ROOT}/uploads/terapeutas/${therapist.photo}`}
                        alt={therapist.full_name}
                        className="therapist-photo"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement.querySelector('.placeholder-avatar').style.display = 'flex';
                        }}
                      />
                    ) : (
                      <div className="placeholder-avatar">
                        <span>👤</span>
                      </div>
                    )}
                  </div>
                  <div className="therapist-info">
                    <h3>{therapist.full_name}</h3>
                    <p className="therapist-title">
                      {therapist.specializations && Array.isArray(therapist.specializations)
                        ? therapist.specializations.join(' • ')
                        : (therapist.specializations || 'Psicólogo')}
                    </p>

                    <Link
                      to={`/terapeutas/${therapist.slug || therapist.id}`}
                      state={{ therapist }}
                      className="btn btn-secondary therapist-btn"
                    >
                      VER PERFIL
                    </Link>
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
