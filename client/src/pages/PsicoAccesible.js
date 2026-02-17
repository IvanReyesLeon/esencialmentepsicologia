import React from 'react';
import { Link } from 'react-router-dom';
import './PsicoAccesible.css';

const PsicoAccesible = () => {
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Programa PSICOaccesible - Esencialmente Psicología',
                    text: 'Descubre el programa de terapia a precio reducido de Esencialmente Psicología.',
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('¡Enlace copiado al portapapeles!');
        }
    };
    return (
        <div className="psico-accesible-page">
            <div className="container">
                <div className="psico-header animate-fadeIn">
                    <h1>Programa <span className="highlight">PSICOaccesible</span></h1>
                </div>

                <div className="psico-content animate-slideUp">
                    <div className="intro-box">
                        <p>
                            En nuestro centro creemos que la salud mental debería ser <span className="underline">accesible</span> para todxs.
                        </p>
                        <p>
                            Por eso hemos creado un programa de terapia a precio reducido para quienes ahora mismo lo tienen más complicado a nivel económico.
                        </p>
                    </div>

                    <div className="details-box">
                        <h2>¿En qué consiste?</h2>
                        <ul className="benefits-list">
                            <li>Sesiones con psicólogas en prácticas (último tramo de formación)</li>
                            <li>Acompañamiento y supervisión continua por parte de psicólogos/as sanitarios del centro.</li>
                            <li>Misma profesionalidad, con un precio más accesible</li>
                        </ul>
                    </div>

                    <div className="price-tag">
                        <span>PRECIO POR SESIÓN: 30€</span>
                    </div>

                    <div className="contact-action">
                        <p>
                            Para <strong>solicitar plaza</strong>, ponte en contacto con nosotros indicando tu nombre, teléfono y motivo de consulta.
                        </p>
                        <p>
                            Te contactaremos para explicarte el funcionamiento y valorar si este programa encaja contigo.
                        </p>

                        <div className="psico-buttons">
                            <Link to="/contacto" className="btn-psico contact-btn">Solicitar Programa</Link>
                            <button onClick={handleShare} className="btn-psico share-btn">
                                🔗 Compartir
                            </button>
                        </div>
                    </div>

                    <div className="brand-logo">
                        <img src="/assets/images/Esencialmente_log.png" alt="Esencialmente Psicología" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PsicoAccesible;
