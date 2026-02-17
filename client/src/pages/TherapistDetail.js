import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { therapistAPI, API_ROOT } from '../services/api';
import './TherapistDetail.css';
import SEOHead from '../components/SEOHead';

const TherapistDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const initialTherapist = location.state?.therapist || null;
  const [therapist, setTherapist] = useState(initialTherapist);
  const [loading, setLoading] = useState(!initialTherapist);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(!initialTherapist); // Only show loading if we don't have initial data
        const res = await therapistAPI.getById(id);
        setTherapist(res.data);
      } catch (e) {
        setError('No se pudo cargar la información del terapeuta.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]); // Removed 'therapist' dependency, fixed SWR logic

  if (loading) {
    return (
      <div className="therapist-detail">
        <div className="container">
          <div className="loading">Cargando perfil...</div>
        </div>
      </div>
    );
  }

  if (error || !therapist) {
    return (
      <div className="therapist-detail">
        <div className="container">
          <div className="error-message">{error || 'Perfil no disponible'}</div>
          <Link to="/terapeutas" className="btn btn-secondary">Volver</Link>
        </div>
      </div>
    );
  }

  // Prepare structured data for Schema.org
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Physician",
    "name": therapist.full_name,
    "medicalSpecialty": therapist.specializations?.map(s => ({
      "@type": "MedicalSpecialty",
      "name": s
    })),
    "description": therapist.bio,
    "image": therapist.photo
      ? (therapist.photo.startsWith('http') ? therapist.photo : `${API_ROOT}/uploads/terapeutas/${therapist.photo}`)
      : undefined,
    "url": window.location.href,
    "telephone": "+34649490140", // Placeholder or actual clinic phone
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Carrer del Bruc, 123", // Example address
      "addressLocality": "Barcelona",
      "postalCode": "08009",
      "addressCountry": "ES"
    }
  };

  return (
    <div className="therapist-detail">
      <SEOHead
        title={`${therapist.full_name} | Psicólogo en Barcelona`}
        description={therapist.bio ? therapist.bio.substring(0, 160) + '...' : `Conoce a ${therapist.full_name}, especialista en ${therapist.specializations?.join(', ')}.`}
        image={therapist.photo
          ? (therapist.photo.startsWith('http') ? therapist.photo : `/uploads/terapeutas/${therapist.photo}`)
          : undefined}
        type="profile"
        structuredData={structuredData}
      />
      <section className="detail-hero">
        <div className="container">
          <Link to="/terapeutas" className="back-link">← Volver a Terapeutas</Link>
          <div className="header">
            <div className="photo-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="photo-wrapper">
                {therapist.photo ? (
                  <img
                    src={
                      therapist.photo.startsWith('http')
                        ? therapist.photo
                        : therapist.photo.includes('/uploads')
                          ? `${API_ROOT}${therapist.photo}`
                          : `${API_ROOT}/uploads/terapeutas/${therapist.photo}`
                    }
                    alt={therapist.full_name}
                    className="photo"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img) return;
                      img.onerror = null;
                      img.src = '/icons/avatar-placeholder.png';
                    }}
                  />
                ) : (
                  <div className="placeholder-avatar">👤</div>
                )}
              </div>
            </div>
            <div className="title">
              <h1>{therapist.full_name}</h1>
              {therapist.label && (
                <div className="therapist-role-label">{therapist.label}</div>
              )}
              {therapist.license_number && (
                <div className="license-number" style={{
                  fontSize: '0.9rem',
                  color: '#666',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  Nº Col. {therapist.license_number}
                </div>
              )}
              {therapist.specializations && Array.isArray(therapist.specializations) && therapist.specializations.length > 0 && (
                <p className="specializations">{therapist.specializations.join(' • ')}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="detail-body">
        <div className="container">
          {therapist.bio && (
            <div className="block">
              <h2>Sobre mí</h2>
              <p className="bio">{therapist.bio}</p>
            </div>
          )}

          {therapist.methodology && (
            <div className="block">
              <h2>Metodología</h2>
              <p className="bio">{therapist.methodology}</p>
            </div>
          )}

          <div className="info-grid">



            {therapist.session_types && Array.isArray(therapist.session_types) && therapist.session_types.length > 0 && (
              <div className="info-card">
                <h3>Tipos de sesión</h3>
                <div className="chips">
                  {therapist.session_types.map((t, i) => (
                    <span key={i} className="chip">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {therapist.education?.length > 0 && (
            <div className="block">
              <h2>Formación</h2>
              <ul className="education-list">
                {therapist.education.map((edu, i) => (
                  <li key={i}>
                    {edu.degree} {edu.university ? `- ${edu.university}` : ''} {edu.year ? `(${edu.year})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {therapist.languages && Array.isArray(therapist.languages) && therapist.languages.length > 0 && (
            <div className="block">
              <h2>Idiomas</h2>
              <p className="languages-text">{therapist.languages.join(', ')}</p>
            </div>
          )}

          <div className="cta">
            <a href="/contacto" className="btn btn-primary">Solicitar cita</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TherapistDetail;
