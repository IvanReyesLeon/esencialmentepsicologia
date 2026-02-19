import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ServiceNoticeModal.css';

const ServiceNoticeModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const hasSeenNotice = localStorage.getItem('hasSeenNotice_psico_accesible');
        if (!hasSeenNotice) {
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('hasSeenNotice_psico_accesible', 'true');
    };

    const handleNavigate = () => {
        handleClose();
        navigate('/psico-accesible');
    };

    if (!isOpen) return null;

    return (
        <div className="service-notice-overlay" onClick={handleClose}>
            <div className="service-notice-content psico-accesible-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={handleClose} aria-label="Cerrar">&times;</button>

                <div className="psico-modal-header">
                    <h3>Programa</h3>
                    <h2><span className="psico-highlight">PSICO</span>accesible</h2>
                </div>

                <div className="psico-modal-body">
                    <p className="psico-intro">
                        Creemos que la salud mental debería ser <strong>accesible para todxs</strong>.
                        Por eso hemos creado un programa de terapia a precio reducido.
                    </p>

                    <div className="psico-features">
                        <div className="psico-feature">
                            <span>Psicólogas en formación avanzada</span>
                        </div>
                        <div className="psico-feature">
                            <span>Supervisión continua profesional</span>
                        </div>
                        <div className="psico-feature">
                            <span>Precio por sesión: <strong>30€</strong></span>
                        </div>
                    </div>
                </div>

                <div className="psico-modal-actions">
                    <button className="btn-psico-secondary" onClick={handleClose}>
                        Cerrar
                    </button>
                    <button className="btn-psico-primary" onClick={handleNavigate}>
                        Más Información
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ServiceNoticeModal;
