import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Reviews from '../components/Reviews';
import SEOHead from '../components/SEOHead';
import ServiceNoticeModal from '../components/ServiceNoticeModal';
import './Home.css';

const Home = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const centerImages = [
    '/assets/centro/centro1.webp',
    '/assets/centro/centro2.webp',
    '/assets/centro/centro3.webp',
    '/assets/centro/centro4.webp',
    '/assets/centro/centro5.webp'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        (prevIndex + 1) % centerImages.length
      );
    }, 4000); // Cambiar imagen cada 4 segundos

    return () => clearInterval(interval);
  }, [centerImages.length]);

  return (
    <div className="home">
      <SEOHead />
      <ServiceNoticeModal />
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Esencialmente Psicología</h1>
          <p className="hero-subtitle">Tu bienestar emocional es nuestra prioridad</p>
          <p className="hero-description">
            <strong>Esencialmente Psicología</strong> es un espacio donde encontrarás salud mental, divulgación sobre temas de psicología, una gran variedad de talleres y conferencias, herramientas e información para la gestión mental-emocional y una comunidad de personas como tú.
          </p>
          <p className="hero-description">
            ¿Personas como tú? Sí, personas como tú y como yo. Personas que le damos importancia a lo que tenemos dentro: a nuestra <strong>esencia</strong>. Personas valientes que entendemos la necesidad de cuidar nuestro cuerpo y nuestra <strong>mente</strong>.
          </p>
          <p className="hero-description">
            Somos psicólogas con formación avanzada en enfoques informados en trauma y especialistas en <strong>EMDR</strong> (Eye Movement Desensitization and Reprocessing), una de las terapias más eficaces para sanar experiencias traumáticas y heridas emocionales profundas. Nuestro objetivo es acompañarte en un espacio cercano, seguro y profesional, donde puedas comprender lo que te ha ocurrido, procesarlo a tu ritmo y empezar a vivir con mayor calma, equilibrio y bienestar.
          </p>
          <div className="hero-buttons">
            <Link to="/contacto" className="btn btn-primary">Solicitar Cita</Link>
            <Link to="/terapeutas" className="btn btn-secondary">Conoce a Nuestros Terapeutas</Link>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="services-overview">
        <div className="container">
          <h2>Nuestros Servicios</h2>
          <div className="services-grid">
            <Link to="/servicios?tipo=individual" className="service-card-link">
              <div className="service-card">
                <div className="service-image">
                  <img src="/assets/home_sup/t_individual_new.png" alt="Terapia Individual" />
                </div>
                <h3>Terapia Individual</h3>
                <p>Sesiones personalizadas para abordar tus necesidades específicas y promover tu bienestar emocional.</p>
              </div>
            </Link>

            <Link to="/servicios?tipo=couple" className="service-card-link">
              <div className="service-card">
                <div className="service-image">
                  <img src="/assets/home_sup/t_pareja_new.png" alt="Terapia de Pareja" />
                </div>
                <h3>Terapia de Pareja</h3>
                <p>Fortalece tu relación y mejora la comunicación con tu pareja en un ambiente profesional.</p>
              </div>
            </Link>

            <Link to="/servicios?tipo=family" className="service-card-link">
              <div className="service-card">
                <div className="service-image">
                  <img src="/assets/home_sup/t_familiar_new.png" alt="Terapia Familiar" />
                </div>
                <h3>Terapia Familiar</h3>
                <p>Resuelve conflictos familiares y mejora la dinámica familiar con nuestro apoyo especializado.</p>
              </div>
            </Link>

            <Link to="/servicios?tipo=group" className="service-card-link">
              <div className="service-card">
                <div className="service-image">
                  <img src="/assets/home_sup/t_grupo_new.png" alt="Terapia Grupal" />
                </div>
                <h3>Terapia Grupal</h3>
                <p>Comparte experiencias y aprende de otros en un entorno grupal seguro y terapéutico.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-preview">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>¿Por qué elegir Esencialmente Psicología?</h2>
              <p>
                En nuestro centro, creemos que cada persona es única y merece un enfoque
                personalizado para su bienestar mental. Nuestro equipo de profesionales
                altamente cualificados está comprometido con tu crecimiento personal y
                emocional.
              </p>
              <ul>
                <li> Profesionales colegiados y especializados</li>
                <li> Enfoque personalizado y humanizado</li>
                <li> Ambiente cálido y confidencial</li>
                <li> Técnicas terapéuticas actualizadas</li>
              </ul>
            </div>
            <div className="about-image">
              <div className="image-carousel">
                <img
                  src={centerImages[currentImageIndex]}
                  alt={`Centro de psicología - imagen ${currentImageIndex + 1}`}
                  className="carousel-image"
                />
                <div className="carousel-indicators">
                  {centerImages.map((_, index) => (
                    <button
                      key={index}
                      className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                      aria-label={`Ver imagen ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cobertura Territorial y Hub Comarcal */}
      <section className="home-territorial" style={{ backgroundColor: '#fbf8f5', padding: '4rem 0', textAlign: 'center', borderTop: '1px solid #e8e1da', borderBottom: '1px solid #e8e1da' }}>
        <div className="container">
          <span style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1.5px', color: '#8c7a6b', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
            Atención Presencial y Online
          </span>
          <h2 style={{ fontSize: '2rem', color: '#2c2523', marginBottom: '1rem' }}>Tu Psicólogo en el Vallès Occidental</h2>
          <p style={{ maxWidth: '750px', margin: '0 auto 2rem', color: '#5c524b', fontSize: '1.08rem', lineHeight: '1.7' }}>
            Desde nuestra consulta física en Cerdanyola del Vallès y a través de nuestra plataforma online, acompañamos a pacientes de toda la comarca y la provincia de Barcelona con terapia EMDR y psicoterapia especializada.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '850px', margin: '0 auto' }}>
            <Link to="/psicologo-valles-occidental" style={{ backgroundColor: '#2c2523', color: '#fff', padding: '0.6rem 1.5rem', borderRadius: '50px', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' }}>
              Descubrir cobertura en el Vallès Occidental →
            </Link>
            <Link to="/psicologo-cerdanyola-del-valles" style={{ border: '1px solid #8c7a6b', color: '#5c524b', padding: '0.6rem 1.25rem', borderRadius: '50px', textDecoration: 'none', fontSize: '0.95rem', background: '#fff' }}>Cerdanyola</Link>
            <Link to="/psicologo-sabadell" style={{ border: '1px solid #8c7a6b', color: '#5c524b', padding: '0.6rem 1.25rem', borderRadius: '50px', textDecoration: 'none', fontSize: '0.95rem', background: '#fff' }}>Sabadell</Link>
            <Link to="/psicologo-sant-cugat" style={{ border: '1px solid #8c7a6b', color: '#5c524b', padding: '0.6rem 1.25rem', borderRadius: '50px', textDecoration: 'none', fontSize: '0.95rem', background: '#fff' }}>Sant Cugat</Link>
            <Link to="/psicologo-rubi" style={{ border: '1px solid #8c7a6b', color: '#5c524b', padding: '0.6rem 1.25rem', borderRadius: '50px', textDecoration: 'none', fontSize: '0.95rem', background: '#fff' }}>Rubí</Link>
            <Link to="/psicologo-terrassa" style={{ border: '1px solid #8c7a6b', color: '#5c524b', padding: '0.6rem 1.25rem', borderRadius: '50px', textDecoration: 'none', fontSize: '0.95rem', background: '#fff' }}>Terrassa</Link>
            <Link to="/psicologo-barbera-del-valles" style={{ border: '1px solid #8c7a6b', color: '#5c524b', padding: '0.6rem 1.25rem', borderRadius: '50px', textDecoration: 'none', fontSize: '0.95rem', background: '#fff' }}>Barberà</Link>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <Reviews />

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>¿Listo para comenzar tu proceso de bienestar?</h2>
          <p>Contacta con nosotros y da el primer paso hacia una vida más plena</p>
          <Link to="/contacto" className="btn btn-primary">Contactar Ahora</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
