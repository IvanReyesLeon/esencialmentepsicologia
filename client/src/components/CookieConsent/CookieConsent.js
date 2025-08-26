import React, { useState, useEffect } from 'react';
import './CookieConsent.css';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
    functional: false
  });

  useEffect(() => {
    // Check if user has already given consent
    const consentData = localStorage.getItem('cookieConsent');
    if (!consentData) {
      setShowBanner(true);
    } else {
      // Apply saved preferences
      const savedPreferences = JSON.parse(consentData);
      window.cookieConsent = savedPreferences;
      applyConsent(savedPreferences);
    }
  }, []);

  const applyConsent = (consentPreferences) => {
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('cookieConsentUpdate', { 
      detail: consentPreferences 
    }));
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
    window.cookieConsent = allAccepted;
    applyConsent(allAccepted);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('cookieConsent', JSON.stringify(onlyNecessary));
    window.cookieConsent = onlyNecessary;
    applyConsent(onlyNecessary);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    const savedPreferences = {
      ...preferences,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('cookieConsent', JSON.stringify(savedPreferences));
    window.cookieConsent = savedPreferences;
    applyConsent(savedPreferences);
    setShowBanner(false);
    setShowDetails(false);
  };

  const togglePreference = (type) => {
    if (type === 'necessary') return; // Cannot disable necessary cookies
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  if (!showBanner) return null;

  return (
    <div className="cookie-consent-overlay">
      <div className="cookie-consent-banner">
        <div className="cookie-content">
          <h3>🍪 Configuración de Cookies</h3>
          <p>
            Utilizamos cookies para mejorar tu experiencia en nuestro sitio web. 
            Algunas cookies son esenciales para el funcionamiento del sitio, mientras 
            que otras nos ayudan a mejorar nuestros servicios.
          </p>
          
          {!showDetails ? (
            <div className="cookie-actions">
              <button 
                className="btn-cookie btn-reject"
                onClick={handleRejectAll}
              >
                Rechazar todas
              </button>
              <button 
                className="btn-cookie btn-configure"
                onClick={() => setShowDetails(true)}
              >
                Configurar
              </button>
              <button 
                className="btn-cookie btn-accept"
                onClick={handleAcceptAll}
              >
                Aceptar todas
              </button>
            </div>
          ) : (
            <div className="cookie-details">
              <div className="cookie-categories">
                <div className="cookie-category">
                  <label className="cookie-switch">
                    <input 
                      type="checkbox" 
                      checked={preferences.necessary}
                      disabled
                    />
                    <span className="slider disabled"></span>
                    <div className="category-info">
                      <strong>Cookies necesarias</strong>
                      <p>Esenciales para el funcionamiento del sitio web. No se pueden desactivar.</p>
                    </div>
                  </label>
                </div>

                <div className="cookie-category">
                  <label className="cookie-switch">
                    <input 
                      type="checkbox" 
                      checked={preferences.functional}
                      onChange={() => togglePreference('functional')}
                    />
                    <span className="slider"></span>
                    <div className="category-info">
                      <strong>Cookies funcionales</strong>
                      <p>Permiten funcionalidades mejoradas como mapas y vídeos incrustados.</p>
                    </div>
                  </label>
                </div>

                <div className="cookie-category">
                  <label className="cookie-switch">
                    <input 
                      type="checkbox" 
                      checked={preferences.analytics}
                      onChange={() => togglePreference('analytics')}
                    />
                    <span className="slider"></span>
                    <div className="category-info">
                      <strong>Cookies analíticas</strong>
                      <p>Nos ayudan a entender cómo los usuarios interactúan con nuestro sitio.</p>
                    </div>
                  </label>
                </div>

                <div className="cookie-category">
                  <label className="cookie-switch">
                    <input 
                      type="checkbox" 
                      checked={preferences.marketing}
                      onChange={() => togglePreference('marketing')}
                    />
                    <span className="slider"></span>
                    <div className="category-info">
                      <strong>Cookies de marketing</strong>
                      <p>Se utilizan para mostrar anuncios relevantes y medir campañas publicitarias.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="cookie-actions">
                <button 
                  className="btn-cookie btn-back"
                  onClick={() => setShowDetails(false)}
                >
                  Volver
                </button>
                <button 
                  className="btn-cookie btn-save"
                  onClick={handleSavePreferences}
                >
                  Guardar preferencias
                </button>
              </div>

              <div className="cookie-links">
                <a href="/politica-privacidad" target="_blank">Política de Privacidad</a>
                <span>|</span>
                <a href="/politica-cookies" target="_blank">Política de Cookies</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
