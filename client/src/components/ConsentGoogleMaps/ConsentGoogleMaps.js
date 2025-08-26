import React, { useState, useEffect } from 'react';
import './ConsentGoogleMaps.css';

const ConsentGoogleMaps = ({ 
  src, 
  title, 
  width = "100%", 
  height = "400",
  style = { border: 0 }
}) => {
  const [hasConsent, setHasConsent] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    // Check initial consent
    checkConsent();

    // Listen for consent changes
    const handleConsentUpdate = (event) => {
      checkConsent();
    };

    window.addEventListener('cookieConsentUpdate', handleConsentUpdate);
    return () => {
      window.removeEventListener('cookieConsentUpdate', handleConsentUpdate);
    };
  }, []);

  const checkConsent = () => {
    const consentData = localStorage.getItem('cookieConsent');
    if (consentData) {
      const consent = JSON.parse(consentData);
      setHasConsent(consent.functional === true);
      setShowMap(consent.functional === true);
    }
  };

  const handleAcceptMaps = () => {
    // Update consent to include functional cookies
    const currentConsent = localStorage.getItem('cookieConsent');
    if (currentConsent) {
      const consent = JSON.parse(currentConsent);
      consent.functional = true;
      localStorage.setItem('cookieConsent', JSON.stringify(consent));
      window.cookieConsent = consent;
      
      // Dispatch event to update other components
      window.dispatchEvent(new CustomEvent('cookieConsentUpdate', { 
        detail: consent 
      }));
      
      setHasConsent(true);
      setShowMap(true);
    } else {
      // If no consent exists, show cookie banner
      alert('Por favor, configura tus preferencias de cookies primero.');
    }
  };

  if (showMap) {
    return (
      <iframe
        src={src}
        width={width}
        height={height}
        style={style}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={title}
      />
    );
  }

  return (
    <div className="map-consent-placeholder" style={{ width, height }}>
      <div className="consent-content">
        <div className="map-icon">📍</div>
        <h3>Google Maps requiere tu consentimiento</h3>
        <p>
          Para mostrar el mapa necesitamos tu permiso para cargar contenido de Google Maps, 
          que puede establecer cookies y recopilar datos sobre tu actividad.
        </p>
        {!hasConsent ? (
          <button className="btn-accept-maps" onClick={handleAcceptMaps}>
            Aceptar y mostrar mapa
          </button>
        ) : (
          <p className="consent-info">
            Las cookies funcionales están desactivadas. 
            Actualiza tus preferencias de cookies para ver el mapa.
          </p>
        )}
        <a 
          href="https://policies.google.com/privacy" 
          target="_blank" 
          rel="noopener noreferrer"
          className="privacy-link"
        >
          Política de privacidad de Google
        </a>
      </div>
    </div>
  );
};

export default ConsentGoogleMaps;
