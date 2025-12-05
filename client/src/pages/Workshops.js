import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { workshopAPI, API_ROOT } from '../services/api';
import SEOHead from '../components/SEOHead';
import './Workshops.css';

const Workshops = () => {
    const [workshops, setWorkshops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchWorkshops = async () => {
            try {
                const response = await workshopAPI.getAll();
                // Filter only active workshops
                const activeWorkshops = response.data.filter(w => w.is_active);
                setWorkshops(activeWorkshops);
            } catch (err) {
                setError('Error al cargar los talleres');
                console.error('Error fetching workshops:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchWorkshops();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getImageUrl = (workshop) => {
        if (workshop.images && workshop.images.length > 0 && workshop.images[0].image_url) {
            return `${API_ROOT}/uploads/talleres/${workshop.images[0].image_url}`;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="workshops-page">
                <div className="container">
                    <div className="loading">Cargando talleres...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="workshops-page">
            <SEOHead
                title="Talleres y Formaciones | Esencialmente Psicología"
                description="Descubre nuestros talleres de psicología en Barcelona. Mindfulness, gestión del estrés, inteligencia emocional y más. Grupos reducidos con profesionales especializados."
                keywords="talleres psicología Barcelona, mindfulness, gestión estrés, inteligencia emocional, formación psicológica"
            />

            {/* Hero Section */}
            <section className="workshops-hero">
                <div className="container">
                    <h1>Talleres y Formaciones</h1>
                    <p>Aprende y crece con nuestros talleres especializados</p>
                </div>
            </section>

            <div className="workshops-content">
                <div className="container">
                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    {workshops.length === 0 && !error ? (
                        <div className="no-workshops">
                            <div className="no-workshops-icon">🎓</div>
                            <h2>Próximamente</h2>
                            <p>Estamos preparando nuevos talleres. ¡Vuelve pronto para descubrir nuestras próximas formaciones!</p>
                            <Link to="/contacto" className="btn btn-primary">
                                Suscríbete para recibir novedades
                            </Link>
                        </div>
                    ) : (
                        <div className="workshops-grid">
                            {workshops.map((workshop) => (
                                <article key={workshop.id} className="workshop-card">
                                    <div className="workshop-image">
                                        {getImageUrl(workshop) ? (
                                            <img
                                                src={getImageUrl(workshop)}
                                                alt={workshop.title}
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className="placeholder-image" style={{ display: getImageUrl(workshop) ? 'none' : 'flex' }}>
                                            <span>🎓</span>
                                        </div>
                                        <div className="workshop-date-badge">
                                            <span className="day">{new Date(workshop.start_date).getDate()}</span>
                                            <span className="month">{new Date(workshop.start_date).toLocaleDateString('es-ES', { month: 'short' })}</span>
                                        </div>
                                    </div>

                                    <div className="workshop-body">
                                        <h2 className="workshop-title">{workshop.title}</h2>

                                        <p className="workshop-description">
                                            {workshop.description.length > 120
                                                ? workshop.description.substring(0, 120) + '...'
                                                : workshop.description}
                                        </p>

                                        <div className="workshop-meta">
                                            <div className="meta-item">
                                                <span className="meta-icon">💰</span>
                                                <span className="meta-value">{workshop.price}€</span>
                                            </div>
                                            {workshop.location && (
                                                <div className="meta-item">
                                                    <span className="meta-icon">📍</span>
                                                    <span className="meta-value">{workshop.location}</span>
                                                </div>
                                            )}
                                            {workshop.max_participants && (
                                                <div className="meta-item">
                                                    <span className="meta-icon">👥</span>
                                                    <span className="meta-value">Máx. {workshop.max_participants} personas</span>
                                                </div>
                                            )}
                                        </div>

                                        <Link
                                            to={`/talleres/${workshop.slug || workshop.id}`}
                                            className="btn btn-primary workshop-btn"
                                        >
                                            Ver Detalles
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    <div className="cta-section">
                        <h2>¿Tienes alguna pregunta?</h2>
                        <p>Contacta con nosotros para más información sobre nuestros talleres</p>
                        <Link to="/contacto" className="btn btn-primary">Contactar</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Workshops;
