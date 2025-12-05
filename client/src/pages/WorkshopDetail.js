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

    const getImageUrl = (imageUrl) => {
        return `${API_ROOT}/uploads/talleres/${imageUrl}`;
    };

    if (loading) {
        return (
            <div className="workshop-detail">
                <div className="container">
                    <div className="loading">Cargando taller...</div>
                </div>
            </div>
        );
    }

    if (error || !workshop) {
        return (
            <div className="workshop-detail">
                <div className="container">
                    <div className="error-message">{error || 'Taller no encontrado'}</div>
                    <Link to="/talleres" className="btn btn-secondary">Volver a Talleres</Link>
                </div>
            </div>
        );
    }

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
        "image": workshop.images && workshop.images.length > 0
            ? getImageUrl(workshop.images[0].image_url)
            : undefined,
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
                image={workshop.images && workshop.images.length > 0
                    ? `/uploads/talleres/${workshop.images[0].image_url}`
                    : undefined}
                type="event"
                structuredData={structuredData}
            />

            {/* Hero Section */}
            <section className="workshop-hero">
                <div className="container">
                    <Link to="/talleres" className="back-link">← Volver a Talleres</Link>

                    <div className="detail-hero-content">
                        <div className="detail-hero-info">
                            <div className="date-badge">
                                <span className="day">{new Date(workshop.start_date).getDate()}</span>
                                <span className="month">{new Date(workshop.start_date).toLocaleDateString('es-ES', { month: 'long' })}</span>
                                <span className="year">{new Date(workshop.start_date).getFullYear()}</span>
                            </div>
                            <h1>{workshop.title}</h1>
                            {workshop.location && (
                                <p className="location">📍 {workshop.location}</p>
                            )}
                        </div>

                        <div className="detail-hero-price">
                            <span className="price-label">Precio</span>
                            <span className="price-amount">{workshop.price}€</span>
                            <Link to="/contacto" className="btn btn-primary btn-large">
                                Inscribirse
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="workshop-content">
                <div className="container">
                    <div className="content-grid">
                        {/* Description */}
                        <div className="workshop-description">
                            <h2>Sobre este taller</h2>
                            <div className="description-text">
                                {workshop.description.split('\n').map((paragraph, idx) => (
                                    <p key={idx}>{paragraph}</p>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <aside className="workshop-sidebar">
                            <div className="info-card">
                                <h3>Detalles</h3>
                                <ul className="details-list">
                                    <li>
                                        <span className="icon">📅</span>
                                        <div>
                                            <strong>Fecha</strong>
                                            <span>{formatDate(workshop.start_date)}</span>
                                        </div>
                                    </li>
                                    {workshop.end_date && workshop.end_date !== workshop.start_date && (
                                        <li>
                                            <span className="icon">🏁</span>
                                            <div>
                                                <strong>Hasta</strong>
                                                <span>{formatDate(workshop.end_date)}</span>
                                            </div>
                                        </li>
                                    )}
                                    {workshop.location && (
                                        <li>
                                            <span className="icon">📍</span>
                                            <div>
                                                <strong>Lugar</strong>
                                                <span>{workshop.location}</span>
                                            </div>
                                        </li>
                                    )}
                                    {workshop.max_participants && (
                                        <li>
                                            <span className="icon">👥</span>
                                            <div>
                                                <strong>Plazas</strong>
                                                <span>Máximo {workshop.max_participants} personas</span>
                                            </div>
                                        </li>
                                    )}
                                    <li>
                                        <span className="icon">💰</span>
                                        <div>
                                            <strong>Inversión</strong>
                                            <span className="price-highlight">{workshop.price}€</span>
                                        </div>
                                    </li>
                                </ul>

                                <Link to="/contacto" className="btn btn-primary btn-block">
                                    Reservar Plaza
                                </Link>
                            </div>
                        </aside>
                    </div>

                    {/* Image Gallery */}
                    {workshop.images && workshop.images.length > 0 && (
                        <div className="workshop-gallery">
                            <h2>Galería</h2>
                            <div className="gallery-main">
                                <img
                                    src={getImageUrl(workshop.images[selectedImage].image_url)}
                                    alt={`${workshop.title} - Imagen ${selectedImage + 1}`}
                                />
                            </div>
                            {workshop.images.length > 1 && (
                                <div className="gallery-thumbnails">
                                    {workshop.images.map((img, idx) => (
                                        <button
                                            key={img.id}
                                            className={`thumbnail ${idx === selectedImage ? 'active' : ''}`}
                                            onClick={() => setSelectedImage(idx)}
                                        >
                                            <img
                                                src={getImageUrl(img.image_url)}
                                                alt={`Miniatura ${idx + 1}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="workshop-cta">
                <div className="container">
                    <h2>¿Tienes preguntas sobre este taller?</h2>
                    <p>Contacta con nosotros y te ayudaremos encantados</p>
                    <Link to="/contacto" className="btn btn-primary">Contactar</Link>
                </div>
            </section>
        </div>
    );
};

export default WorkshopDetail;
