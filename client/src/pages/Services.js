import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { pricingAPI } from '../services/api';
import SEOHead from '../components/SEOHead';
import './Services.css';

const Services = () => {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchPricing();
  }, []);

  useEffect(() => {
    // Solo hacer scroll a pricing si viene con un tipo específico en la URL
    const tipo = searchParams.get('tipo');
    if (tipo) {
      const el = document.getElementById('pricing');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [searchParams]);

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

  const getServiceTitle = (sessionType) => {
    switch (sessionType) {
      case 'individual': return 'Terapia Individual';
      case 'couple': return 'Terapia de Pareja';
      case 'family': return 'Terapia Familiar';
      case 'group': return 'Terapia Grupal';
      default: return sessionType;
    }
  };

  const getServiceImage = (sessionType) => {
    switch (sessionType) {
      case 'individual': return '/assets/home_sup/t_individual_new.png';
      case 'couple': return '/assets/home_sup/t_pareja_new.png';
      case 'family': return '/assets/home_sup/t_familiar_new.png';
      case 'group': return '/assets/home_sup/t_grupo_new.png';
      default: return '/assets/home_sup/t_individual_new.png';
    }
  };

  const selectedType = searchParams.get('tipo');
  const activePricing = pricing.filter(p => p.is_active === true);
  const displayPricing = selectedType
    ? activePricing.filter(p => p.session_type_name === selectedType)
    : activePricing;

  const sectionTitle = selectedType
    ? `Tarifa: ${getServiceTitle(selectedType)}`
    : 'Nuestras Tarifas';

  return (
    <div className="services">
      <SEOHead
        title={`${sectionTitle} | Esencialmente Psicología`}
        description="Ofrecemos una amplia gama de servicios psicológicos adaptados a tus necesidades"
      />
      <div className="services-hero">
        <div className="container">
          <h1>Nuestros Servicios</h1>
          <p>Ofrecemos una amplia gama de servicios psicológicos adaptados a tus necesidades</p>
        </div>
      </div>

      <div className="services-content">
        <div className="container">
          <section className="pricing-section" id="pricing">
            <h2>{sectionTitle}</h2>

            {selectedType && (
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <Link to="/servicios" className="btn btn-secondary" style={{ width: 'auto' }}>
                  Ver todas las tarifas
                </Link>
              </div>
            )}

            {loading && <div className="loading">Cargando servicios...</div>}
            {error && <div className="error-message">{error}</div>}

            {displayPricing.length === 0 && !loading && !error ? (
              <div className="no-pricing">
                <p>No hay tarifas publicadas por el momento.</p>
              </div>
            ) : (
              <div className="pricing-grid">
                {displayPricing.map((service) => (
                  <div key={service.id} className="pricing-card">
                    <div className="service-header">
                      <div className="service-cover">
                        <img
                          src={getServiceImage(service.session_type_name)}
                          alt={getServiceTitle(service.session_type_name)}
                          loading="lazy"
                          onError={(e) => { e.currentTarget.src = '/assets/home_sup/t_individual_new.png'; }}
                        />
                      </div>
                      <h3>{service.session_type_display_name || getServiceTitle(service.session_type_name)}</h3>
                    </div>

                    <div className="service-details">
                      {service.description && (
                        <p className="service-description">{service.description}</p>
                      )}

                      <div className="service-info">
                        <div className="info-item">
                          <span className="label">Duración:</span>
                          <span className="value">{service.duration} minutos</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Precio:</span>
                          <span className="value price">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(service.price)}
                          </span>
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
        </div>
      </div>
    </div>
  );
};

export default Services;
