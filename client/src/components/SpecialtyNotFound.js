import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from './SEOHead';

/**
 * Slug inexistente en /especialidades/:slug. Contenido real + noindex,
 * nunca un redirect silencioso (evita encubrir un 404 como si la URL
 * fuera válida) y nunca una plantilla vacía.
 */
const SpecialtyNotFound = () => (
  <div className="specialty-not-found">
    <SEOHead
      title="Especialidad no encontrada | Esencialmente Psicología"
      description="La especialidad que buscas no existe o ha cambiado de dirección."
      robots="noindex, follow"
    />
    <div className="container">
      <h1>Especialidad no encontrada</h1>
      <p>La página que buscas no existe o ha cambiado de dirección.</p>
      <Link to="/especialidades" className="btn btn-primary">Ver todas las especialidades</Link>
    </div>
  </div>
);

export default SpecialtyNotFound;
