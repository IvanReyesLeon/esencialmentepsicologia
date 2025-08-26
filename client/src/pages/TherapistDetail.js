import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { therapistAPI } from '../services/api';
import './TherapistDetail.css';

const labelForSessionType = (type) => {
  switch (type) {
    case 'individual': return 'Individual';
    case 'couple': return 'Pareja';
    case 'family': return 'Familiar';
    case 'group': return 'Grupal';
    default: return type;
  }
};

const TherapistDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const initialTherapist = location.state?.therapist || null;
  const [therapist, setTherapist] = useState(initialTherapist);
  const [loading, setLoading] = useState(!initialTherapist);
  const [error, setError] = useState('');

  useEffect(() => {
    // Si ya viene en el state, no hace falta pedirlo. Si no, intentamos cargarlo.
    if (!therapist || (therapist && therapist._id !== id)) {
      const fetchData = async () => {
        try {
          const res = await therapistAPI.getById(id);
          setTherapist(res.data);
        } catch (e) {
          setError('No se pudo cargar la información del terapeuta.');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [id, therapist]);

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

  return (
    <div className="therapist-detail">
      <section className="detail-hero">
        <div className="container">
          <Link to="/terapeutas" className="back-link">← Volver a Terapeutas</Link>
          <div className="header">
            <div className="photo-wrapper">
              {therapist.photo ? (
                <img
                  src={`/assets/terapeutas/${therapist.photo}`}
                  alt={therapist.fullName}
                  className="photo"
                />
              ) : (
                <div className="placeholder-avatar">👤</div>
              )}
            </div>
            <div className="title">
              <h1>{therapist.fullName}</h1>
              {therapist.specialization?.length > 0 && (
                <p className="specializations">{therapist.specialization.join(' • ')}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="detail-body">
        <div className="container">
          {therapist.bio && (
            <div className="block">
              <h2>Sobre {therapist.fullName.split(' ')[0]}</h2>
              <p className="bio">{therapist.bio}</p>
            </div>
          )}

          <div className="info-grid">
            <div className="info-card">
              <h3>Experiencia</h3>
              <p>{therapist.experience} años</p>
            </div>

            {therapist.languages?.length > 0 && (
              <div className="info-card">
                <h3>Idiomas</h3>
                <p>{therapist.languages.join(', ')}</p>
              </div>
            )}

            {therapist.sessionTypes?.length > 0 && (
              <div className="info-card">
                <h3>Tipos de sesión</h3>
                <div className="chips">
                  {therapist.sessionTypes.map((t, i) => (
                    <span key={i} className="chip">{labelForSessionType(t)}</span>
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

          <div className="cta">
            <a href="/contacto" className="btn btn-primary">Solicitar cita</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TherapistDetail;
