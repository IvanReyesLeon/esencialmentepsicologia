import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Reviews from '../components/Reviews';
import SEOHead from '../components/SEOHead';
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
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Esencialmente Psicología</h1>
          <p className="hero-subtitle">Tu bienestar emocional es nuestra prioridad</p>
          <p className="hero-description">
            <strong>Esencialmente Psicología</strong> es un espacio donde encontrarás salud mental, divulgación sobre temas de psicología, gran variedad de talleres y conferencias, herramientas e información para la gestión mental-emocional y una comunidad de personas como tu.
            ¿Personas como tú? Sí, personas como tú y como yo. Personas que le damos importancia a lo que tenemos dentro: a nuestra <strong>esencia</strong>. Personas valientes que entendemos la necesidad de cuidar nuestro cuerpo y nuestra <strong>mente</strong>.
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
