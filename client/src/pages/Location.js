import React from 'react';
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
          <p>Visítanos en nuestro centro de psicología</p>
        </div>
      </section>

      {/* Location Info */}
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
                  <p>Teléfono: <a href={getPhoneTelUrl()} style={{ color: 'inherit', textDecoration: 'underline' }}>{getPhoneDisplay(true)}</a></p>
                  <p>Email: info@esencialmentepsicologia.com</p>
                </div>

                <div className="address-item">
                  <h3>🚗 Cómo llegar</h3>
                  <p>Transporte público: Metro, autobús</p>
                  <p>Parking disponible en la zona</p>
                  <p>Acceso para personas con movilidad reducida</p>
                </div>
              </div>
            </div>

            <div className="map-section">
              <div className="map-container">
                <ConsentGoogleMaps
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2985.123456789!2d2.1406!3d41.4912!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12a4968c5f5f5f5f%3A0x5f5f5f5f5f5f5f5f!2sCarrer%20del%20Pintor%20Togores%2C%201%2C%2008290%20Cerdanyola%20del%20Vall%C3%A8s%2C%20Barcelona!5e0!3m2!1ses!2ses!4v1234567890123!5m2!1ses!2ses"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  title="Esencialmente Psicología - Anna Becerra"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="location-cta">
        <div className="container">
          <h2>¿Necesitas una cita?</h2>
          <p>Contacta con nosotros para agendar tu consulta</p>
          <a href="/contacto" className="btn btn-primary">Solicitar Cita</a>
        </div>
      </section>
    </div>
  );
};

export default Location;
