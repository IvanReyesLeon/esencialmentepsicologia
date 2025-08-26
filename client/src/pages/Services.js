import React, { useState, useEffect } from 'react';
import { pricingAPI } from '../services/api';
import './Services.css';

const Services = () => {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await pricingAPI.getAll();
      setPricing(response.data);
    } catch (err) {
      setError('Error al cargar los precios');
      console.error('Error fetching pricing:', err);
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (sessionType) => {
    switch (sessionType) {
      case 'individual': return '👤';
      case 'couple': return '💑';
      case 'family': return '👨‍👩‍👧‍👦';
      case 'group': return '👥';
      default: return '🧠';
    }
  };

  const getServiceTitle = (sessionType) => {
    switch (sessionType) {
      case 'individual': return 'Terapia Individual';
      case 'couple': return 'Terapia de Pareja';
      case 'family': return 'Terapia Familiar';
      case 'group': return 'Terapia Grupal';
      default: return sessionType;
    }
  };

  return (
    <div className="services">
      <div className="services-hero">
        <div className="container">
          <h1>Nuestros Servicios</h1>
          <p>Ofrecemos una amplia gama de servicios psicológicos adaptados a tus necesidades</p>
        </div>
      </div>

      <div className="services-content">
        <div className="container">
          {/* Services Overview */}
          <section className="services-overview">
            <h2>¿Qué ofrecemos?</h2>
            <div className="overview-grid">
              <div className="overview-item">
                <div className="overview-icon">🎯</div>
                <h3>Enfoque Personalizado</h3>
                <p>Cada persona es única. Adaptamos nuestro enfoque terapéutico a tus necesidades específicas.</p>
              </div>
              <div className="overview-item">
                <div className="overview-icon">🤝</div>
                <h3>Ambiente Seguro</h3>
                <p>Creamos un espacio de confianza donde puedes expresarte libremente sin juicios.</p>
              </div>
              <div className="overview-item">
                <div className="overview-icon">📈</div>
                <h3>Resultados Efectivos</h3>
                <p>Utilizamos técnicas basadas en evidencia científica para lograr cambios duraderos.</p>
              </div>
              <div className="overview-item">
                <div className="overview-icon">⏰</div>
                <h3>Flexibilidad Horaria</h3>
                <p>Horarios adaptados a tu disponibilidad, incluyendo fines de semana.</p>
              </div>
            </div>
            <div className="scroll-indicator">
              <p>👇 Consulta nuestras tarifas más abajo</p>
            </div>
          </section>

          {/* Pricing Section */}
          <section className="pricing-section">
            <h2>Servicios y Tarifas</h2>
            
            {loading && (
              <div className="loading">Cargando servicios...</div>
            )}

            {error && (
              <div className="error-message">{error}</div>
            )}

            {pricing.length === 0 && !loading && !error ? (
              <div className="no-pricing">
                <p>Próximamente publicaremos nuestras tarifas. Contacta con nosotros para más información.</p>
              </div>
            ) : (
              <div className="pricing-grid">
                {pricing.map((service) => (
                  <div key={service._id} className="pricing-card">
                    <div className="service-header">
                      <div className="service-icon">{getServiceIcon(service.sessionType)}</div>
                      <h3>{getServiceTitle(service.sessionType)}</h3>
                    </div>
                    
                    <div className="service-details">
                      <p className="service-description">{service.description}</p>
                      
                      <div className="service-info">
                        <div className="info-item">
                          <span className="label">Duración:</span>
                          <span className="value">{service.duration} minutos</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Precio:</span>
                          <span className="value price">{service.price}€</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="service-footer">
                      <a href="/contacto" className="btn btn-primary">Solicitar Cita</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Additional Services */}
          <section className="additional-services">
            <h2>Servicios Adicionales</h2>
            <div className="additional-grid">
              <div className="additional-item">
                <h4>Evaluaciones Psicológicas</h4>
                <p>Realizamos evaluaciones completas para diagnóstico y orientación terapéutica.</p>
              </div>
              <div className="additional-item">
                <h4>Talleres y Grupos</h4>
                <p>Organizamos talleres temáticos y grupos de apoyo para diferentes problemáticas.</p>
              </div>
              <div className="additional-item">
                <h4>Orientación Familiar</h4>
                <p>Asesoramiento y apoyo para mejorar la dinámica familiar y la comunicación.</p>
              </div>
              <div className="additional-item">
                <h4>Terapia Online</h4>
                <p>Sesiones virtuales para mayor comodidad y accesibilidad.</p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="cta-section">
            <h2>¿Listo para comenzar?</h2>
            <p>Da el primer paso hacia tu bienestar emocional. Estamos aquí para acompañarte.</p>
            <div className="cta-buttons">
              <a href="/contacto" className="btn btn-primary">Contactar Ahora</a>
              <a href="/terapeutas" className="btn btn-secondary">Conocer al Equipo</a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Services;
