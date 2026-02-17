import React, { useState, useEffect } from 'react';
import './ServiceNoticeModal.css';

const ServiceNoticeModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const hasSeenNotice = localStorage.getItem('hasSeenServiceNotice_phone_issue');
        if (!hasSeenNotice) {
            // Small delay to ensure it appears after other initial loads/animations
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('hasSeenServiceNotice_phone_issue', 'true');
    };

    const handleWhatsApp = () => {
        handleClose();
        window.open('https://wa.me/34649490140', '_blank', 'noopener,noreferrer');
    };

    if (!isOpen) return null;

    return (
        <div className="service-notice-overlay" onClick={handleClose}>
            <div className="service-notice-content" onClick={e => e.stopPropagation()}>
                <div className="service-notice-header">
                    <span className="notice-icon">⚠️</span>
                    <h3>Aviso Importante</h3>
                    <button className="close-btn" onClick={handleClose}>&times;</button>
                </div>
                <div className="service-notice-body">
                    <p>
                        Actualmente nuestras líneas telefónicas se encuentran fuera de servicio por un problema técnico.
                    </p>
                    <p>
                        Si necesitas contactar con nosotros, por favor hazlo a través de <strong>WhatsApp</strong>.
                    </p>
                </div>
                <div className="service-notice-actions">
                    <button className="btn-notice-secondary" onClick={handleClose}>
                        Entendido
                    </button>
                    <button className="btn-notice-primary" onClick={handleWhatsApp}>
                        Ir a WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ServiceNoticeModal;
