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
          <h1>Nuestros profesionales</h1>
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
                        src={therapist.photo.startsWith('http')
                          ? therapist.photo
                          : therapist.photo.includes('/uploads/terapeutas/')
                            ? `${API_ROOT}${therapist.photo}`
                            : `${API_ROOT}/uploads/terapeutas/${therapist.photo}`}
                        alt={therapist.full_name}
                        className="therapist-photo"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          // Si falla la carga, ocultamos la imagen para mostrar el placeholder base si existe, 
                          // o idealmente cambiamos el src a una imagen por defecto.
                          // Dado que el diseño usa un div placeholder alternativa, lo más robusto aquí
                          // es simplemente ocultar la imagen rota para que no se vea el icono de imagen rota.
                          // O mejor aún, poner una imagen de fallback transparente o un avatar genérico.
                          e.currentTarget.style.display = 'none';
                          // Intentar mostrar el placeholder si existe como hermano (aunque en este render condicional no existe).
                          // Solución: Forzamos el renderizado del placeholder siempre y ocultamos/mostramos con CSS,
                          // O simplemente cambiamos el src a un placeholder.
                          e.currentTarget.src = '/icons/avatar-placeholder.png';
                          e.currentTarget.style.display = 'block'; // Aseguramos que se vea
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
                    {therapist.label && (
                      <div className="therapist-label">{therapist.label}</div>
                    )}
                    {/* Solo mostramos especializaciones si no hay etiqueta, o si la etiqueta es corta (menos de 20 caracteres) para evitar redundancia visual */}
                    {(!therapist.label || therapist.label.length < 20) && (
                      <p className="therapist-title">
                        {therapist.specializations && Array.isArray(therapist.specializations)
                          ? therapist.specializations.join(' • ')
                          : (therapist.specializations || 'Psicólogo')}
                      </p>
                    )}

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
