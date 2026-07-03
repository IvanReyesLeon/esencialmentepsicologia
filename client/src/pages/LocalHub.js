import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { hubData } from '../data/localSeoData';
import { getWhatsAppUrl, getPhoneDisplay, getPhoneTelUrl } from '../config/contactConfig';
import './LocalPages.css';

const LocalHub = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const whatsappUrl = getWhatsAppUrl("Hola 👋, he visto vuestra página de atención en el Vallès Occidental y me gustaría solicitar información.");
  const phoneDisplay = getPhoneDisplay(true);
  const phoneUrl = getPhoneTelUrl();

  // Schema.org seguro (sin clinicalDirector ni MedicalSpecialty para evitar advertencias de estandarización)
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalClinic",
        "@id": "https://www.esencialmentepsicologia.com/#organization",
        "name": "Esencialmente Psicología",
        "url": "https://www.esencialmentepsicologia.com",
        "logo": "https://www.esencialmentepsicologia.com/logo192.png",
        "image": "https://www.esencialmentepsicologia.com/logo512.png",
        "description": hubData.metaDescription,
        "telephone": phoneUrl ? phoneUrl.replace('tel:', '') : undefined,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Carrer del Pintor Togores, 1",
          "addressLocality": "Cerdanyola del Vallès",
          "addressRegion": "Barcelona",
          "postalCode": "08290",
          "addressCountry": "ES"
        },
        "founder": {
          "@type": "Person",
          "name": "Anna Becerra Fernández",
          "jobTitle": "Directora Clínica y Fundadora",
          "knowsAbout": ["Psicoterapia", "EMDR", "Trauma", "Ansiedad"]
        },
        "employee": [
          {
            "@type": "Person",
            "name": "Anna Becerra Fernández",
            "jobTitle": "Psicóloga Clínica"
          }
        ],
        "knowsAbout": ["EMDR", "Trauma psicológico", "Trastornos de ansiedad", "Psicoterapia integradora", "Terapia online"],
        "availableService": [
          {
            "@type": "MedicalProcedure",
            "name": "Terapia EMDR para trauma y ansiedad"
          },
          {
            "@type": "MedicalProcedure",
            "name": "Psicoterapia individual para adultos y adolescentes"
          },
          {
            "@type": "MedicalProcedure",
            "name": "Terapia psicológica online"
          }
        ],
        "areaServed": [
          { "@type": "AdministrativeArea", "name": "Vallès Occidental" },
          { "@type": "City", "name": "Cerdanyola del Vallès" },
          { "@type": "City", "name": "Sabadell" },
          { "@type": "City", "name": "Sant Cugat del Vallès" },
          { "@type": "City", "name": "Rubí" },
          { "@type": "City", "name": "Terrassa" },
          { "@type": "City", "name": "Barberà del Vallès" },
          { "@type": "City", "name": "Barcelona" }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": hubData.faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Inicio",
            "item": "https://www.esencialmentepsicologia.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Psicólogo Vallès Occidental",
            "item": "https://www.esencialmentepsicologia.com/psicologo-valles-occidental"
          }
        ]
      }
    ]
  };

  return (
    <div className="local-hub-page">
      <SEOHead
        title={hubData.title}
        description={hubData.metaDescription}
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section className="local-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Inicio</Link> <span>/</span> <span className="current">Vallès Occidental</span>
          </nav>
          <h1>{hubData.heading}</h1>
          <p className="hero-subtitle">{hubData.subtitle}</p>
          <div className="hero-cta-group">
            <Link to="/contacto" className="btn btn-primary">Pedir Cita</Link>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                Consultar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Introducción y Filosofía */}
      <section className="local-intro section-padding">
        <div className="container">
          <div className="intro-card">
            <div className="intro-text">
              <h2>Acompañamiento Psicológico Cercano y Riguroso</h2>
              {hubData.introduction.split('\n\n').map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Metodología y E-E-A-T */}
      <section className="local-methodology section-padding bg-light">
        <div className="container">
          <div className="section-header text-center">
            <h2>{hubData.methodologyTitle}</h2>
            <div className="title-divider"></div>
          </div>
          <div className="methodology-content">
            {hubData.methodologyText.split('\n\n').map((para, idx) => (
              <p key={idx} className="lead-text">{para}</p>
            ))}
          </div>
          <div className="why-us-grid mt-4">
            {hubData.whyUs.map((item, idx) => (
              <div key={idx} className="why-card">
                <div className="why-number">0{idx + 1}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grid de Municipios (Silo Interno) */}
      <section className="local-cities section-padding">
        <div className="container">
          <div className="section-header text-center">
            <h2>{hubData.citiesHeading}</h2>
            <p className="subtitle">{hubData.citiesSubtitle}</p>
            <div className="title-divider"></div>
          </div>
          <div className="cities-grid">
            {hubData.cities.map((city) => (
              <div key={city.slug} className="city-card">
                <div className="city-card-header">
                  <h3>{city.name}</h3>
                </div>
                <div className="city-card-body">
                  <p>{city.shortDesc}</p>
                </div>
                <div className="city-card-footer">
                  <Link to={`/psicologo-${city.slug}`} className="city-link">
                    Ver atención en {city.name} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Sección */}
      <section className="local-faqs section-padding bg-light">
        <div className="container">
          <div className="section-header text-center">
            <h2>Preguntas Frecuentes sobre Terapia en el Vallès Occidental</h2>
            <div className="title-divider"></div>
          </div>
          <div className="faq-accordion">
            {hubData.faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item ${openFaq === index ? 'open' : ''}`}
                onClick={() => toggleFaq(index)}
              >
                <div className="faq-question">
                  <h3>{faq.question}</h3>
                  <span className="faq-icon">{openFaq === index ? '−' : '+'}</span>
                </div>
                {openFaq === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="local-cta section-padding text-center">
        <div className="container">
          <div className="cta-box">
            <h2>¿Deseas iniciar tu proceso de psicoterapia?</h2>
            <p>Estamos a tu disposición en nuestra consulta en Cerdanyola del Vallès o a través de nuestra plataforma online.</p>
            <div className="cta-actions">
              <Link to="/contacto" className="btn btn-primary btn-lg">Solicitar Cita Ahora</Link>
              {phoneUrl && (
                <a href={phoneUrl} className="btn btn-secondary btn-lg">
                  Llamar: {phoneDisplay}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LocalHub;
