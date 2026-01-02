import React, { useState, useEffect, useRef } from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isPrompt = false,
    inputPlaceholder = '',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isDanger = false
}) => {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && isPrompt) {
            setInputValue('');
            // Focus input after animation
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, isPrompt]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (isPrompt && !inputValue.trim()) return; // Don't submit empty
        onConfirm(isPrompt ? inputValue : undefined);
    };

    return (
        <div className="custom-modal-overlay" onClick={onClose}>
            <div className="custom-modal-content" onClick={e => e.stopPropagation()}>
                <div className="custom-modal-header">
                    <h3>{title}</h3>
                </div>
                <div className="custom-modal-body">
                    <p>{message}</p>
                    {isPrompt && (
                        <input
                            ref={inputRef}
                            type="text"
                            className="custom-modal-input"
                            placeholder={inputPlaceholder}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                        />
                    )}
                </div>
                <div className="custom-modal-actions">
                    <button className="btn-modal btn-modal-cancel" onClick={onClose}>
                        {cancelText}
                    </button>
                    <button
                        className={`btn-modal ${isDanger ? 'btn-modal-danger' : 'btn-modal-confirm'}`}
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
