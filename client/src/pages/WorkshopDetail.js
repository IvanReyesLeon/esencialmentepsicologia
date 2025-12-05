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
        return `${API_ROOT}/uploads/talleres/${imageUrl}`;
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
            "availability": "https://schema.org/InStock",
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
                                        alt={workshop.title}
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
                                                    alt={`${workshop.title} - Imagen ${idx + 1}`}
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

                                {/* CTA Button */}
                                <Link to="/contacto" className="wd-btn wd-btn-primary wd-btn-large">
                                    Reservar mi plaza
                                </Link>

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
