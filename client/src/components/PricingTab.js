import React, { useState, useEffect } from 'react';
import { pricingAPI } from '../services/api';
import Toast from '../components/Toast';

const PricingTab = ({ pricing, onRefresh }) => {
    const [editing, setEditing] = useState({});
    const [toast, setToast] = useState(null);
    const [localPricing, setLocalPricing] = useState([]);
    const [isAdding, setIsAdding] = useState(null); // typeKey
    const [newData, setNewData] = useState({ price: '', duration: '', description: '' });

    // Sincronizar estado local con props
    useEffect(() => {
        setLocalPricing(pricing);
    }, [pricing]);

    const sessionTypes = [
        { name: 'Individual', key: 'individual' },
        { name: 'Pareja', key: 'couple' },
        { name: 'Familiar', key: 'family' },
        { name: 'Grupal', key: 'group' }
    ];

    const handleEdit = (priceItem) => {
        setEditing({
            ...editing,
            [priceItem.id]: {
                price: priceItem.price,
                duration: priceItem.duration,
                description: priceItem.description || '',
                is_active: priceItem.is_active
            }
        });
    };

    const handleCancel = (id) => {
        const newEditing = { ...editing };
        delete newEditing[id];
        setEditing(newEditing);
    };

    const handleSave = async (priceItem) => {
        try {
            const updates = editing[priceItem.id];
            await pricingAPI.update(priceItem.id, updates);
            await onRefresh();
            handleCancel(priceItem.id);
            setToast({
                message: '✓ Precio actualizado correctamente',
                type: 'success'
            });
        } catch (error) {
            setToast({
                message: error.response?.data?.message || 'Error al actualizar precio',
                type: 'error'
            });
        }
    };

    const handleCreate = async (typeKey) => {
        if (!newData.price || !newData.duration) {
            setToast({ message: 'Precio y duración son obligatorios', type: 'error' });
            return;
        }

        try {
            await pricingAPI.create({
                session_type: typeKey,
                ...newData
            });
            await onRefresh();
            setIsAdding(null);
            setNewData({ price: '', duration: '', description: '' });
            setToast({ message: '✓ Nueva variante añadida correctamente', type: 'success' });
        } catch (error) {
            setToast({
                message: error.response?.data?.message || 'Error al crear variante',
                type: 'error'
            });
        }
    };

    const handleDelete = async (priceItem) => {
        const message = priceItem.is_active 
            ? '¿Quieres desactivar y archivar esta variante de precio? Dejará de verse en la web pública.'
            : '¿Quieres eliminar definitivamente esta variante de precio del historial? Esta acción es permanente y no se puede deshacer.';

        if (window.confirm(message)) {
            try {
                const response = await pricingAPI.delete(priceItem.id);
                await onRefresh();
                setToast({ message: `✓ ${response.data.message || 'Operación completada'}`, type: 'success' });
            } catch (error) {
                setToast({ message: 'Error al procesar la eliminación', type: 'error' });
            }
        }
    };

    const toggleVisibility = async (priceItem) => {
        try {
            const newActiveState = !priceItem.is_active;

            // Actualizar estado local inmediatamente para feedback visual
            setLocalPricing(prev => prev.map(p =>
                p.id === priceItem.id ? { ...p, is_active: newActiveState } : p
            ));

            // Actualizar en el servidor
            await pricingAPI.update(priceItem.id, { is_active: newActiveState });

            // Refrescar datos del servidor
            await onRefresh();

            setToast({
                message: `✓ Precio ${newActiveState ? 'activado' : 'desactivado'}`,
                type: 'success'
            });
        } catch (error) {
            console.error('Error toggling visibility:', error);
            // Revertir cambio local en caso de error
            setLocalPricing(pricing);
            setToast({
                message: 'Error al cambiar visibilidad',
                type: 'error'
            });
        }
    };

    const updateField = (id, field, value) => {
        setEditing({
            ...editing,
            [id]: {
                ...editing[id],
                [field]: value
            }
        });
    };

    return (
        <div className="tab-content">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="tab-header">
                <h2>💰 Gestión de Precios</h2>
            </div>

            <div className="pricing-list">
                {sessionTypes.map(type => {
                    const items = localPricing.filter(p => p.session_type_name === type.key);
                    const activeCount = items.filter(p => p.is_active).length;
                    const canAdd = (type.key === 'couple' && activeCount < 2) || (type.key !== 'couple' && activeCount === 0);

                    return (
                        <div key={type.key} className="pricing-card">
                            <div className="pricing-header">
                                <h3>{type.name}</h3>
                                {canAdd && !isAdding && (
                                    <button 
                                        className="btn btn-primary btn-small" 
                                        onClick={() => setIsAdding(type.key)}
                                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                    >
                                        {activeCount === 0 ? '+ Configurar' : '+ Añadir duración'}
                                    </button>
                                )}
                            </div>

                            <div className="pricing-items" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {items.map((priceItem, index) => {
                                    const isEditing = editing[priceItem.id];
                                    const editData = isEditing ? editing[priceItem.id] : {};

                                    return (
                                        <div key={priceItem.id} className="pricing-item-row" style={{ 
                                            padding: '1rem', 
                                            background: priceItem.is_active ? '#f8f9fa' : '#f1f1f1', 
                                            borderRadius: '8px',
                                            border: priceItem.is_active ? '1px solid #eee' : '1px solid #ddd',
                                            position: 'relative',
                                            opacity: priceItem.is_active ? 1 : 0.7
                                        }}>
                                            {items.filter(p => p.is_active).length > 1 && priceItem.is_active && (
                                                <span style={{ 
                                                    position: 'absolute', 
                                                    top: '-10px', 
                                                    right: '10px', 
                                                    background: '#E91E63', 
                                                    color: 'white', 
                                                    fontSize: '0.7rem', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '10px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    Opción {items.filter(p => p.is_active && p.duration <= priceItem.duration).length}
                                                </span>
                                            )}
                                            {!priceItem.is_active && (
                                                <span style={{ 
                                                    position: 'absolute', 
                                                    top: '-10px', 
                                                    right: '10px', 
                                                    background: '#6c757d', 
                                                    color: 'white', 
                                                    fontSize: '0.7rem', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '10px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    Archivado
                                                </span>
                                            )}

                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <div className="pricing-actions">
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={priceItem.is_active}
                                                            onChange={() => toggleVisibility(priceItem)}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                    <span className="toggle-label" style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                                                        {priceItem.is_active ? 'Visible en web' : 'Oculto'}
                                                    </span>
                                                </div>
                                                <button 
                                                    className="btn-text" 
                                                    onClick={() => handleDelete(priceItem)}
                                                    style={{ color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                                >
                                                    {priceItem.is_active ? 'Desactivar y Archivar' : 'Eliminar del historial'}
                                                </button>
                                            </div>

                                            {isEditing ? (
                                                <div className="pricing-form">
                                                    <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                                            <label style={{ fontSize: '0.8rem' }}>Precio (€)</label>
                                                            <input
                                                                type="number"
                                                                value={editData.price || ''}
                                                                onChange={(e) => updateField(priceItem.id, 'price', e.target.value)}
                                                                style={{ padding: '0.5rem' }}
                                                            />
                                                        </div>
                                                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                                            <label style={{ fontSize: '0.8rem' }}>Duración (min)</label>
                                                            <input
                                                                type="number"
                                                                value={editData.duration || ''}
                                                                onChange={(e) => updateField(priceItem.id, 'duration', e.target.value)}
                                                                style={{ padding: '0.5rem' }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="form-group">
                                                        <label style={{ fontSize: '0.8rem' }}>Descripción</label>
                                                        <textarea
                                                            value={editData.description || ''}
                                                            onChange={(e) => updateField(priceItem.id, 'description', e.target.value)}
                                                            rows="2"
                                                            style={{ padding: '0.5rem', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
                                                        />
                                                    </div>
                                                    <div className="form-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button className="btn btn-primary btn-small" onClick={() => handleSave(priceItem)}>
                                                            ✓ Guardar
                                                        </button>
                                                        <button className="btn btn-secondary btn-small" onClick={() => handleCancel(priceItem.id)}>
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="pricing-display" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div className="pricing-info">
                                                        <div className="pricing-price" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{priceItem.price}€</div>
                                                        <div className="pricing-duration" style={{ color: '#666' }}>{priceItem.duration} minutos</div>
                                                        {priceItem.description && (
                                                            <p className="pricing-description" style={{ fontSize: '0.85rem', margin: '0.5rem 0' }}>{priceItem.description}</p>
                                                        )}
                                                    </div>
                                                    <button className="btn btn-small btn-secondary" onClick={() => handleEdit(priceItem)}>
                                                        ✏️ Editar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {items.length === 0 && !isAdding && (
                                    <div className="pricing-empty">
                                        <p>No configurado aún</p>
                                        <button className="btn btn-small" onClick={() => setIsAdding(type.key)}>+ Configurar</button>
                                    </div>
                                )}

                                {isAdding === type.key && (
                                    <div className="pricing-form new-item-form" style={{ 
                                        padding: '1.5rem', 
                                        background: '#fff0f5', 
                                        borderRadius: '8px', 
                                        border: '2px solid #E91E63',
                                        marginTop: '1rem'
                                    }}>
                                        <h4 style={{ margin: '0 0 1rem 0', color: '#E91E63' }}>Nueva variante para {type.name}</h4>
                                        <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                            <div className="form-group" style={{ flex: 1 }}>
                                                <label>Precio (€)</label>
                                                <input
                                                    type="number"
                                                    value={newData.price}
                                                    onChange={(e) => setNewData({ ...newData, price: e.target.value })}
                                                    placeholder="75"
                                                />
                                            </div>
                                            <div className="form-group" style={{ flex: 1 }}>
                                                <label>Duración (min)</label>
                                                <input
                                                    type="number"
                                                    value={newData.duration}
                                                    onChange={(e) => setNewData({ ...newData, duration: e.target.value })}
                                                    placeholder="90"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Descripción</label>
                                            <textarea
                                                value={newData.description}
                                                onChange={(e) => setNewData({ ...newData, description: e.target.value })}
                                                rows="2"
                                                placeholder="Descripción de esta duración"
                                            />
                                        </div>
                                        <div className="form-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-primary btn-small" onClick={() => handleCreate(type.key)}>
                                                ✓ Crear Opción
                                            </button>
                                            <button className="btn btn-secondary btn-small" onClick={() => setIsAdding(null)}>
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PricingTab;
