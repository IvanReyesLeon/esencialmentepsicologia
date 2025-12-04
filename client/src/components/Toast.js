import React, { useEffect } from 'react';

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast-notification ${type || ''}`}>
            <span className="toast-icon">{type === 'error' ? '❌' : '✅'}</span>
            <span className="toast-message">{message}</span>
        </div>
    );
};

export default Toast;
