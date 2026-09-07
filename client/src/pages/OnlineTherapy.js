import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { pricingAPI } from '../services/api';
import { getWhatsAppUrl, getPhoneDisplay, getPhoneTelUrl } from '../config/contactConfig';
import './OnlineTherapy.css';

const DEFAULT_PRICING = [
  {
    session_type_name: 'individual',
    session_type_display_name: 'Individual',
    price: '55.00',
    duration: 60,
    description: 'Sesión individual de psicoterapia personalizada para adultos y adolescentes.'
  },
  {
    session_type_name: 'couple',
    session_type_display_name: 'Pareja (60 min)',
    price: '65.00',
    duration: 60,
    description: 'Sesión de terapia de pareja.'
  },
  {
    session_type_name: 'family',
    session_type_display_name: 'Pareja (90 min)',
    price: '90.00',
    duration: 90,
    description: 'Sesión de terapia de pareja de hora y media.'
  }
];

const getCardTitle = (item) => {
  const duration = parseInt(item.duration, 10);
  const price = parseFloat(item.price);

  if (duration === 90 || price === 90) {
    return 'Pareja (90 min)';
  }
  if (duration === 60 && (price === 65 || item.session_type_name === 'couple')) {
    return 'Pareja (60 min)';
  }
  if (price === 55 || item.session_type_name === 'individual') {
    return 'Individual';
  }
  return item.session_type_display_name || 'Individual';
};

const getCardDescription = (item) => {
  const duration = parseInt(item.duration, 10);
  const price = parseFloat(item.price);

  if (duration === 90 || price === 90) {
    return 'Sesión de terapia de pareja de hora y media.';
  }
  if (duration === 60 && (price === 65 || item.session_type_name === 'couple')) {
    return 'Sesión de terapia de pareja.';
  }
  return item.description || 'Sesión individual de psicoterapia personalizada para adultos y adolescentes.';
};

const FAQS = [
  {
    question: "¿Cómo funciona la terapia psicológica online en Esencialmente Psicología?",
    answer: "La terapia online se realiza mediante videollamada en una plataforma segura y confidencial. Tras un primer contacto en el que conocemos tu motivo de consulta, te asignamos el profesional del equipo más adecuado a tu situación. Las sesiones tienen una duración de 60 minutos (o 90 minutos en sesiones familiares o de pareja extensas) y siguen la misma metodología clínica, rigurosa y cercana que aplicamos en consulta presencial."
  },
  {
    question: "¿Puedo hacer terapia online desde cualquier lugar de España?",
    answer: "Sí. Ofrecemos atención psicológica por videollamada para personas que residen en cualquier comunidad autónoma o municipio de España. Solo necesitas una conexión a internet estable y un espacio donde puedas expresarte con tranquilidad y privacidad durante la sesión."
  },
  {
    question: "¿Tiene la terapia online la misma duración y rigor que la presencial?",
    answer: "Sí. Las sesiones individuales tienen una duración estándar de 60 minutos, exactamente igual que en consulta física. El tratamiento está guiado por psicólogos colegiados que aplican psicoterapia basada en evidencia científica, adaptando las herramientas y el ritmo a las necesidades de cada paciente."
  },
  {
    question: "¿Es confidencial la consulta por videollamada?",
    answer: "Absolutamente. La confidencialidad es un principio ético y legal fundamental en psicología sanitaria. Utilizamos canales seguros y nos comprometemos con el secreto profesional y la protección de datos conforme al RGPD y la normativa sanitaria española."
  },
  {
    question: "¿Cuánto cuesta una sesión de terapia online?",
    answer: "La tarifa de la sesión individual de 60 minutos es de 55 €. La sesión de pareja de 60 minutos es de 65 € (o 90 € si se opta por sesión de 90 minutos) y la sesión familiar de 90 minutos es de 90 €. Puedes consultar nuestras tarifas actualizadas de forma totalmente transparente."
  },
  {
    question: "¿Se puede realizar terapia EMDR de forma online?",
    answer: "La terapia EMDR puede aplicarse en modalidad online en muchos casos mediante estimulación bilateral adaptada a pantalla (visual o auditiva). No obstante, el terapeuta siempre realiza una valoración clínica previa de idoneidad y estabilidad emocional para garantizar que el abordaje sea seguro y eficaz."
  },
  {
    question: "¿Qué ocurre si en el futuro deseo cambiar a modalidad presencial?",
    answer: "Si resides en Cataluña o te desplazas a la zona de Barcelona y el Vallès Occidental, puedes combinar o trasladar tu proceso a consulta presencial en nuestro centro físico de Cerdanyola del Vallès (Carrer del Pintor Togores, 1) con el mismo equipo."
  },
  {
    question: "¿Cómo puedo solicitar mi primera sesión online?",
    answer: "Puedes rellenar el formulario de contacto de nuestra web o escribirnos directamente por WhatsApp. Nuestro equipo responderá tus dudas, te orientará sobre la modalidad y coordinará contigo la fecha y hora de tu primera sesión."
  }
];

const OnlineTherapy = () => {
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [loadingPricing, setLoadingPricing] = useState(true);

  useEffect(() => {
    const loadPricing = async () => {
      try {
        const res = await pricingAPI.getAll();
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const active = res.data.filter(item => item.is_active !== false);
          if (active.length > 0) {
            setPricing(active);
          }
        }
      } catch (err) {
        console.warn('Usando tarifas por defecto verificadas:', err.message);
      } finally {
        setLoadingPricing(false);
      }
    };
    loadPricing();
  }, []);

  const whatsappUrl = getWhatsAppUrl("Hola 👋, he visto vuestra información sobre terapia online y me gustaría saber cómo empezar.");
  const phoneDisplay = getPhoneDisplay(true);
  const phoneUrl = getPhoneTelUrl();

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalClinic",
        "@id": "https://www.esencialmentepsicologia.com/#clinic",
        "name": "Esencialmente Psicología",
        "url": "https://www.esencialmentepsicologia.com/",
        "logo": "https://www.esencialmentepsicologia.com/logo192.png",
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
          "jobTitle": "Directora Clínica y Fundadora"
        }
      },
      {
        "@type": "Service",
        "@id": "https://www.esencialmentepsicologia.com/terapia-online#service",
        "name": "Terapia Psicológica Online en España",
        "serviceType": "Psicoterapia por videollamada",
        "provider": {
          "@id": "https://www.esencialmentepsicologia.com/#clinic"
        },
        "areaServed": {
          "@type": "Country",
          "name": "España"
        },
        "description": "Atención psicológica profesional y confidencial por videollamada para personas de toda España. Terapia individual, de pareja, ansiedad, trauma y EMDR.",
        "offers": {
          "@type": "Offer",
          "price": "55.00",
          "priceCurrency": "EUR",
          "availability": "https://schema.org/InStock",
          "url": "https://www.esencialmentepsicologia.com/terapia-online"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://www.esencialmentepsicologia.com/terapia-online#breadcrumb",
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
            "name": "Terapia Online",
            "item": "https://www.esencialmentepsicologia.com/terapia-online"
          }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": "https://www.esencialmentepsicologia.com/terapia-online#faq",
        "mainEntity": FAQS.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      }
    ]
  };

  return (
    <div className="online-therapy-page">
      <SEOHead
        title="Terapia Psicológica Online en España | Esencialmente Psicología"
        description="Terapia psicológica online por videollamada para toda España con psicólogos colegiados. Tratamiento de ansiedad, trauma, EMDR y terapia individual o de pareja."
        canonicalUrl="https://www.esencialmentepsicologia.com/terapia-online"
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section className="online-hero">
        <div className="container">
          <div className="hero-badge">
            <span className="badge-icon">🌐</span> Cobertura Nacional en Toda España
          </div>
          <h1>Terapia Psicológica Online en España</h1>
          <p className="hero-subtitle">
            Acompañamiento psicológico profesional por videollamada con nuestro equipo de psicólogos colegiados.
            Atención cercana, rigurosa y confidencial desde la comodidad de tu hogar.
          </p>

          <div className="hero-trust-badges">
            <div className="trust-badge-item">
              <span className="badge-check">✓</span> Psicólogos Colegiados (COPC)
            </div>
            <div className="trust-badge-item">
              <span className="badge-check">✓</span> 100% Confidencial y Seguro
            </div>
            <div className="trust-badge-item">
              <span className="badge-check">✓</span> Sesiones de 60 minutos
            </div>
            <div className="trust-badge-item">
              <span className="badge-check">✓</span> Videollamada Sin Desplazamientos
            </div>
          </div>

          <div className="hero-cta">
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg">
                <span className="btn-icon">💬</span> Contactar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Sección AEO: Definición Directa y Cómo Funciona */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Metodología Clara</span>
            <h2>¿Cómo funciona la terapia online en Esencialmente Psicología?</h2>
            <div className="title-divider"></div>
            <p className="section-description">
              La terapia online es un proceso psicoterapéutico realizado a distancia mediante videollamada.
              Permite recibir atención clínica especializada con la misma efectividad y calidez humana que en consulta presencial,
              eliminando barreras de desplazamiento o distancia geográfica.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Primer Contacto</h3>
              <p>Escríbenos a través del formulario o WhatsApp explicando brevemente tu situación o motivo de consulta.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Asignación Terapéutica</h3>
              <p>Coordinamos tu primera cita con el profesional de nuestro equipo que mejor se adapte a tus necesidades específicas.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Sesión por Videollamada</h3>
              <p>Te enviamos un enlace de acceso seguro. Te conectas desde tu móvil, tablet u ordenador a la hora acordada.</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Plan y Continuidad</h3>
              <p>Definimos objetivos terapéuticos compartidos y establecemos la frecuencia más conveniente para tu evolución.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Para Quién es Útil */}
      <section className="section-padding bg-light">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Accesibilidad</span>
            <h2>¿Para quién es adecuada la terapia por videollamada?</h2>
            <div className="title-divider"></div>
            <p className="section-description">
              La modalidad telemática está pensada para responder a las realidades y ritmos de vida actuales con total flexibilidad.
            </p>
          </div>

          <div className="use-cases-grid">
            <div className="use-case-card">
              <h3>Personas de toda España</h3>
              <p>Si resides en cualquier comunidad autónoma o municipio y buscas un equipo especializado en trauma, EMDR y apego.</p>
            </div>
            <div className="use-case-card">
              <h3>Conciliación y Horarios</h3>
              <p>Ideal si tienes jornadas laborales intensas, cargas familiares o dificultades para destinar tiempo a desplazamientos.</p>
            </div>
            <div className="use-case-card">
              <h3>Comodidad y Entorno Seguro</h3>
              <p>Para quienes se sienten más tranquilos y abiertos expresando sus emociones desde la intimidad de su propio espacio.</p>
            </div>
            <div className="use-case-card">
              <h3>Movilidad o Viajes Frecuentes</h3>
              <p>Permite mantener la regularidad y el vínculo terapéutico incluso si debes viajar o cambiar temporalmente de residencia.</p>
            </div>
            <div className="use-case-card">
              <h3>Terapia de Pareja a Distancia</h3>
              <p>Excelente alternativa cuando ambos miembros de la pareja tienen horarios incompatibles o residen en lugares distintos.</p>
            </div>
            <div className="use-case-card">
              <h3>Continuidad Terapéutica</h3>
              <p>Si iniciaste terapia presencial con nosotros en el Vallès y te has trasladado de ciudad, puedes continuar sin interrupción.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Áreas Clínicas y Tratamientos Disponibles Online */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Especialidades</span>
            <h2>Motivos de consulta y tratamientos que atendemos online</h2>
            <div className="title-divider"></div>
            <p className="section-description">
              Abordamos cada caso desde una perspectiva integradora y relacional, evaluando de forma continua la idoneidad del formato telemático.
            </p>
          </div>

          <div className="services-online-grid">
            <div className="service-online-item">
              <h3>Ansiedad y Regulación Emocional</h3>
              <p>Ataques de pánico, preocupación constante, fobias y gestión del estrés laboral o vital.</p>
            </div>
            <div className="service-online-item">
              <h3>Trauma Psicológico y Apego</h3>
              <p>Experiencias adversas del pasado, heridas de apego y sintomatología de estrés postraumático.</p>
            </div>
            <div className="service-online-item">
              <h3>Terapia EMDR Online</h3>
              <p>Técnica de desensibilización y reprocesamiento por movimientos oculares adaptada a videollamada previa valoración clínica.</p>
            </div>
            <div className="service-online-item">
              <h3>Terapia de Pareja Online</h3>
              <p>Crisis de comunicación, desconfianza, reencuentro emocional y toma de decisiones compartidas.</p>
            </div>
            <div className="service-online-item">
              <h3>Autoestima y Crecimiento Personal</h3>
              <p>Inseguridades, patrones repetitivos en relaciones, límites saludables y autoconocimiento.</p>
            </div>
            <div className="service-online-item">
              <h3>Duelo y Procesos de Pérdida</h3>
              <p>Acompañamiento respetuoso ante el fallecimiento de un ser querido, rupturas o cambios vitales profundos.</p>
            </div>
          </div>

          <div className="clinical-notice-box">
            <h4>⚠️ Criterio Clínico y Seguridad del Paciente (YMYL)</h4>
            <p>
              La terapia online no está recomendada para situaciones de emergencia psiquiátrica inmediata, riesgo autolítico agudo
              o trastornos psicológicos severos descompensados que requieran contención física o supervisión médica hospitalaria.
              En tales circunstancias, se orientará siempre hacia recursos sanitarios presenciales de proximidad.
            </p>
          </div>
        </div>
      </section>

      {/* Tarifas Transparentes (Consumo Dinámico) */}
      <section className="section-padding bg-light" id="tarifas-online">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Transparencia Total</span>
            <h2>Tarifas y Duración de las Sesiones Online</h2>
            <div className="title-divider"></div>
            <p className="section-description">
              Precios claros y sin compromisos de permanencia. Las sesiones online se abonan previamente mediante transferencia o Bizum seguro.
            </p>
          </div>

          <div className="pricing-cards-container">
            {pricing.slice(0, 3).map((item, idx) => (
              <div key={item.id || idx} className={`online-price-card ${idx === 0 ? 'featured-card' : ''}`}>
                {idx === 0 && <span className="featured-ribbon">Más habitual</span>}
                <div className="card-top">
                  <h3>{getCardTitle(item)}</h3>
                  <div className="price-tag">
                    <span className="currency">€</span>
                    <span className="amount">{parseFloat(item.price).toFixed(0)}</span>
                    <span className="per-session">/ sesión</span>
                  </div>
                  <p className="duration-tag">⏱️ {item.duration} minutos de atención directa</p>
                </div>
                <div className="card-body">
                  <p className="card-desc">{getCardDescription(item)}</p>
                  <ul className="price-features">
                    <li>✓ Psicólogo colegiado asignado a tu caso</li>
                    <li>✓ Plataforma de videollamada cifrada y segura</li>
                    <li>✓ Flexibilidad de horarios (mañanas y tardes)</li>
                    <li>✓ Factura sanitaria válida para aseguradoras/reembolso</li>
                  </ul>
                </div>
                <div className="card-action">
                  <Link to="/contacto" className="btn btn-primary btn-block">
                    Reservar Consulta
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="pricing-clarification text-center">
            <p>
              ¿Tienes dudas sobre qué tipo de sesión necesitas? Puedes escribirnos y te orientaremos sin compromiso.
              También puedes consultar todas las tarifas generales en nuestra página de <Link to="/servicios">Servicios y Tarifas</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Presencial vs Online: Comparativa Equilibrada */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Comparativa Clínica</span>
            <h2>¿Terapia presencial o terapia online?</h2>
            <div className="title-divider"></div>
            <p className="section-description">
              Ambas modalidades comparten el mismo rigor científico y cuidado profesional. La elección depende de tus circunstancias personales y preferencias.
            </p>
          </div>

          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Aspecto</th>
                  <th>Modalidad Online (Toda España)</th>
                  <th>Modalidad Presencial (Cerdanyola del Vallès)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Ámbito geográfico</strong></td>
                  <td>Desde cualquier punto de España</td>
                  <td>En consulta física: C. Pintor Togores, 1 (Vallès)</td>
                </tr>
                <tr>
                  <td><strong>Duración de sesión</strong></td>
                  <td>60 minutos estándar</td>
                  <td>60 minutos estándar</td>
                </tr>
                <tr>
                  <td><strong>Desplazamientos</strong></td>
                  <td>Cero tiempo de desplazamiento</td>
                  <td>Requiere acudir al centro clínico</td>
                </tr>
                <tr>
                  <td><strong>Equipo profesional</strong></td>
                  <td>Psicólogos colegiados de Esencialmente</td>
                  <td>Mismo equipo de psicólogos colegiados</td>
                </tr>
                <tr>
                  <td><strong>Confidencialidad</strong></td>
                  <td>Cifrado de videollamada y privacidad en casa</td>
                  <td>Despacho insonorizado y climatizado</td>
                </tr>
                <tr>
                  <td><strong>Idoneidad</strong></td>
                  <td>Ideal por distancia, horarios o comodidad</td>
                  <td>Recomendada si prefieres contacto cara a cara</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Qué necesitas para tu sesión */}
      <section className="section-padding bg-light">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Preparación Fácil</span>
            <h2>¿Qué necesitas para empezar tus sesiones online?</h2>
            <div className="title-divider"></div>
          </div>

          <div className="requirements-grid">
            <div className="requirement-item">
              <h3>1. Dispositivo adecuado</h3>
              <p>Un ordenador portátil, tablet o smartphone con cámara frontal y micrófono funcionales.</p>
            </div>
            <div className="requirement-item">
              <h3>2. Conexión a internet</h3>
              <p>Conexión Wi-Fi o datos móviles estable que permita mantener una videollamada fluida.</p>
            </div>
            <div className="requirement-item">
              <h3>3. Intimidad y tranquilidad</h3>
              <p>Una habitación o espacio cerrado donde no seas interrumpido y te sientas libre para hablar con total calma.</p>
            </div>
            <div className="requirement-item">
              <h3>4. Auriculares (recomendado)</h3>
              <p>El uso de auriculares favorece una mayor inmersión, claridad de sonido y privacidad extra en tu sesión.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Equipo Profesional */}
      <section className="section-padding bg-white text-center">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Profesionales Reales</span>
            <h2>Atención por nuestro equipo de psicólogos colegiados</h2>
            <div className="title-divider"></div>
            <p className="section-description">
              Detrás de cada pantalla no hay una plataforma impersonal, sino profesionales sanitarios con nombre propio,
              colegiación oficial en el Col·legi Oficial de Psicologia de Catalunya (COPC) y formación continua en psicoterapia basada en evidencia.
            </p>
          </div>
          <div className="team-callout-card">
            <p>
              Conoce las trayectorias, sensibilidades clínicas y áreas de especialización de quienes formamos el centro.
            </p>
            <Link to="/terapeutas" className="btn btn-secondary btn-lg">
              Ver el Equipo de Psicólogos →
            </Link>
          </div>
        </div>
      </section>

      {/* Preguntas Frecuentes (Renderizadas en el DOM para AEO/Crawlers) */}
      <section className="section-padding bg-light" id="faqs">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Dudas Habituales</span>
            <h2>Preguntas frecuentes sobre psicoterapia online en España</h2>
            <div className="title-divider"></div>
          </div>

          <div className="faq-details-container">
            {FAQS.map((faq, index) => (
              <details key={index} className="faq-accordion-item" open={index === 0}>
                <summary className="faq-accordion-header">
                  <h3>{faq.question}</h3>
                  <span className="accordion-chevron" aria-hidden="true">▾</span>
                </summary>
                <div className="faq-accordion-body">
                  <p>{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="online-cta-section section-padding text-center">
        <div className="container">
          <div className="cta-box">
            <h2>Da el primer paso hacia tu bienestar desde donde estés</h2>
            <p>
              Estés en Madrid, Sevilla, Valencia, Bilbao, Barcelona o cualquier rincón de España, estamos aquí para escucharte y acompañarte.
            </p>
            <div className="cta-actions">
              <Link to="/contacto" className="btn btn-primary btn-lg">
                Pedir Cita Online
              </Link>
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg">
                  <span className="btn-icon">💬</span> WhatsApp Directo
                </a>
              )}
            </div>
            {phoneUrl && (
              <p className="cta-phone-alternative">
                O si lo prefieres, llámanos al <a href={phoneUrl}>{phoneDisplay}</a>
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default OnlineTherapy;
