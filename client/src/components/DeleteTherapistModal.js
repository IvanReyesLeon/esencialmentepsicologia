import React, { useState, useEffect } from 'react';
import { therapistAPI, API_ROOT } from '../services/api';
import './AddTherapistModal.css'; // Reuse existing modal styles

const DeleteTherapistModal = ({ isOpen, onClose, onSuccess }) => {
    const [therapists, setTherapists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteDialog, setDeleteDialog] = useState({ show: false, therapist: null });

    // Fetch therapists with accounts when modal opens
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            therapistAPI.getWithAccount()
                .then(res => setTherapists(res.data))
                .catch(err => {
                    console.error('Error fetching therapists:', err);
                    setError('Error al cargar terapeutas');
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    const handleDeleteClick = (therapist) => {
        setDeleteDialog({ show: true, therapist });
    };

    const handleDeleteConfirm = async (deleteType) => {
        const { therapist } = deleteDialog;
        if (!therapist) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (deleteType === 'account') {
                // Only delete account, keep therapist public
                await therapistAPI.deleteAccount(therapist.id);
                setSuccess(`✅ Cuenta de ${therapist.full_name} eliminada (sigue en web pública)`);
            } else {
                // Delete completely
                await therapistAPI.deleteCompletely(therapist.id);
                setSuccess(`✅ ${therapist.full_name} eliminado completamente`);
            }

            // Refresh list
            const res = await therapistAPI.getWithAccount();
            setTherapists(res.data);
            setDeleteDialog({ show: false, therapist: null });

            // Notify parent after short delay
            setTimeout(() => {
                onSuccess?.();
            }, 1500);

        } catch (err) {
            console.error('Error:', err);
            setError(err.response?.data?.message || 'Error al eliminar');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError('');
        setSuccess('');
        setDeleteDialog({ show: false, therapist: null });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content add-therapist-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2>🗑️ Eliminar terapeuta del sistema de facturación</h2>
                    <button className="modal-close" onClick={handleClose}>×</button>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {loading && !deleteDialog.show ? (
                    <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Cargando terapeutas...</p>
                ) : therapists.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                        No hay terapeutas con cuenta de facturación
                    </p>
                ) : (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {therapists.map(t => (
                            <div
                                key={t.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '1rem',
                                    borderBottom: '1px solid #eee',
                                    gap: '1rem'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                    {t.photo ? (
                                        <img
                                            src={
                                                t.photo.startsWith('http')
                                                    ? t.photo
                                                    : t.photo.includes('/uploads')
                                                        ? `${API_ROOT}${t.photo}`
                                                        : `${API_ROOT}/uploads/terapeutas/${t.photo}`
                                            }
                                            alt={t.full_name}
                                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: '#e0e0e0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            color: '#666'
                                        }}>
                                            {t.full_name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <strong>{t.full_name}</strong>
                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                            {t.is_active ? '🌐 En web pública' : '👁️‍🗨️ Solo facturación'}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-danger btn-small"
                                    onClick={() => handleDeleteClick(t)}
                                    disabled={loading}
                                >
                                    Eliminar
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Delete Confirmation Dialog */}
                {deleteDialog.show && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '12px'
                        }}
                        onClick={() => setDeleteDialog({ show: false, therapist: null })}
                    >
                        <div
                            style={{
                                backgroundColor: 'white',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                maxWidth: '400px',
                                margin: '1rem'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 style={{ marginBottom: '1rem' }}>Eliminar {deleteDialog.therapist?.full_name}</h3>

                            {deleteDialog.therapist?.is_active ? (
                                <>
                                    <p style={{ marginBottom: '1rem', color: '#666' }}>
                                        Este terapeuta está visible en la web pública. ¿Qué quieres hacer?
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => handleDeleteConfirm('account')}
                                            disabled={loading}
                                            style={{ textAlign: 'left', padding: '1rem' }}
                                        >
                                            💳 <strong>Solo eliminar cuenta de facturación</strong>
                                            <br /><small style={{ color: '#666' }}>Sigue visible en la web</small>
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleDeleteConfirm('complete')}
                                            disabled={loading}
                                            style={{ textAlign: 'left', padding: '1rem' }}
                                        >
                                            ⚠️ <strong>Eliminar completamente</strong>
                                            <br /><small>Facturación + web pública</small>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p style={{ marginBottom: '1.5rem', color: '#666' }}>
                                        Este terapeuta solo está en facturación. ¿Seguro que quieres eliminarlo?
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => setDeleteDialog({ show: false, therapist: null })}
                                            disabled={loading}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleDeleteConfirm('complete')}
                                            disabled={loading}
                                        >
                                            {loading ? 'Eliminando...' : 'Sí, eliminar'}
                                        </button>
                                    </div>
                                </>
                            )}

                            <button
                                style={{ marginTop: '1rem', width: '100%' }}
                                className="btn btn-link"
                                onClick={() => setDeleteDialog({ show: false, therapist: null })}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={handleClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteTherapistModal;
