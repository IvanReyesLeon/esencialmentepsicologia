import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Esencialmente Psicología</h3>
          <p>Centro de psicología especializado en bienestar emocional y desarrollo personal.</p>
          <div>
            <h4>Contacto</h4>
            <p>📞 Teléfono: 649 49 01 40</p>
            <p>✉️ Email: info@esencialmentepsicologia.com</p>
            <p>📍 Dirección: Carrer del Pintor Togores, 1, Cerdanyola del Vallès, Barcelona</p>
          </div>
        </div>
        
        <div className="footer-section">
          <h4>Horarios</h4>
          <p>Lunes - Viernes: 9:00 - 20:00</p>
          <p>Sábados: 9:00 - 14:00</p>
          <p>Domingos: Cerrado</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2025 Esencialmente Psicología. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
