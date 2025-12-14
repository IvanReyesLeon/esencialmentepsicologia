import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { workshopAPI, API_ROOT } from '../services/api';
import SEOHead from '../components/SEOHead';
import './WorkshopDetail.css';

const WorkshopDetail = () => {
    const { id } = useParams();
    const [workshop, setWorkshop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState(0);

    // Registration form state
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [registrationData, setRegistrationData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [registrationStatus, setRegistrationStatus] = useState({ type: '', message: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchWorkshop = async () => {
            try {
                const response = await workshopAPI.getById(id);
                setWorkshop(response.data);
            } catch (err) {
                setError('No se pudo cargar el taller');
                console.error('Error fetching workshop:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchWorkshop();
    }, [id]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatShortDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }
        return `${API_ROOT}/uploads/talleres/${imageUrl}`;
    };

    const getTotalAttendees = () => {
        if (!workshop) return 0;
        const online = parseInt(workshop.registration_count) || 0;
        const manual = parseInt(workshop.manual_attendees) || 0;
        return online + manual;
    };

    const getAvailableSpots = () => {
        if (!workshop || !workshop.max_participants) return null;
        return workshop.max_participants - getTotalAttendees();
    };

    const handleRegistrationSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setRegistrationStatus({ type: '', message: '' });

        try {
            await workshopAPI.register(workshop.id, registrationData);
            setRegistrationStatus({
                type: 'success',
                message: '¡Inscripción realizada con éxito! Te contactaremos pronto con más detalles.'
            });
            setRegistrationData({ name: '', email: '', phone: '' });
            setShowRegistrationForm(false);
            // Refresh workshop data to update attendee count
            const response = await workshopAPI.getById(id);
            setWorkshop(response.data);
        } catch (err) {
            setRegistrationStatus({
                type: 'error',
                message: err.response?.data?.message || 'Error al inscribirse. Por favor, inténtalo de nuevo.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="workshop-detail">
                <div className="wd-loading">
                    <div className="spinner"></div>
                    <p>Cargando taller...</p>
                </div>
            </div>
        );
    }

    if (error || !workshop) {
        return (
            <div className="workshop-detail">
                <div className="wd-error">
                    <span className="error-icon">😕</span>
                    <h2>{error || 'Taller no encontrado'}</h2>
                    <Link to="/talleres" className="wd-btn wd-btn-primary">Volver a Talleres</Link>
                </div>
            </div>
        );
    }

    const hasImages = workshop.images && workshop.images.length > 0;
    const primaryImage = hasImages ? getImageUrl(workshop.images[0].image_url) : null;
    const allowRegistration = workshop.allow_registration !== false;
    const showAttendeesCount = workshop.show_attendees_count === true;
    const availableSpots = getAvailableSpots();
    const isFull = availableSpots !== null && availableSpots <= 0;

    // Schema.org structured data for Event
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": workshop.title,
        "description": workshop.description,
        "startDate": workshop.start_date,
        "endDate": workshop.end_date || workshop.start_date,
        "location": {
            "@type": "Place",
            "name": workshop.location || "Esencialmente Psicología",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Barcelona",
                "addressCountry": "ES"
            }
        },
        "image": primaryImage,
        "offers": {
            "@type": "Offer",
            "price": workshop.price,
            "priceCurrency": "EUR",
            "availability": isFull ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
            "url": window.location.href
        },
        "organizer": {
            "@type": "Organization",
            "name": "Esencialmente Psicología",
            "url": "https://esencialmentepsicologia.com"
        }
    };

    return (
        <div className="workshop-detail">
            <SEOHead
                title={`${workshop.title} | Talleres | Esencialmente Psicología`}
                description={workshop.description.substring(0, 160) + '...'}
                image={primaryImage}
                type="event"
                structuredData={structuredData}
            />

            {/* Breadcrumb */}
            <div className="wd-breadcrumb">
                <div className="wd-container">
                    <Link to="/">Inicio</Link>
                    <span>/</span>
                    <Link to="/talleres">Talleres</Link>
                    <span>/</span>
                    <span className="current">{workshop.title}</span>
                </div>
            </div>

            {/* Main Content */}
            <main className="wd-main">
                <div className="wd-container">
                    <div className="wd-layout">
                        {/* Left Column - Image & Description */}
                        <div className="wd-content">
                            {/* Hero Image */}
                            {hasImages && (
                                <div className="wd-hero-image">
                                    <img
                                        src={getImageUrl(workshop.images[selectedImage].image_url)}
                                        alt={`${workshop.title} - Imagen principal`}
                                        width="800"
                                        height="500"
                                        style={{ aspectRatio: '16/10', objectFit: 'cover' }}
                                        fetchPriority="high"
                                    />
                                    <div className="wd-date-badge">
                                        <span className="day">{new Date(workshop.start_date).getDate()}</span>
                                        <span className="month">{new Date(workshop.start_date).toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}</span>
                                    </div>
                                    {workshop.images.length > 1 && (
                                        <div className="wd-gallery-nav">
                                            {workshop.images.map((img, idx) => (
                                                <button
                                                    key={img.id}
                                                    className={`nav-dot ${idx === selectedImage ? 'active' : ''}`}
                                                    onClick={() => setSelectedImage(idx)}
                                                    aria-label={`Ver imagen ${idx + 1}`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Title & Quick Info for Mobile */}
                            <div className="wd-mobile-header">
                                <h1>{workshop.title}</h1>
                                <div className="wd-quick-info">
                                    {workshop.location && (
                                        <span className="info-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                <circle cx="12" cy="10" r="3" />
                                            </svg>
                                            {workshop.location}
                                        </span>
                                    )}
                                    <span className="info-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        {formatShortDate(workshop.start_date)}
                                    </span>
                                </div>
                            </div>

                            {/* Description Section */}
                            <section className="wd-description">
                                <h2>Sobre este taller</h2>
                                <div className="description-content">
                                    {workshop.description.split('\n').map((paragraph, idx) => (
                                        paragraph.trim() && <p key={idx}>{paragraph}</p>
                                    ))}
                                </div>
                            </section>

                            {/* Additional Gallery Thumbnails */}
                            {hasImages && workshop.images.length > 1 && (
                                <section className="wd-gallery">
                                    <h2>Galería</h2>
                                    <div className="gallery-grid">
                                        {workshop.images.map((img, idx) => (
                                            <button
                                                key={img.id}
                                                className={`gallery-thumb ${idx === selectedImage ? 'active' : ''}`}
                                                onClick={() => setSelectedImage(idx)}
                                            >
                                                <img
                                                    src={getImageUrl(img.image_url)}
                                                    alt={`${workshop.title} - Miniatura ${idx + 1}`}
                                                    loading="lazy"
                                                    decoding="async"
                                                    width="150"
                                                    height="100"
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Right Column - Booking Card */}
                        <aside className="wd-sidebar">
                            <div className="wd-booking-card">
                                {/* Title for Desktop */}
                                <div className="wd-desktop-header">
                                    <h1>{workshop.title}</h1>
                                    {workshop.location && (
                                        <p className="workshop-location">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                <circle cx="12" cy="10" r="3" />
                                            </svg>
                                            {workshop.location}
                                        </p>
                                    )}
                                </div>

                                {/* Price */}
                                <div className="wd-price">
                                    <span className="price-value">{workshop.price}€</span>
                                    <span className="price-label">por persona</span>
                                </div>

                                {/* Attendees Count */}
                                {showAttendeesCount && (
                                    <div className="wd-attendees-count">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                        {workshop.max_participants ? (
                                            <span>{getTotalAttendees()}/{workshop.max_participants} plazas ocupadas</span>
                                        ) : (
                                            <span>{getTotalAttendees()} inscritos</span>
                                        )}
                                    </div>
                                )}

                                {/* Registration Status Message */}
                                {registrationStatus.message && (
                                    <div className={`wd-status-message ${registrationStatus.type}`}>
                                        {registrationStatus.message}
                                    </div>
                                )}

                                {/* CTA Button / Registration Form */}
                                {allowRegistration && !isFull ? (
                                    <>
                                        {!showRegistrationForm ? (
                                            <button
                                                onClick={() => setShowRegistrationForm(true)}
                                                className="wd-btn wd-btn-primary wd-btn-large"
                                            >
                                                Inscribirme ahora
                                            </button>
                                        ) : (
                                            <form onSubmit={handleRegistrationSubmit} className="wd-registration-form">
                                                <h3>Datos de inscripción</h3>
                                                <div className="form-group">
                                                    <label htmlFor="reg-name">Nombre completo *</label>
                                                    <input
                                                        type="text"
                                                        id="reg-name"
                                                        value={registrationData.name}
                                                        onChange={(e) => setRegistrationData({ ...registrationData, name: e.target.value })}
                                                        required
                                                        placeholder="Tu nombre"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="reg-email">Email *</label>
                                                    <input
                                                        type="email"
                                                        id="reg-email"
                                                        value={registrationData.email}
                                                        onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })}
                                                        required
                                                        placeholder="tu@email.com"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="reg-phone">Teléfono (opcional)</label>
                                                    <input
                                                        type="tel"
                                                        id="reg-phone"
                                                        value={registrationData.phone}
                                                        onChange={(e) => setRegistrationData({ ...registrationData, phone: e.target.value })}
                                                        placeholder="600 123 456"
                                                    />
                                                </div>
                                                <div className="form-actions">
                                                    <button
                                                        type="submit"
                                                        className="wd-btn wd-btn-primary"
                                                        disabled={submitting}
                                                    >
                                                        {submitting ? 'Enviando...' : 'Confirmar inscripción'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="wd-btn wd-btn-secondary"
                                                        onClick={() => setShowRegistrationForm(false)}
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </>
                                ) : isFull ? (
                                    <div className="wd-full-message">
                                        <span>⚠️ Plazas agotadas</span>
                                        <Link to="/contacto" className="wd-btn wd-btn-secondary">
                                            Contactar para lista de espera
                                        </Link>
                                    </div>
                                ) : (
                                    <Link to="/contacto" className="wd-btn wd-btn-primary wd-btn-large">
                                        Contactar para más info
                                    </Link>
                                )}

                                {/* Details List */}
                                <div className="wd-details">
                                    <div className="detail-item">
                                        <div className="detail-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                        </div>
                                        <div className="detail-content">
                                            <span className="detail-label">Fecha de inicio</span>
                                            <span className="detail-value">{formatDate(workshop.start_date)}</span>
                                        </div>
                                    </div>

                                    {workshop.end_date && workshop.end_date !== workshop.start_date && (
                                        <div className="detail-item">
                                            <div className="detail-icon">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                            </div>
                                            <div className="detail-content">
                                                <span className="detail-label">Fecha de fin</span>
                                                <span className="detail-value">{formatDate(workshop.end_date)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {workshop.max_participants && (
                                        <div className="detail-item">
                                            <div className="detail-icon">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                    <circle cx="9" cy="7" r="4" />
                                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                </svg>
                                            </div>
                                            <div className="detail-content">
                                                <span className="detail-label">Plazas limitadas</span>
                                                <span className="detail-value">Máximo {workshop.max_participants} personas</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Contact Info */}
                                <div className="wd-contact-hint">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                    <p>¿Tienes dudas? <Link to="/contacto">Contáctanos</Link></p>
                                </div>

                                {/* Social Share */}
                                <div className="wd-social-share">
                                    <h3>Compartir taller</h3>
                                    <div className="share-buttons">
                                        <button
                                            className="share-btn share-whatsapp"
                                            onClick={() => {
                                                const text = `¡Mira este taller! ${workshop.title}`;
                                                // Usar window.location.href para asegurar url completa
                                                window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + window.location.href)}`, '_blank');
                                            }}
                                            aria-label="Compartir en WhatsApp"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                            </svg>
                                            WhatsApp
                                        </button>

                                        {navigator.share && (
                                            <button
                                                className="share-btn share-native"
                                                onClick={() => {
                                                    navigator.share({
                                                        title: workshop.title,
                                                        text: workshop.description.substring(0, 100),
                                                        url: window.location.href
                                                    }).catch(console.error);
                                                }}
                                                aria-label="Compartir en otras redes"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="18" cy="5" r="3" />
                                                    <circle cx="6" cy="12" r="3" />
                                                    <circle cx="18" cy="19" r="3" />
                                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                                </svg>
                                                Compartir
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            {/* Related CTA */}
            <section className="wd-cta">
                <div className="wd-container">
                    <div className="cta-content">
                        <h2>¿Quieres más información?</h2>
                        <p>Estaremos encantados de resolver todas tus dudas sobre este taller</p>
                        <Link to="/contacto" className="wd-btn wd-btn-white">
                            Contactar ahora
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default WorkshopDetail;
