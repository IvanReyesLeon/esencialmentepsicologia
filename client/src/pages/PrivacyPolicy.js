import React from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy">
      <div className="container">
        <h1>Política de Privacidad</h1>
        <p className="last-updated">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>

        <section>
          <h2>1. Responsable del Tratamiento</h2>
          <p><strong>Razón Social:</strong> Esencialmente Psicología - Anna Becerra</p>
          <p><strong>NIF/CIF:</strong> [Tu NIF/CIF]</p>
          <p><strong>Dirección:</strong> Carrer del Pintor Togores, 1, 08290 Cerdanyola del Vallès, Barcelona</p>
          <p><strong>Email:</strong> info@esencialmentepsicologia.com</p>
          <p><strong>Teléfono:</strong> +34 XXX XXX XXX</p>
        </section>

        <section>
          <h2>2. Finalidades del Tratamiento</h2>
          <p>Los datos personales que recabamos se utilizan para las siguientes finalidades:</p>
          <ul>
            <li>Gestión de citas y prestación de servicios psicológicos</li>
            <li>Comunicaciones relacionadas con el tratamiento</li>
            <li>Facturación y cumplimiento de obligaciones legales</li>
            <li>Envío de información sobre nuestros servicios (previo consentimiento)</li>
            <li>Gestión de consultas a través del formulario de contacto</li>
          </ul>
        </section>

        <section>
          <h2>3. Base Legal</h2>
          <p>Las bases legales para el tratamiento de sus datos son:</p>
          <ul>
            <li><strong>Consentimiento del interesado:</strong> Para el envío de comunicaciones comerciales y tratamiento de datos de salud</li>
            <li><strong>Ejecución de un contrato:</strong> Para la prestación de servicios psicológicos</li>
            <li><strong>Cumplimiento de obligaciones legales:</strong> Para la conservación de historiales clínicos y facturación</li>
            <li><strong>Interés legítimo:</strong> Para la mejora de nuestros servicios</li>
          </ul>
        </section>

        <section>
          <h2>4. Categorías de Datos</h2>
          <p>Tratamos las siguientes categorías de datos:</p>
          <ul>
            <li><strong>Datos identificativos:</strong> Nombre, apellidos, DNI/NIE, dirección, teléfono, email</li>
            <li><strong>Datos de salud:</strong> Historial clínico, diagnósticos, tratamientos (datos especialmente protegidos)</li>
            <li><strong>Datos económicos:</strong> Datos bancarios para la facturación</li>
            <li><strong>Datos de navegación:</strong> Cookies y datos de uso del sitio web (ver Política de Cookies)</li>
          </ul>
        </section>

        <section>
          <h2>5. Destinatarios</h2>
          <p>Sus datos podrán ser comunicados a:</p>
          <ul>
            <li>Administraciones públicas cuando sea requerido por ley</li>
            <li>Entidades bancarias para la gestión de cobros</li>
            <li>Compañías de seguros médicos (con su consentimiento)</li>
            <li>Otros profesionales sanitarios en caso de derivación (con su consentimiento)</li>
          </ul>
          <p>No realizamos transferencias internacionales de datos fuera del Espacio Económico Europeo.</p>
        </section>

        <section>
          <h2>6. Conservación de Datos</h2>
          <ul>
            <li><strong>Historiales clínicos:</strong> Mínimo 5 años desde la última asistencia (Ley 41/2002)</li>
            <li><strong>Datos de facturación:</strong> 4 años (obligaciones fiscales)</li>
            <li><strong>Comunicaciones comerciales:</strong> Hasta que retire su consentimiento</li>
            <li><strong>Cookies:</strong> Según lo especificado en nuestra Política de Cookies</li>
          </ul>
        </section>

        <section>
          <h2>7. Derechos del Interesado</h2>
          <p>Usted tiene derecho a:</p>
          <ul>
            <li><strong>Acceso:</strong> Conocer qué datos tratamos sobre usted</li>
            <li><strong>Rectificación:</strong> Corregir datos inexactos</li>
            <li><strong>Supresión:</strong> Solicitar el borrado de sus datos</li>
            <li><strong>Limitación:</strong> Limitar el tratamiento en determinados casos</li>
            <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado</li>
            <li><strong>Oposición:</strong> Oponerse a determinados tratamientos</li>
            <li><strong>Retirar el consentimiento:</strong> En cualquier momento</li>
          </ul>
          <p>Para ejercer estos derechos, contacte con nosotros en: info@esencialmentepsicologia.com</p>
          <p>También puede presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD).</p>
        </section>

        <section>
          <h2>8. Medidas de Seguridad</h2>
          <p>Implementamos medidas técnicas y organizativas apropiadas para garantizar la seguridad de sus datos, incluyendo:</p>
          <ul>
            <li>Cifrado de datos sensibles</li>
            <li>Control de acceso restringido</li>
            <li>Formación del personal en protección de datos</li>
            <li>Protocolos de actuación ante incidentes de seguridad</li>
            <li>Copias de seguridad periódicas</li>
          </ul>
        </section>

        <section>
          <h2>9. Datos de Menores</h2>
          <p>Para el tratamiento de datos de menores de 14 años, requerimos el consentimiento de padres o tutores legales.</p>
        </section>

        <section>
          <h2>10. Modificaciones</h2>
          <p>Nos reservamos el derecho a modificar esta política de privacidad. Los cambios serán publicados en esta página con la fecha de actualización.</p>
        </section>

        <section>
          <h2>11. Contacto</h2>
          <p>Para cualquier consulta sobre esta política de privacidad o el tratamiento de sus datos, puede contactarnos en:</p>
          <p>Email: info@esencialmentepsicologia.com</p>
          <p>Teléfono: +34 XXX XXX XXX</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
