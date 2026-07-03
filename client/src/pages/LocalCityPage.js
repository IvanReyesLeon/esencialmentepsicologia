import React, { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { citiesData } from '../data/localSeoData';
import { getWhatsAppUrl, getPhoneDisplay, getPhoneTelUrl } from '../config/contactConfig';
import './LocalPages.css';

const LocalCityPage = ({ citySlug: propCitySlug }) => {
  const params = useParams();
  const citySlug = propCitySlug || params.citySlug;
  const [openFaq, setOpenFaq] = useState(null);

  const city = citiesData[citySlug];

  if (!city) {
    return <Navigate to="/psicologo-valles-occidental" replace />;
  }

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const whatsappUrl = getWhatsAppUrl(`Hola 👋, soy o vivo en ${city.name} y me gustaría solicitar información sobre psicoterapia.`);
  const phoneDisplay = getPhoneDisplay(true);
  const phoneUrl = getPhoneTelUrl();

  const renderFormattedText = (text, pClassName = "") => {
    if (!text) return null;
    const blocks = text.split(/\r?\n\s*\r?\n/);
    return blocks.map((block, idx) => {
      const trimmed = block.trim();
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const lines = trimmed.split(/\r?\n/);
        return (
          <ul key={idx} className="connectivity-list" style={{ paddingLeft: '0', margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.8rem', listStyleType: 'none' }}>
            {lines.map((line, lIdx) => {
              const cleaned = line.trim().replace(/^[\*\-]\s*/, '');
              const html = cleaned.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: var(--text-primary);">$1</strong>');
              return (
                <li key={lIdx} style={{ lineHeight: '1.7', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>✓</span>
                  <span dangerouslySetInnerHTML={{ __html: html }} />
                </li>
              );
            })}
          </ul>
        );
      }
      const html = trimmed.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: var(--text-primary);">$1</strong>');
      return <p key={idx} className={pClassName} dangerouslySetInnerHTML={{ __html: html }} />;
    });
  };

  // Schema.org estructurado y seguro por municipio
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalClinic",
        "@id": `https://www.esencialmentepsicologia.com/psicologo-${citySlug}#organization`,
        "name": `Esencialmente Psicología - Atención para ${city.name}`,
        "url": `https://www.esencialmentepsicologia.com/psicologo-${citySlug}`,
        "logo": "https://www.esencialmentepsicologia.com/logo192.png",
        "description": city.metaDescription,
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
            "name": "Terapia psicológica online y presencial"
          }
        ],
        "areaServed": [
          { "@type": "City", "name": city.name },
          { "@type": "AdministrativeArea", "name": "Vallès Occidental" },
          { "@type": "City", "name": "Cerdanyola del Vallès" }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": city.faqs.map(faq => ({
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
            "name": "Vallès Occidental",
            "item": "https://www.esencialmentepsicologia.com/psicologo-valles-occidental"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": `Psicólogo en ${city.name}`,
            "item": `https://www.esencialmentepsicologia.com/psicologo-${citySlug}`
          }
        ]
      }
    ]
  };

  return (
    <div className="local-city-page">
      <SEOHead
        title={city.title}
        description={city.metaDescription}
        structuredData={structuredData}
      />

      {/* Hero de Ciudad */}
      <section className="city-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Inicio</Link> <span>/</span> <Link to="/psicologo-valles-occidental">Vallès Occidental</Link> <span>/</span> <span className="current">{city.name}</span>
          </nav>
          <h1>{city.heading}</h1>
          <p className="hero-subtitle">{city.subtitle}</p>
          <div className="hero-cta-group">
            <Link to="/contacto" className="btn btn-primary">Reservar Consulta</Link>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                Contactar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Texto Hero */}
      <section className="city-content-section section-padding">
        <div className="container">
          <div className="content-box">
            {renderFormattedText(city.heroText, "lead-paragraph")}
          </div>
        </div>
      </section>

      {/* Contexto Psicológico Local */}
      <section className="city-context-section section-padding bg-light">
        <div className="container">
          <div className="context-grid">
            <div className="context-text">
              <h2>{city.localContextTitle}</h2>
              <div className="title-divider-left"></div>
              {renderFormattedText(city.localContextText)}
            </div>
            <div className="context-card-highlight">
              <h3>Dirección Clínica</h3>
              <p className="highlight-director"><strong>Anna Becerra Fernández</strong></p>
              <p className="highlight-role">Fundadora y Psicóloga Clínica</p>
              <hr />
              <p className="highlight-desc">
                Especialista en terapia EMDR, trauma y trastornos de ansiedad. Un acompañamiento psicológico que cuida el vínculo humano y el rigor científico.
              </p>
              <Link to="/terapeutas" className="btn btn-sm btn-secondary mt-2">Conocer al equipo →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Conectividad y Transporte */}
      <section className="city-connectivity section-padding">
        <div className="container">
          <div className="connectivity-box">
            <h2>{city.connectivityTitle}</h2>
            <div className="title-divider"></div>
            <div className="connectivity-details">
              {renderFormattedText(city.connectivityText)}
            </div>
            <div className="connectivity-links mt-4">
              <Link to="/donde-estamos" className="btn btn-outline btn-sm">Ver mapa de ubicación completo →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Motivos para elegirnos */}
      <section className="city-reasons section-padding bg-light">
        <div className="container">
          <div className="section-header text-center">
            <h2>{city.reasonsTitle}</h2>
            <div className="title-divider"></div>
          </div>
          <div className="reasons-grid">
            {city.reasons.map((reason, idx) => (
              <div key={idx} className="reason-card">
                <div className="reason-icon">✓</div>
                <h3>{reason.title}</h3>
                <p>{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs del Municipio */}
      <section className="city-faqs section-padding">
        <div className="container">
          <div className="section-header text-center">
            <h2>Preguntas Frecuentes ({city.name})</h2>
            <div className="title-divider"></div>
          </div>
          <div className="faq-accordion">
            {city.faqs.map((faq, index) => (
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

      {/* Enlazado de Silo Territorial */}
      <section className="silo-navigation section-padding bg-light text-center">
        <div className="container">
          <h3>Atención Psicológica en Otras Poblaciones del Vallès Occidental</h3>
          <p className="silo-subtext">También ofrecemos consulta presencial y online para pacientes de todo el entorno comarcal:</p>
          <div className="silo-links">
            <Link to="/psicologo-valles-occidental" className="silo-tag hub-tag">← Hub Vallès Occidental</Link>
            {Object.keys(citiesData).map((key) => {
              if (key === citySlug) return null;
              return (
                <Link key={key} to={`/psicologo-${key}`} className="silo-tag">
                  {citiesData[key].name}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="city-cta section-padding text-center">
        <div className="container">
          <div className="cta-box">
            <h2>¿Empezamos tu proceso de psicoterapia?</h2>
            <p>Ponte en contacto con nuestro equipo para valorar tu caso y ofrecerte la atención clínica más adecuada.</p>
            <div className="cta-actions">
              <Link to="/contacto" className="btn btn-primary btn-lg">Solicitar Cita</Link>
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

export default LocalCityPage;
