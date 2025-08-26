import React, { useState } from 'react';
import { contactAPI } from '../services/api';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await contactAPI.sendMessage(formData);
      setSubmitMessage(response.data.message);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      setSubmitMessage(error.response?.data?.message || 'Error al enviar el mensaje. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact">
      <div className="contact-hero">
        <div className="container">
          <h1>Contacta con Nosotros</h1>
          <p>Estamos aquí para ayudarte. Ponte en contacto con nuestro equipo.</p>
        </div>
      </div>

      <div className="contact-content">
        <div className="container">
          {/* Quick Contact Cards */}
          <div className="quick-contact">
            <div className="quick-contact-card">
              <div className="quick-icon">📞</div>
              <h3>Llámanos</h3>
              <p>649 49 01 40</p>
              <a href="tel:+34649490140" className="quick-btn">Llamar Ahora</a>
            </div>
            <div className="quick-contact-card">
              <div className="quick-icon">✉️</div>
              <h3>Escríbenos</h3>
              <p>info@esencialmentepsicologia.com</p>
              <a href="mailto:info@esencialmentepsicologia.com" className="quick-btn">Enviar Email</a>
            </div>
            <div className="quick-contact-card">
              <div className="quick-icon">📍</div>
              <h3>Visítanos</h3>
              <p>Carrer del Pintor Togores, 1<br/>08290 Cerdanyola del Vallès, Barcelona</p>
              <a href="https://maps.google.com/?q=Carrer+del+Pintor+Togores,+1,+08290+Cerdanyola+del+Vallès,+Barcelona" target="_blank" rel="noopener noreferrer" className="quick-btn">Ver Ubicación</a>
            </div>
          </div>

          {/* Contact Form - Centered */}
          <div className="contact-form-centered">
            <h2>Envíanos un Mensaje</h2>
            <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">Nombre *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Teléfono</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Asunto</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Mensaje *</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                </button>

                {submitMessage && (
                  <div className={`submit-message ${submitMessage.includes('Error') ? 'error' : 'success'}`}>
                    {submitMessage}
                  </div>
                )}
              </form>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Contact;
