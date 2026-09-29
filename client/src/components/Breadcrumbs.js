import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Breadcrumb visual + BreadcrumbList JSON-LD desde el mismo array de items,
 * para que nav visual y datos estructurados nunca puedan discrepar.
 *
 * items: [{ name: string, path?: string }] — el último item no lleva path (página actual).
 */
const Breadcrumbs = ({ items }) => (
  <nav className="breadcrumbs" aria-label="Breadcrumb">
    {items.map((item, idx) => (
      <React.Fragment key={idx}>
        {idx > 0 && <span>/</span>}
        {item.path ? <Link to={item.path}>{item.name}</Link> : <span className="current">{item.name}</span>}
      </React.Fragment>
    ))}
  </nav>
);

export const buildBreadcrumbListSchema = (items, siteUrl) => ({
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, idx) => ({
    "@type": "ListItem",
    "position": idx + 1,
    "name": item.name,
    "item": item.path ? `${siteUrl}${item.path}` : undefined
  }))
});

export default Breadcrumbs;
