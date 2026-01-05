import React, { useState, useRef, useEffect } from 'react';
import './UserMenu.css';

const UserMenu = ({ user, onLogout, onProfileClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const toggleMenu = () => setIsOpen(!isOpen);

    const handleOptionClick = (action) => {
        setIsOpen(false);
        action();
    };

    return (
        <div className="user-menu-container" ref={menuRef}>
            {/* Desktop Trigger */}
            <div className="menu-trigger desktop-only" onClick={toggleMenu} title="Menú de Usuario">
                <div className="user-details">
                    <span className="name">{user.role === 'admin' ? 'Admin' : 'Terapeuta'}</span>
                </div>
                <div className="user-avatar">
                    👤
                </div>
            </div>

            {/* Mobile Trigger (Hamburger) */}
            <div className="menu-trigger mobile-only" onClick={toggleMenu}>
                <div className={`hamburger-icon ${isOpen ? 'open' : ''}`}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="user-dropdown">
                    <div className="dropdown-header">
                        <span className="user-email-header">{user.email}</span>
                        <span className="user-role-badge">{user.role === 'admin' ? 'Administrador' : 'Terapeuta'}</span>
                    </div>

                    <div className="divider"></div>

                    <button className="dropdown-item" onClick={() => handleOptionClick(onProfileClick)}>
                        Mi Cuenta
                    </button>

                    <button className="dropdown-item logout" onClick={() => handleOptionClick(onLogout)}>
                        Cerrar Sesión
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
