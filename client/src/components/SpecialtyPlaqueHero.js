import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import specialtiesIndex from '../data/specialties.index.json';

// Pequeñas variaciones de dirección de entrada (sutiles, no exageradas).
const ENTRY_OFFSETS = [
  { x: 0, y: 10 },   // desde abajo
  { x: -8, y: 4 },   // desde la izquierda
  { x: 8, y: 4 },    // desde la derecha
];

/**
 * Reinterpretación digital de la placa física del centro: TODAS las
 * especialidades del catálogo (catalogVisible), no solo las publicadas
 * para SEO — la placa representa la oferta real, "published" solo
 * controla indexabilidad de la página individual, no su existencia.
 * - Texto HTML real (cada palabra es un <Link>), nunca canvas/imagen.
 * - Progressive enhancement: sin JS, la placa se ve completa (ver CSS).
 * - Las palabras vienen del SSOT, nunca hardcodeadas.
 *
 * mode="hub": todas las palabras son enlaces, animación estándar (hub).
 * mode="specialty" + currentSlug: la especialidad actual se muestra como
 * texto destacado (no enlace a sí misma, aria-current="page"), el resto
 * sigue siendo navegable; animación algo más breve.
 */
const SpecialtyPlaqueHero = ({ mode = 'hub', currentSlug = null }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const words = specialtiesIndex
    .filter(s => s.catalogVisible && s.showInPlaque)
    .sort((a, b) => a.order - b.order);

  if (words.length === 0) return null;

  const isCompact = mode === 'specialty';
  const baseDelay = isCompact ? 50 : 80;
  const stepDelay = isCompact ? 42 : 60;

  return (
    <div
      className={`specialty-plaque animate-ready${mounted ? ' is-mounted' : ''}${isCompact ? ' is-compact' : ''}`}
      aria-label="Especialidades de Esencialmente Psicología"
    >
      <div className="specialty-plaque-frame">
        {words.map((s, idx) => {
          const offset = ENTRY_OFFSETS[idx % ENTRY_OFFSETS.length];
          const isCurrent = isCompact && s.slug === currentSlug;
          const style = {
            transitionDelay: `${baseDelay + idx * stepDelay}ms`,
            '--enter-x': `${offset.x}px`,
            '--enter-y': `${offset.y}px`
          };
          const dataProps = {
            'data-weight': s.plaqueWeight,
            'data-long': s.name.length > 16 ? 'true' : undefined
          };

          if (isCurrent) {
            return (
              <span
                key={s.slug}
                className="specialty-plaque-word is-current"
                aria-current="page"
                style={style}
                {...dataProps}
              >
                {s.name}
              </span>
            );
          }

          return (
            <Link
              key={s.slug}
              to={`/especialidades/${s.slug}`}
              className="specialty-plaque-word"
              style={style}
              {...dataProps}
            >
              {s.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default SpecialtyPlaqueHero;
