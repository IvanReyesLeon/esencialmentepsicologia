import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import Breadcrumbs, { buildBreadcrumbListSchema } from '../components/Breadcrumbs';
import SpecialtyPlaqueHero from '../components/SpecialtyPlaqueHero';
import SpecialtyWhatsAppCTA from '../components/SpecialtyWhatsAppCTA';
import specialtiesIndex from '../data/specialties.index.json';
import './Specialties.css';
import '../pages/LocalPages.css';

const SITE_URL = 'https://www.esencialmentepsicologia.com';
const ORG_ID = `${SITE_URL}/#organization`;

const HUB_FAQS = [
  {
    question: '¿Cómo sé qué especialidad necesito?',
    answer: 'No hace falta que lo sepas antes de contactar. Puedes escribirnos contándonos tu situación y te orientaremos sobre la atención más adecuada.'
  },
  {
    question: '¿Puedo hacer terapia online desde cualquier punto de España?',
    answer: 'Sí, ofrecemos atención online por videollamada para personas de toda España. La idoneidad de esta modalidad para tu caso concreto se valora en la primera consulta.'
  },
  {
    question: '¿Dónde está el centro físico?',
    answer: 'Nuestra consulta presencial está en Cerdanyola del Vallès (Barcelona), con buena conexión para Barcelona y el resto del Vallès Occidental.'
  }
];

const SpecialtiesHub = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  // Catálogo real del centro: las 11 especialidades existen independientemente
  // de si su página individual ya está lista para indexación (published).
  const catalog = specialtiesIndex
    .filter(s => s.catalogVisible)
    .sort((a, b) => a.order - b.order);

  const breadcrumbItems = [
    { name: 'Inicio', path: '/' },
    { name: 'Especialidades' }
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalClinic',
        '@id': ORG_ID,
        name: 'Esencialmente Psicología',
        url: SITE_URL,
        logo: `${SITE_URL}/logo192.png`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Carrer del Pintor Togores, 1',
          addressLocality: 'Cerdanyola del Vallès',
          addressRegion: 'Barcelona',
          postalCode: '08290',
          addressCountry: 'ES'
        },
        areaServed: [
          { '@type': 'Country', name: 'España' },
          { '@type': 'AdministrativeArea', name: 'Vallès Occidental' }
        ]
      },
      ...catalog.map(s => ({
        '@type': 'Service',
        name: s.name,
        url: `${SITE_URL}/especialidades/${s.slug}`,
        provider: { '@id': ORG_ID },
        areaServed: [
          { '@type': 'Country', name: 'España' },
          { '@type': 'AdministrativeArea', name: 'Vallès Occidental' }
        ]
      })),
      {
        '@type': 'FAQPage',
        mainEntity: HUB_FAQS.map(f => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer }
        }))
      },
      buildBreadcrumbListSchema(breadcrumbItems, SITE_URL)
    ]
  };

  return (
    <div className="specialties-hub-page">
      <SEOHead
        title="Especialidades psicológicas | Esencialmente Psicología"
        description="Especialidades psicológicas con atención online para toda España y presencial en Cerdanyola del Vallès. Conoce cada área y contacta por WhatsApp."
        canonicalUrl={`${SITE_URL}/especialidades`}
        structuredData={structuredData}
      />

      {/* Hero — orientado a online/España, sin ciudades. Dos columnas: texto+CTA / cartel */}
      <section className="specialties-hero">
        <div className="container">
          <div className="specialties-hero-grid">
            <div className="specialties-hero-text">
              <Breadcrumbs items={breadcrumbItems} />
              <span className="specialties-eyebrow">Especialidades psicológicas</span>
              <h1>Atención especializada, estés donde estés</h1>
              <p className="hero-subtitle">
                Atención psicológica online para personas de toda España, en distintas áreas y necesidades emocionales.
              </p>

              <div className="hero-cta-group">
                <SpecialtyWhatsAppCTA
                  message="Hola, me gustaría recibir información sobre atención psicológica."
                  label="Hablar por WhatsApp"
                  ctaPosition="hero"
                  variant="whatsapp"
                />
                <a href="#especialidades-listado" className="btn btn-outline">Ver especialidades</a>
              </div>
            </div>

            <div className="specialties-hero-visual">
              <SpecialtyPlaqueHero />
            </div>
          </div>
        </div>
      </section>

      {/* Introducción */}
      <section className="local-intro section-padding">
        <div className="container">
          <div className="intro-card">
            <div className="intro-text">
              <h2>Especialidades reales, atención cercana</h2>
              <p>
                En Esencialmente Psicología trabajamos distintas áreas de la psicología clínica,
                cada una con su propia intención y necesidades. Puedes explorar cada especialidad
                para entender mejor qué aborda y cómo se trabaja, o escribirnos directamente si
                todavía no sabes cómo definir tu situación.
              </p>
              <p>
                Todas las especialidades que ofrecemos pueden atenderse en modalidad online para
                personas de toda España, y también de forma presencial en nuestro centro físico
                (más información más abajo en esta página).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Listado */}
      <section className="section-padding" id="especialidades-listado">
        <div className="container">
          <div className="section-header text-center">
            <h2>¿Qué te gustaría trabajar?</h2>
            <p className="subtitle">
              No tienes que saber de antemano qué tipo de acompañamiento necesitas: explora nuestras
              especialidades o escríbenos directamente y te orientamos.
            </p>
            <div className="title-divider"></div>
          </div>
          <div className="specialties-grid">
            {catalog.map(s => (
              <div key={s.slug} className="specialty-card">
                <h3>{s.name}</h3>
                <p>{s.shortDescription}</p>
                <Link to={`/especialidades/${s.slug}`} className="specialty-card-link">
                  Conocer esta especialidad →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Online España */}
      <section className="section-padding bg-light">
        <div className="container specialties-modality-block">
          <h2>Atención online para toda España</h2>
          <p>
            Todas nuestras especialidades pueden atenderse por videollamada, manteniendo la misma
            confidencialidad y cuidado profesional que en consulta presencial. La idoneidad de la
            modalidad online para tu situación concreta se valora siempre en la primera consulta.
          </p>
          <p>
            <Link to="/terapia-online" className="link-editorial">Conoce cómo funciona la terapia online →</Link>
          </p>
        </div>
      </section>

      {/* CTA intermedio */}
      <section className="section-padding text-center">
        <div className="container">
          <SpecialtyWhatsAppCTA
            message="Hola, me gustaría recibir información sobre atención psicológica."
            label="Hablar por WhatsApp"
            ctaPosition="mid"
            variant="whatsapp"
          />
        </div>
      </section>

      {/* Presencial Barcelona/Vallès */}
      <section className="section-padding bg-light">
        <div className="container specialties-modality-block">
          <h2>Atención presencial en Barcelona y el Vallès</h2>
          <p>
            Nuestro centro físico está en Cerdanyola del Vallès, con buen acceso para pacientes
            de Barcelona y de todo el Vallès Occidental.
          </p>
          <p>
            <Link to="/donde-estamos" className="link-editorial">Ver ubicación y cómo llegar</Link>
            {' · '}
            <Link to="/psicologo-valles-occidental" className="link-editorial">Atención en el Vallès Occidental</Link>
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="section-padding">
        <div className="container">
          <div className="section-header text-center">
            <h2>Preguntas frecuentes</h2>
            <div className="title-divider"></div>
          </div>
          <div className="faq-accordion">
            {HUB_FAQS.map((faq, index) => (
              <div key={index} className={`faq-item ${openFaq === index ? 'open' : ''}`} onClick={() => toggleFaq(index)}>
                <div className="faq-question">
                  <h3>{faq.question}</h3>
                  <span className="faq-icon">{openFaq === index ? '−' : '+'}</span>
                </div>
                {openFaq === index && (
                  <div className="faq-answer"><p>{faq.answer}</p></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="local-cta section-padding text-center">
        <div className="container">
          <div className="cta-box">
            <h2>¿Empezamos?</h2>
            <p>Escríbenos y te orientamos sobre la atención más adecuada para ti.</p>
            <div className="cta-actions">
              <SpecialtyWhatsAppCTA
                message="Hola, me gustaría recibir información sobre atención psicológica."
                label="Hablar por WhatsApp"
                ctaPosition="footer"
                variant="whatsapp"
              />
              <Link to="/servicios" className="btn btn-secondary btn-lg">Ver Servicios y Tarifas</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SpecialtiesHub;
