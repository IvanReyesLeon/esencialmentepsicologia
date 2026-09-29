import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import Breadcrumbs, { buildBreadcrumbListSchema } from '../components/Breadcrumbs';
import SpecialtyNotFound from '../components/SpecialtyNotFound';
import SpecialtyWhatsAppCTA from '../components/SpecialtyWhatsAppCTA';
import SpecialtyPlaqueHero from '../components/SpecialtyPlaqueHero';
import specialtiesIndex from '../data/specialties.index.json';
import { specialtiesData } from '../data/specialtiesData';
import { pricingAPI } from '../services/api';
import './Specialties.css';
import './LocalPages.css';

const SITE_URL = 'https://www.esencialmentepsicologia.com';
const ORG_ID = `${SITE_URL}/#organization`;

const SpecialtyPage = () => {
  const { slug } = useParams();
  const [openFaq, setOpenFaq] = useState(null);
  const [pricing, setPricing] = useState(null); // null = loading/none, object = tarifa activa real

  const specialty = specialtiesIndex.find(s => s.slug === slug);
  const content = specialtiesData[slug];

  useEffect(() => {
    if (!specialty || !specialty.serviceKey) return;
    let cancelled = false;
    pricingAPI.getAll()
      .then(res => {
        if (cancelled) return;
        const active = (res.data || []).find(
          p => p.session_type_name === specialty.serviceKey && p.is_active === true
        );
        setPricing(active || false); // false = se comprobó y no hay tarifa activa
      })
      .catch(() => {
        if (!cancelled) setPricing(false);
      });
    return () => { cancelled = true; };
  }, [specialty]);

  // Slug totalmente inexistente en el SSOT -> contenido real de "no encontrado" + noindex
  if (!specialty || !content) {
    return <SpecialtyNotFound />;
  }

  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  const breadcrumbItems = [
    { name: 'Inicio', path: '/' },
    { name: 'Especialidades', path: '/especialidades' },
    { name: specialty.name }
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: content.heading,
        url: `${SITE_URL}/especialidades/${slug}`,
        provider: { '@id': ORG_ID },
        areaServed: [
          ...(specialty.onlineAvailable ? [{ '@type': 'Country', name: 'España' }] : []),
          ...(specialty.presentialAvailable ? [{ '@type': 'AdministrativeArea', name: 'Vallès Occidental' }] : [])
        ],
        // Offer solo si hay una tarifa activa real resuelta en runtime — nunca un precio estático.
        ...(pricing && {
          offers: {
            '@type': 'Offer',
            price: pricing.price,
            priceCurrency: 'EUR'
          }
        })
      },
      {
        '@type': 'FAQPage',
        mainEntity: content.faqs.map(f => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer }
        }))
      },
      buildBreadcrumbListSchema(breadcrumbItems, SITE_URL)
    ]
  };

  return (
    <div className="specialty-page">
      <SEOHead
        title={specialty.seoTitle}
        description={specialty.seoDescription}
        canonicalUrl={`${SITE_URL}/especialidades/${slug}`}
        structuredData={structuredData}
        robots={specialty.published ? 'index, follow' : 'noindex, follow'}
      />

      {/* Hero — misma familia visual que /especialidades: texto+CTA a la izquierda,
          selector de las 11 especialidades a la derecha, con la actual destacada. */}
      <section className="specialties-hero">
        <div className="container">
          <div className="specialties-hero-grid">
            <div className="specialties-hero-text">
              <Breadcrumbs items={breadcrumbItems} />
              <h1>{content.heading}</h1>
              <p className="hero-subtitle">{content.subtitle}</p>
              <div className="hero-cta-group">
                <SpecialtyWhatsAppCTA
                  message={specialty.whatsappIntent}
                  label={`Preguntar por ${specialty.name}`}
                  ctaPosition="hero"
                  variant="whatsapp"
                />
              </div>
            </div>
            <div className="specialties-hero-visual">
              <SpecialtyPlaqueHero mode="specialty" currentSlug={slug} />
            </div>
          </div>
        </div>
      </section>

      {/* Respuesta directa (AEO) */}
      <section className="section-padding">
        <div className="container">
          <p className="direct-answer">{content.directAnswer}</p>
        </div>
      </section>

      {/* Qué es — sección editorial, sin card */}
      <section className="section-padding bg-light">
        <div className="container">
          <div className="specialty-prose">
            <h2>{content.whatIsTitle}</h2>
            <p>{content.whatIsText}</p>
          </div>
        </div>
      </section>

      {/* Cuándo buscar apoyo */}
      <section className="section-padding">
        <div className="container">
          <div className="specialty-prose">
            <h2>{content.whenTitle}</h2>
            <p>{content.whenText}</p>
          </div>
        </div>
      </section>

      {/* Cómo se trabaja */}
      <section className="section-padding bg-light">
        <div className="container">
          <div className="specialty-prose">
            <h2>{content.howTitle}</h2>
            <p>{content.howText}</p>
          </div>
        </div>
      </section>

      {/* Online / Presencial — dos columnas editoriales, sin card */}
      <section className="section-padding">
        <div className="container">
          <div className="specialty-two-col">
            {specialty.onlineAvailable && (
              <div>
                <h2>Atención online</h2>
                <p>{content.onlineText}</p>
                <Link to="/terapia-online" className="link-editorial">Conoce cómo funciona la terapia online →</Link>
              </div>
            )}
            {specialty.presentialAvailable && (
              <div>
                <h2>Atención presencial</h2>
                <p>{content.presentialText}</p>
                <Link to="/donde-estamos" className="link-editorial">Ver ubicación y cómo llegar →</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tarifa dinámica — card justificada: dato realmente estructurado.
          Solo si esta especialidad tiene serviceKey y hay una tarifa activa real. */}
      {specialty.serviceKey && (
        <section className="section-padding bg-light">
          <div className="container">
            <div className="specialty-pricing-box">
              <h2>Tarifa</h2>
              {pricing === null && <p>Cargando tarifa…</p>}
              {pricing === false && (
                <>
                  <p>La tarifa actualizada no está disponible en este momento.</p>
                  <SpecialtyWhatsAppCTA
                    message={specialty.whatsappIntent}
                    label="Consultar tarifa por WhatsApp"
                    ctaPosition="pricing"
                    variant="whatsapp"
                  />
                </>
              )}
              {pricing && (
                <>
                  <div className="price">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(pricing.price)}</div>
                  <div className="duration">{pricing.duration} minutos</div>
                  {pricing.description && <p>{pricing.description}</p>}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FAQs — accordion: patrón interactivo, card justificada por elemento */}
      <section className="section-padding">
        <div className="container">
          <div className="section-header text-center">
            <h2>Preguntas frecuentes</h2>
            <div className="title-divider"></div>
          </div>
          <div className="faq-accordion">
            {content.faqs.map((faq, index) => (
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

      {/* CTA final — el selector del hero ya cubre la navegación a las otras
          especialidades, así que no repetimos ese bloque aquí. */}
      <section className="city-cta section-padding text-center">
        <div className="container">
          <div className="cta-box">
            <h2>¿Empezamos?</h2>
            <p>Escríbenos y te orientamos sobre la atención más adecuada para ti.</p>
            <div className="cta-actions">
              <SpecialtyWhatsAppCTA
                message={specialty.whatsappIntent}
                label={`Preguntar por ${specialty.name}`}
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

export default SpecialtyPage;
