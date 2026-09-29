import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import specialtiesIndex from '../data/specialties.index.json';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSpecialtiesOpen, setIsSpecialtiesOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  // Catálogo real del centro (catalogVisible), no solo lo que ya esté
  // publicado para SEO: la navbar debe reflejar la oferta completa.
  const navSpecialties = specialtiesIndex
    .filter(s => s.catalogVisible && s.showInNav)
    .sort((a, b) => a.order - b.order);
  const midpoint = Math.ceil(navSpecialties.length / 2);
  const columnOne = navSpecialties.slice(0, midpoint);
  const columnTwo = navSpecialties.slice(midpoint);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsSpecialtiesOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsSpecialtiesOpen(false);
    };
    if (isSpecialtiesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isSpecialtiesOpen]);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/">
            <img
              src="/assets/images/Esencialmente_log.png"
              alt="Esencialmente Psicología"
              className="logo"
            />
          </Link>
        </div>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link
            to="/"
            className={`nav-link ${isActive('/')}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Inicio
          </Link>
          <Link
            to="/servicios"
            className={`nav-link ${isActive('/servicios')}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Servicios
          </Link>
          <div className="nav-item-dropdown" ref={dropdownRef}>
            <button
              type="button"
              className={`nav-link nav-dropdown-toggle ${isActive('/especialidades')}`}
              aria-expanded={isSpecialtiesOpen}
              aria-controls="especialidades-dropdown"
              onClick={() => setIsSpecialtiesOpen(v => !v)}
            >
              Especialidades
            </button>
            {isSpecialtiesOpen && (
              <div id="especialidades-dropdown" className="nav-dropdown-panel">
                <p className="nav-dropdown-heading">Especialidades</p>
                {navSpecialties.length > 0 ? (
                  <div className="nav-dropdown-columns">
                    <ul>
                      {columnOne.map(s => (
                        <li key={s.slug}>
                          <Link to={`/especialidades/${s.slug}`} onClick={() => { setIsSpecialtiesOpen(false); setIsMenuOpen(false); }}>
                            {s.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {columnTwo.length > 0 && (
                      <ul>
                        {columnTwo.map(s => (
                          <li key={s.slug}>
                            <Link to={`/especialidades/${s.slug}`} onClick={() => { setIsSpecialtiesOpen(false); setIsMenuOpen(false); }}>
                              {s.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <p className="nav-dropdown-empty">Próximamente</p>
                )}
                <Link
                  to="/especialidades"
                  className="nav-dropdown-viewall"
                  onClick={() => { setIsSpecialtiesOpen(false); setIsMenuOpen(false); }}
                >
                  Ver todas las especialidades →
                </Link>
              </div>
            )}
          </div>
          <Link
            to="/terapeutas"
            className={`nav-link ${isActive('/terapeutas')}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Terapeutas
          </Link>
          <Link
            to="/talleres"
            className={`nav-link ${isActive('/talleres')}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Talleres
          </Link>
          <Link
            to="/psico-accesible"
            className={`nav-link ${isActive('/psico-accesible')}`}
            onClick={() => setIsMenuOpen(false)}
          >
            PsicoAccesible
          </Link>
          <Link
            to="/blog"
            className={`nav-link ${isActive('/blog')}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Blog
          </Link>
          <Link
            to="/donde-estamos"
            className={`nav-link ${isActive('/donde-estamos')}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Dónde Estamos
          </Link>
          <Link
            to="/contacto"
            className={`nav-link ${isActive('/contacto')}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Contacto
          </Link>
        </div>

        <div className="nav-toggle" onClick={toggleMenu}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
