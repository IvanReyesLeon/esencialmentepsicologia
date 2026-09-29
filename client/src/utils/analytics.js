/**
 * Tracking mínimo de eventos custom hacia GA4.
 * No enviar nunca: especialidad, slug, texto de WhatsApp, síntomas, PII o información clínica.
 * Solo contexto técnico de UI (posición/tipo de CTA, ruta).
 */
export const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
};
