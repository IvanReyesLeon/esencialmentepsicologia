import React, { useState, useEffect } from 'react';
import { pricingAPI } from '../services/api';
import Toast from '../components/Toast';

const NEW_SERVICE_VALUE = '__new__';

const emptyForm = () => ({ name: '', price: '', duration: '', description: '', is_active: true });

const PricingTab = ({ pricing, onRefresh }) => {
    const [editing, setEditing] = useState({});
    const [toast, setToast] = useState(null);
    const [localPricing, setLocalPricing] = useState([]);
    const [addForm, setAddForm] = useState(null); // { servicio, newServiceName } o null si cerrado
    const [newData, setNewData] = useState(emptyForm());

    useEffect(() => {
        setLocalPricing(pricing);
    }, [pricing]);

    // Agrupar dinámicamente por servicio (session_type). Nada de arrays fijos:
    // cualquier servicio que exista en BD (incluidos los creados desde ADMIN) aparece aquí.
    const groupsMap = {};
    localPricing.forEach(item => {
        const key = item.session_type_id;
        if (!groupsMap[key]) {
            groupsMap[key] = {
                sessionTypeId: item.session_type_id,
                sessionTypeName: item.session_type_name,
                displayName: item.session_type_display_name,
                items: []
            };
        }
        groupsMap[key].items.push(item);
    });
    // Orden estable: por el id más antiguo del grupo (preserva el orden histórico y añade los nuevos al final)
    const groups = Object.values(groupsMap).sort((a, b) => {
        const minA = Math.min(...a.items.map(i => i.id));
        const minB = Math.min(...b.items.map(i => i.id));
        return minA - minB;
    });

    const serviceOptions = groups.map(g => ({ value: g.sessionTypeName, label: g.displayName }));

    const openAddForm = (servicio = NEW_SERVICE_VALUE) => {
        setAddForm({ servicio });
        setNewData(emptyForm());
    };

    const closeAddForm = () => {
        setAddForm(null);
        setNewData(emptyForm());
    };

    const handleEdit = (priceItem) => {
        setEditing({
            ...editing,
            [priceItem.id]: {
                name: priceItem.name || '',
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
            setToast({ message: '✓ Tarifa actualizada correctamente', type: 'success' });
        } catch (error) {
            setToast({
                message: error.response?.data?.message || 'Error al actualizar la tarifa',
                type: 'error'
            });
        }
    };

    const handleCreate = async () => {
        if (!newData.name || !newData.price || !newData.duration) {
            setToast({ message: 'Nombre, precio y duración son obligatorios', type: 'error' });
            return;
        }

        const isNewService = addForm.servicio === NEW_SERVICE_VALUE;

        try {
            await pricingAPI.create({
                ...(isNewService
                    ? { new_service_name: newData.name }
                    : { session_type: addForm.servicio }),
                name: newData.name,
                price: newData.price,
                duration: newData.duration,
                description: newData.description,
                is_active: newData.is_active
            });
            await onRefresh();
            closeAddForm();
            setToast({ message: '✓ Tarifa creada correctamente', type: 'success' });
        } catch (error) {
            setToast({
                message: error.response?.data?.message || 'Error al crear la tarifa',
                type: 'error'
            });
        }
    };

    const handleDelete = async (priceItem) => {
        const message = priceItem.is_active
            ? '¿Quieres desactivar y archivar esta tarifa? Dejará de verse en la web pública.'
            : '¿Quieres eliminar definitivamente esta tarifa del historial? Esta acción es permanente y no se puede deshacer.';

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

            setLocalPricing(prev => prev.map(p =>
                p.id === priceItem.id ? { ...p, is_active: newActiveState } : p
            ));

            await pricingAPI.update(priceItem.id, { is_active: newActiveState });
            await onRefresh();

            setToast({
                message: `✓ Tarifa ${newActiveState ? 'activada' : 'desactivada'}`,
                type: 'success'
            });
        } catch (error) {
            console.error('Error toggling visibility:', error);
            setLocalPricing(pricing);
            setToast({
                message: error.response?.data?.message || 'Error al cambiar visibilidad',
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

    const renderAddForm = () => (
        <div className="pricing-form new-item-form" style={{
            padding: '1.5rem',
            background: '#fff0f5',
            borderRadius: '8px',
            border: '2px solid #E91E63',
            marginTop: '1rem',
            marginBottom: '1.5rem'
        }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#E91E63' }}>Nueva tarifa</h4>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Servicio</label>
                <select
                    value={addForm.servicio}
                    onChange={(e) => setAddForm({ ...addForm, servicio: e.target.value })}
                    style={{ padding: '0.5rem', width: '100%' }}
                >
                    <option value={NEW_SERVICE_VALUE}>➕ Nuevo servicio</option>
                    {serviceOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Nombre</label>
                <input
                    type="text"
                    value={newData.name}
                    onChange={(e) => setNewData({ ...newData, name: e.target.value })}
                    placeholder="Ej: Sesión de terapia EMDR"
                />
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Precio (€)</label>
                    <input
                        type="number"
                        value={newData.price}
                        onChange={(e) => setNewData({ ...newData, price: e.target.value })}
                        placeholder="70"
                    />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Duración (min)</label>
                    <input
                        type="number"
                        value={newData.duration}
                        onChange={(e) => setNewData({ ...newData, duration: e.target.value })}
                        placeholder="75"
                    />
                </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Descripción</label>
                <textarea
                    value={newData.description}
                    onChange={(e) => setNewData({ ...newData, description: e.target.value })}
                    rows="2"
                    placeholder="Descripción de esta tarifa"
                />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={newData.is_active}
                        onChange={(e) => setNewData({ ...newData, is_active: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                </label>
                <span className="toggle-label" style={{ fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                    {newData.is_active ? 'Visible en web' : 'Oculto'}
                </span>
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-small" onClick={handleCreate}>
                    ✓ Crear tarifa
                </button>
                <button className="btn btn-secondary btn-small" onClick={closeAddForm}>
                    Cancelar
                </button>
            </div>
        </div>
    );

    return (
        <div className="tab-content">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="tab-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>💰 Gestión de Precios</h2>
                {!addForm && (
                    <button className="btn btn-primary" onClick={() => openAddForm(NEW_SERVICE_VALUE)}>
                        + Añadir servicio / tarifa
                    </button>
                )}
            </div>

            {addForm && renderAddForm()}

            <div className="pricing-list">
                {groups.map(group => (
                    <div key={group.sessionTypeId} className="pricing-card">
                        <div className="pricing-header">
                            <h3>{group.displayName}</h3>
                            {!addForm && (
                                <button
                                    className="btn btn-primary btn-small"
                                    onClick={() => openAddForm(group.sessionTypeName)}
                                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                >
                                    + Añadir tarifa
                                </button>
                            )}
                        </div>

                        <div className="pricing-items" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {group.items.map((priceItem) => {
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
                                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                                    <label style={{ fontSize: '0.8rem' }}>Nombre</label>
                                                    <input
                                                        type="text"
                                                        value={editData.name || ''}
                                                        onChange={(e) => updateField(priceItem.id, 'name', e.target.value)}
                                                        style={{ padding: '0.5rem', width: '100%' }}
                                                    />
                                                </div>
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
                                                    <div className="pricing-name" style={{ fontWeight: 'bold' }}>{priceItem.name || group.displayName}</div>
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
                        </div>
                    </div>
                ))}

                {groups.length === 0 && !addForm && (
                    <div className="pricing-empty">
                        <p>No hay tarifas configuradas aún</p>
                        <button className="btn btn-small" onClick={() => openAddForm(NEW_SERVICE_VALUE)}>+ Añadir servicio / tarifa</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PricingTab;
