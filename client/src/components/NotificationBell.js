import React, { useState, useEffect, useRef } from 'react';
import { notificationsAPI } from '../services/api';
import './NotificationBell.css';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const response = await notificationsAPI.getAll();
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            await notificationsAPI.markAsRead(id);
            // Optimistic update
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const getIcon = (type) => {
        switch (type) {
            case 'warning': return '⚠️';
            case 'error': return '❌';
            case 'success': return '✅';
            default: return 'ℹ️';
        }
    };

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <div className="notification-bell" onClick={() => setIsOpen(!isOpen)}>
                🔔
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </div>

            {isOpen && (
                <div className="notifications-dropdown">
                    <div className="notifications-header">
                        <h4>Notificaciones</h4>
                        {unreadCount > 0 && (
                            <button className="btn-read-all" onClick={handleMarkAllRead}>
                                Marcar todas leídas
                            </button>
                        )}
                    </div>
                    <div className="notifications-list">
                        {notifications.length === 0 ? (
                            <div className="notification-empty">
                                No tienes notificaciones
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                                    onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                                >
                                    <div className="notification-icon">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="notification-content">
                                        <div className="notification-message">
                                            {notification.message}
                                        </div>
                                        <div className="notification-date">
                                            {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
