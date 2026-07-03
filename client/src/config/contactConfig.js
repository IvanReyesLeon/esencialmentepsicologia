/**
 * Configuración centralizada para canales de contacto (WhatsApp, Teléfono, etc.)
 * Evita hardcodear números o lógica de construcción de URLs en los componentes visuales.
 */

const DEFAULT_WHATSAPP_MESSAGE = "Hola 👋, me gustaría recibir información sobre la terapia en Esencialmente Psicología. ¿Podríais orientarme un poco? Muchas gracias.";

/**
 * Obtiene el número de WhatsApp desde variables de entorno según la convención de Create React App (REACT_APP_*).
 */
export const getWhatsAppPhone = () => {
  const phone = process.env.REACT_APP_WHATSAPP_PHONE;
  if (!phone) {
    if (process.env.NODE_ENV === 'development') {
      console.warn("⚠️ [StickyWhatsApp] La variable de entorno REACT_APP_WHATSAPP_PHONE no está definida. El botón de WhatsApp o los enlaces podrían permanecer deshabilitados u ocultos.");
    }
    return null;
  }
  // Limpiar caracteres no numéricos excepto posible '+' inicial
  return phone.replace(/[^\d+]/g, '');
};

/**
 * Obtiene el mensaje por defecto inteligente adaptado a la ruta / página en la que navega el usuario.
 * @param {string} pathname - Ruta actual de window.location o useLocation()
 */
export const getSmartWhatsAppMessage = (pathname = '') => {
  if (!pathname) {
    if (typeof window !== 'undefined' && window.location) {
      pathname = window.location.pathname;
    } else {
      return DEFAULT_WHATSAPP_MESSAGE;
    }
  }

  const path = pathname.toLowerCase();

  if (path.includes('/terapeutas')) {
    return "Hola 👋, me gustaría solicitar información sobre vuestro equipo de terapeutas y pedir cita. ¿Podríais orientarme?";
  }
  if (path.includes('/emdr') || path.includes('/trauma')) {
    return "Hola 👋, me gustaría recibir información específica sobre la terapia EMDR y el abordaje del trauma.";
  }
  if (path.includes('/ansiedad')) {
    return "Hola 👋, me gustaría consultar información y pedir ayuda sobre terapia para la ansiedad y gestión emocional.";
  }
  if (path.includes('/pareja')) {
    return "Hola 👋, me gustaría pedir información sobre vuestras sesiones de terapia de pareja.";
  }
  if (path.includes('/infantil') || path.includes('/infanto')) {
    return "Hola 👋, me gustaría recibir orientación e información sobre terapia psicológica infanto-juvenil.";
  }
  if (path.includes('/talleres')) {
    return "Hola 👋, me gustaría pedir información sobre los próximos talleres, grupos y actividades en el centro.";
  }
  if (path.includes('/servicios')) {
    return "Hola 👋, me gustaría recibir información sobre las tarifas, modalidades y servicios de terapia en Esencialmente Psicología.";
  }
  if (path.includes('/donde-estamos') || path.includes('/ubicacion') || path.includes('/cerdanyola')) {
    return "Hola 👋, me gustaría pedir información sobre consulta presencial en Cerdanyola del Vallès.";
  }
  if (path.includes('/blog')) {
    return "Hola 👋, he estado leyendo vuestro blog y me gustaría solicitar información para empezar terapia.";
  }
  if (path.includes('/contacto')) {
    return "Hola 👋, me gustaría recibir información sobre las terapias que ofrecéis en Esencialmente Psicología.";
  }

  return DEFAULT_WHATSAPP_MESSAGE;
};

/**
 * Construye dinámicamente la URL completa de WhatsApp con el mensaje codificado de forma segura.
 * @param {string} customMessage - Mensaje opcional a preconfigurar en el chat.
 */
export const getWhatsAppUrl = (customMessage = '') => {
  const phone = getWhatsAppPhone();
  if (!phone) return null;

  const message = customMessage || getSmartWhatsAppMessage();
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

/**
 * Devuelve el número de teléfono formateado para visualización elegante (ej: +34 649 49 01 40 o 649 49 01 40).
 * Si no está configurada la variable, devuelve "Teléfono no configurado".
 */
export const getPhoneDisplay = (includeCountryCode = false) => {
  const phone = getWhatsAppPhone();
  if (!phone) return "Teléfono no configurado";
  const clean = phone.replace(/[^\d]/g, '');
  if (clean.length === 11 && clean.startsWith('34')) {
    const local = `${clean.slice(2, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)} ${clean.slice(9, 11)}`;
    return includeCountryCode ? `+34 ${local}` : local;
  }
  return phone;
};

/**
 * Devuelve el enlace tel: para llamadas telefónicas, o null si la variable no está configurada.
 */
export const getPhoneTelUrl = () => {
  const phone = getWhatsAppPhone();
  if (!phone) return null;
  const clean = phone.replace(/[^\d+]/g, '');
  return `tel:${clean.startsWith('+') ? clean : '+' + clean}`;
};
