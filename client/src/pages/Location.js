import React from 'react';
import { Link } from 'react-router-dom';
import ConsentGoogleMaps from '../components/ConsentGoogleMaps';
import { getPhoneDisplay, getPhoneTelUrl } from '../config/contactConfig';
import './Location.css';

const Location = () => {
  return (
    <div className="location">
      {/* Hero Section */}
      <section className="location-hero">
        <div className="container">
          <h1>Dónde Estamos</h1>
          <p>Visítanos en nuestro centro de psicología clínica en Cerdanyola del Vallès</p>
        </div>
      </section>

      {/* Info and Map Section */}
      <section className="location-info">
        <div className="container">
          <h2>Esencialmente Psicología - Anna Becerra</h2>
          <div className="location-content">
            <div className="location-details">
              <div className="address-info">
                <div className="address-item">
                  <h3>📍 Dirección</h3>
                  <p>Carrer del Pintor Togores, 1</p>
                  <p>08290 Cerdanyola del Vallès, Barcelona</p>
                </div>

                <div className="address-item">
                  <h3>🕒 Horarios</h3>
                  <p>Lunes a Viernes: 9:00h - 20:00h</p>
                  <p>Sábados: Consultar disponibilidad</p>
                  <p>Domingos: Cerrado</p>
                </div>

                <div className="address-item">
                  <h3>📞 Contacto</h3>
                  <p>Teléfono: {getPhoneTelUrl() ? (
                    <a href={getPhoneTelUrl()} style={{ color: 'inherit', textDecoration: 'underline' }}>{getPhoneDisplay(true)}</a>
                  ) : (
                    <span>{getPhoneDisplay(true)}</span>
                  )}</p>
                  <p>Email: info@esencialmentepsicologia.com</p>
                </div>

                <div className="address-item">
                  <h3>🚗 Cómo llegar</h3>
                  <p>Transporte público: Tren cercanías RENFE (R4/R7) y autobuses interurbanos</p>
                  <p>Parking disponible y zonas de estacionamiento en las inmediaciones</p>
                  <p>Acceso adaptado y cómodo</p>
                </div>
              </div>
            </div>

            <div className="map-section">
              <div className="map-container">
                <ConsentGoogleMaps
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2985.123456789!2d2.1406!3d41.4912!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12a4968c5f5f5f5f%3A0x5f5f5f5f5f5f5f5f!2sCarrer%20del%20Pintor%20Togores%2C%201%2C%2008290%20Cerdanyola%20del%20Vall%C3%A8s%2C%20Barcelona!5e0!3m2!1ses!2ses!4v1234567890123!5m2!1ses!2ses"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  title="Esencialmente Psicología - Anna Becerra"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cobertura Territorial y Modalidad Híbrida */}
      <section className="regional-coverage section-padding" style={{ backgroundColor: '#fbf8f5', padding: '3.5rem 0', textAlign: 'center', borderTop: '1px solid #e8e1da' }}>
        <div className="container">
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#2c2523' }}>Atención en el Vallès Occidental y Barcelona</h2>
          <p style={{ maxWidth: '750px', margin: '0 auto 1.75rem', color: '#5c524b', lineHeight: '1.6', fontSize: '1.05rem' }}>
            Aunque nuestra sede física se encuentra en Cerdanyola del Vallès, ofrecemos una cobertura clínica integral tanto de forma presencial como por videoconsulta online para pacientes de todas las localidades del entorno.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '850px', margin: '0 auto' }}>
            <Link to="/psicologo-valles-occidental" className="btn btn-sm btn-secondary" style={{ backgroundColor: '#2c2523', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '50px', textDecoration: 'none', fontWeight: '500' }}>
              ← Hub Vallès Occidental
            </Link>
            <Link to="/psicologo-sabadell" className="btn btn-sm btn-outline" style={{ border: '1px solid #8c7a6b', color: '#5c524b', padding: '0.5rem 1rem', borderRadius: '50px', textDecoration: 'none' }}>Sabadell</Link>
            <Link to="/psicologo-sant-cugat" className="btn btn-sm btn-outline" style={{ border: '1px solid #8c7a6b', color: '#5c524b', padding: '0.5rem 1rem', borderRadius: '50px', textDecoration: 'none' }}>Sant Cugat</Link>
            <Link to="/psicologo-rubi" className="btn btn-sm btn-outline" style={{ border: '1px solid #8c7a6b', color: '#5c524b', padding: '0.5rem 1rem', borderRadius: '50px', textDecoration: 'none' }}>Rubí</Link>
            <Link to="/psicologo-terrassa" className="btn btn-sm btn-outline" style={{ border: '1px solid #8c7a6b', color: '#5c524b', padding: '0.5rem 1rem', borderRadius: '50px', textDecoration: 'none' }}>Terrassa</Link>
            <Link to="/psicologo-barbera-del-valles" className="btn btn-sm btn-outline" style={{ border: '1px solid #8c7a6b', color: '#5c524b', padding: '0.5rem 1rem', borderRadius: '50px', textDecoration: 'none' }}>Barberà del Vallès</Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="location-cta">
        <div className="container">
          <h2>¿Necesitas una cita?</h2>
          <p>Contacta con nuestro equipo para agendar tu consulta presencial u online</p>
          <Link to="/contacto" className="btn btn-primary">Solicitar Cita</Link>
        </div>
      </section>
    </div>
  );
};

export default Location;
