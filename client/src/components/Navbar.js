import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

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
