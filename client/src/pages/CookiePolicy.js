import React from 'react';
import './CookiePolicy.css';

const CookiePolicy = () => {
  return (
    <div className="cookie-policy">
      <div className="container">
        <h1>Política de Cookies</h1>
        <p className="last-updated">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>

        <section>
          <h2>1. ¿Qué son las cookies?</h2>
          <p>
            Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando
            visitas un sitio web. Se utilizan para recordar tus preferencias, mejorar tu experiencia
            de navegación y proporcionar información analítica sobre el uso del sitio.
          </p>
        </section>

        <section>
          <h2>2. Tipos de cookies que utilizamos</h2>

          <div className="cookie-type">
            <h3>🔒 Cookies necesarias (siempre activas)</h3>
            <p>Esenciales para el funcionamiento básico del sitio web. Sin ellas, el sitio no puede funcionar correctamente.</p>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Proveedor</th>
                  <th>Finalidad</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>cookieConsent</td>
                  <td>esencialmentepsicologia.com</td>
                  <td>Almacena las preferencias de cookies del usuario</td>
                  <td>1 año</td>
                </tr>
                <tr>
                  <td>token</td>
                  <td>esencialmentepsicologia.com</td>
                  <td>Autenticación de usuarios administradores</td>
                  <td>Sesión</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="cookie-type">
            <h3>⚙️ Cookies funcionales</h3>
            <p>Permiten funcionalidades mejoradas y personalización, como mapas y vídeos.</p>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Proveedor</th>
                  <th>Finalidad</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>NID, CONSENT</td>
                  <td>Google Maps</td>
                  <td>Mostrar mapas interactivos y recordar preferencias</td>
                  <td>6 meses</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="cookie-type">
            <h3>📊 Cookies analíticas</h3>
            <p>Nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web.</p>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Proveedor</th>
                  <th>Finalidad</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>_ga, _gid</td>
                  <td>Google Analytics</td>
                  <td>Recopilar información anónima sobre el uso del sitio</td>
                  <td>2 años / 24 horas</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="cookie-type">
            <h3>📢 Cookies de marketing</h3>
            <p>Se utilizan para rastrear visitantes en diferentes sitios web con fines publicitarios.</p>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Proveedor</th>
                  <th>Finalidad</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>_fbp</td>
                  <td>Facebook Pixel</td>
                  <td>Publicidad personalizada en Facebook</td>
                  <td>3 meses</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>3. Base legal</h2>
          <p>
            El uso de cookies se basa en tu consentimiento, excepto para las cookies estrictamente
            necesarias, que se basan en nuestro interés legítimo para garantizar el funcionamiento
            técnico del sitio web.
          </p>
        </section>

        <section>
          <h2>4. Cómo gestionar las cookies</h2>

          <h3>En nuestro sitio web</h3>
          <p>
            Puedes gestionar tus preferencias de cookies en cualquier momento haciendo clic en el
            botón "Configuración de cookies" en el pie de página de nuestro sitio web.
          </p>

          <h3>En tu navegador</h3>
          <p>
            También puedes configurar tu navegador para bloquear o eliminar cookies. Aquí tienes
            enlaces a las instrucciones para los navegadores más populares:
          </p>
          <ul>
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
            <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
          </ul>

          <p className="warning">
            ⚠️ Ten en cuenta que bloquear algunas cookies puede afectar tu experiencia en nuestro sitio web.
          </p>
        </section>

        <section>
          <h2>5. Cookies de terceros</h2>
          <p>
            Algunos servicios de terceros que utilizamos pueden establecer sus propias cookies.
            No tenemos control sobre estas cookies y te recomendamos que consultes las políticas
            de privacidad de estos servicios:
          </p>
          <ul>
            <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google (Maps y Analytics)</a></li>
            <li><a href="https://www.facebook.com/policy/cookies/" target="_blank" rel="noopener noreferrer">Facebook</a></li>
          </ul>
        </section>

        <section>
          <h2>6. Actualizaciones de esta política</h2>
          <p>
            Podemos actualizar esta política de cookies ocasionalmente. Te notificaremos sobre
            cambios significativos publicando la nueva política en esta página con una nueva
            fecha de "última actualización".
          </p>
        </section>

        <section>
          <h2>7. Contacto</h2>
          <p>
            Si tienes preguntas sobre nuestra política de cookies, puedes contactarnos en:
          </p>
          <p>Email: info@esencialmentepsicologia.com</p>
          <p>Teléfono: +34 649 49 01 40</p>
        </section>

        <div className="cookie-settings-cta">
          <button
            className="btn-cookie-settings"
            onClick={() => {
              // Trigger cookie consent banner to show
              localStorage.removeItem('cookieConsent');
              window.location.reload();
            }}
          >
            ⚙️ Configurar mis preferencias de cookies
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
