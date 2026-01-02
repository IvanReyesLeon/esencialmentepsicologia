import React, { useState, useEffect, useCallback } from 'react';
import { expensesAPI, billingAPI } from '../services/api';
import ConfirmModal from './ConfirmModal';
import './ExpensesTab.css';

const ExpensesTab = () => {
    const [activeTab, setActiveTab] = useState('invoices'); // invoices, expenses, config, quarterly
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Data State
    const [expenses, setExpenses] = useState([]);
    const [invoices, setInvoices] = useState([]); // Submitted invoices from therapists
    const [recurringExpenses, setRecurringExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [therapists, setTherapists] = useState([]); // Needed for names in invoice list

    // Modals
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expenseForm, setExpenseForm] = useState({ category: 'alquiler', description: '', amount: '', provider: '', date: '' });
    const [editingId, setEditingId] = useState(null);

    // Generic Modal State
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        isPrompt: false,
        isDanger: false,
        onConfirm: () => { },
        inputPlaceholder: ''
    });

    // Helper: Month Options
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const fetchMonthlyData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Get Expenses
            const expensesRes = await expensesAPI.getAll({ month: selectedMonth + 1, year: selectedYear });
            setExpenses(expensesRes.data);

            // 2. Get Invoices
            try {
                console.log(`Fetching invoices for ${selectedMonth}/${selectedYear}`);
                const invoicesRes = await billingAPI.getSubmissions({ month: selectedMonth, year: selectedYear });
                console.log('Invoices response:', invoicesRes.data);
                setInvoices(invoicesRes.data);
            } catch (error) {
                console.error('Error fetching invoices:', error);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, selectedYear]);

    // Initial Fetch of recurring
    useEffect(() => {
        const fetchRecurring = async () => {
            try {
                const res = await expensesAPI.getRecurring();
                setRecurringExpenses(res.data);
            } catch (err) { console.error(err); }
        };
        fetchRecurring();
    }, []);

    useEffect(() => {
        fetchMonthlyData();
    }, [fetchMonthlyData]);

    // Actions
    const handleCreateExpense = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...expenseForm,
                date: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`
            };

            // 1. Create expense for current month
            await expensesAPI.create(data);

            // 2. If recurring is checked, create recurring template
            if (expenseForm.isRecurring) {
                await expensesAPI.createRecurring({
                    category: expenseForm.category,
                    description: expenseForm.description,
                    amount: expenseForm.amount,
                    provider: expenseForm.provider,
                    active: true
                });
            }

            setShowExpenseModal(false);
            fetchMonthlyData();
            // Reset form
            setExpenseForm({
                category: 'alquiler',
                description: '',
                amount: '',
                provider: '',
                date: '',
                isRecurring: false
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteExpense = (id) => {
        setModalConfig({
            isOpen: true,
            title: 'Eliminar Gasto',
            message: '¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer.',
            isDanger: true,
            onConfirm: async () => {
                await expensesAPI.delete(id);
                fetchMonthlyData();
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleGenerateMonthly = () => {
        setModalConfig({
            isOpen: true,
            title: 'Generar Gastos Fijos',
            message: `¿Quieres importar todos los gastos recurrentes (fijos) a ${months[selectedMonth]}?`,
            onConfirm: async () => {
                try {
                    await expensesAPI.generateMonthly({ month: selectedMonth, year: selectedYear });
                    fetchMonthlyData();
                } catch (err) { console.error(err); }
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleValidateInvoice = (submissionId, therapistId) => {
        setModalConfig({
            isOpen: true,
            title: 'Validar Factura',
            message: '¿Confirmas que esta factura está correcta y lista para pago?',
            confirmText: 'Validar',
            onConfirm: async () => {
                try {
                    await billingAPI.validateInvoice({
                        therapistId,
                        month: selectedMonth,
                        year: selectedYear,
                        validated: true,
                        paymentDate: new Date().toISOString().split('T')[0]
                    });
                    fetchMonthlyData();
                } catch (err) { console.error(err); }
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleRevokeInvoice = (therapistId) => {
        setModalConfig({
            isOpen: true,
            isPrompt: true,
            isDanger: true,
            title: 'Revocar Factura',
            message: 'Por favor, indica el motivo de la revocación. Se enviará una notificación al terapeuta.',
            inputPlaceholder: 'Ej: Falta incluir la sesión extra del día 15...',
            confirmText: 'Revocar',
            onConfirm: async (reason) => {
                try {
                    await billingAPI.revokeInvoice({
                        therapistId,
                        month: selectedMonth,
                        year: selectedYear
                    });
                    fetchMonthlyData();
                } catch (err) { console.error(err); }
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    }


    // Summaries
    const summary = React.useMemo(() => {
        const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0); // Manual expenses (Rent, etc.)
        const totalInvoices = invoices.reduce((sum, item) => sum + Number(item.total_amount), 0); // What we pay to therapists

        // "Ingresos del Centro" comes from the 'center_amount' column in invoices (The % the center keeps)
        // If we want "Gross Income" (Subtotal), we can sum 'subtotal'.
        // But Net Profit is usually: (Center Income from Sessions) - (Fixed Expenses)
        const centerIncome = invoices.reduce((sum, item) => sum + Number(item.center_amount || 0), 0);

        return {
            totalExpenses: totalExpenses,
            totalInvoices: totalInvoices,
            centerIncome: centerIncome,
            totalCombined: totalExpenses + totalInvoices, // Total OUT flow (Expenses + Salaries)
            netProfit: centerIncome - totalExpenses
        };
    }, [expenses, invoices]);

    return (
        <div className="expenses-container">
            <div className="expenses-header">
                <h2>Gestión Económica</h2>
                <div className="expenses-controls">
                    <select
                        className="month-selector"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(Number(e.target.value))}
                    >
                        {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select
                        className="month-selector"
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                    >
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                    </select>
                </div>
            </div>

            <div className="expenses-tabs">
                <button
                    className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
                    onClick={() => setActiveTab('invoices')}
                >
                    📥 Recepción Facturas
                </button>
                <button
                    className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('expenses')}
                >
                    💸 Gastos del Centro
                </button>
                <button
                    className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
                    onClick={() => setActiveTab('config')}
                >
                    ⚙️ Configuración (Fijos)
                </button>
                <button
                    className={`tab-btn ${activeTab === 'quarterly' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quarterly')}
                >
                    📊 Trimestral
                </button>
            </div>

            <div className="tab-content" style={{ marginTop: '20px' }}>

                {/* === TAB: INVOICES === */}
                {activeTab === 'invoices' && (
                    <div className="expenses-table-container">
                        <div className="table-header">
                            <h3>Facturas Presentadas por Terapeutas (Total a pagar: {summary.totalInvoices.toFixed(2)}€)</h3>
                        </div>
                        <table className="expenses-table">
                            <thead>
                                <tr>
                                    <th>Terapeuta</th>
                                    <th>Base</th>
                                    <th>% Centro</th>
                                    <th>Total A Pagar</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(inv => (
                                    <tr key={inv.id} className={`invoice-row ${inv.validated ? 'validated' : 'pending'}`}>
                                        <td style={{ fontWeight: 'bold' }}>{inv.therapist_name}</td>
                                        <td>{Number(inv.subtotal).toFixed(2)} €</td>
                                        <td style={{ color: '#2b8a3e' }}>+{Number(inv.center_amount).toFixed(2)} €</td>
                                        <td className="amount-col">{Number(inv.total_amount).toFixed(2)} €</td>
                                        <td>
                                            {inv.validated ? (
                                                <span className="status-badge badge-validated">PAGADO ({new Date(inv.payment_date).toLocaleDateString()})</span>
                                            ) : (
                                                <span className="status-badge badge-pending">PENDIENTE</span>
                                            )}
                                        </td>
                                        <td className="actions-cell">
                                            {!inv.validated && (
                                                <button className="btn-validate" onClick={() => handleValidateInvoice(inv.id, inv.therapist_id)}>
                                                    ✅ Validar
                                                </button>
                                            )}
                                            <button className="btn-revoke" onClick={() => handleRevokeInvoice(inv.therapist_id)}>
                                                ↩️ Revocar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {invoices.length === 0 && (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No se han presentado facturas para este mes.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}





                {activeTab === 'expenses' && (
                    <div className="tab-pane">
                        <div className="expenses-table-container">
                            <div className="table-header">
                                <h3>Gastos del Centro</h3>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="btn-magic" onClick={handleGenerateMonthly}>
                                        ✨ Generar Fijos
                                    </button>
                                    <button className="btn-primary" onClick={() => setShowExpenseModal(true)}>
                                        + Nuevo Gasto
                                    </button>
                                </div>
                            </div>
                            <table className="expenses-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Concepto</th>
                                        <th>Categoría</th>
                                        <th>Proveedor</th>
                                        <th>Importe</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map(expense => (
                                        <tr key={expense.id}>
                                            <td>{new Date(expense.date).toLocaleDateString()}</td>
                                            <td>{expense.description}</td>
                                            <td><span className={`category-badge cat-${expense.category}`}>{expense.category}</span></td>
                                            <td>{expense.provider}</td>
                                            <td className="amount-col">{Number(expense.amount).toFixed(2)} €</td>
                                            <td className="actions-cell">
                                                <button className="btn-action delete" onClick={() => handleDeleteExpense(expense.id)}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {expenses.length === 0 && (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No hay gastos registrados este mes</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>
                )}

                {activeTab === 'config' && (
                    <div className="tab-pane">
                        <div className="expenses-table-container">
                            <div className="table-header">
                                <h3>Gastos Recurrentes (Plantillas)</h3>
                                <p style={{ fontSize: '0.85rem', color: '#666' }}>Estos gastos se copiarán automáticamente al usar "Generar Fijos".</p>
                            </div>
                            <table className="expenses-table">
                                <thead>
                                    <tr>
                                        <th>Categoría</th>
                                        <th>Concepto</th>
                                        <th>Importe Fijo</th>
                                        <th>Activo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recurringExpenses.map(item => (
                                        <tr key={item.id}>
                                            <td><span className={`category-badge cat-${item.category}`}>{item.category}</span></td>
                                            <td>{item.description}</td>
                                            <td className="amount-col">{Number(item.amount).toFixed(2)} €</td>
                                            <td>{item.active ? '✅' : '❌'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* === TAB: QUARTERLY (REPORT) === */}
                {activeTab === 'quarterly' && (
                    <div className="tab-pane">
                        <div className="expenses-summary-cards">
                            <div className="summary-card expense">
                                <h3>Total Gastos + Facturas</h3>
                                <div className="summary-amount">{summary.totalCombined.toFixed(2)} €</div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                    (Gastos: {summary.totalExpenses.toFixed(2)}€ | Facturas: {summary.totalInvoices.toFixed(2)}€)
                                </div>
                            </div>
                            <div className="summary-card income">
                                <h3>Ingresos Centro</h3>
                                <div className="summary-amount">{summary.centerIncome.toFixed(2)} €</div>
                                <div style={{ fontSize: '0.7rem', color: '#666' }}>
                                    (Comisiones de {invoices.length} facturas)
                                </div>
                            </div>
                            <div className="summary-card profit">
                                <h3>Beneficio Neto</h3>
                                <div className={`summary-amount ${summary.netProfit >= 0 ? 'positive' : 'negative'}`} style={{ color: summary.netProfit >= 0 ? '#1971c2' : '#e03131' }}>
                                    {summary.netProfit.toFixed(2)} €
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '40px', textAlign: 'center', color: '#666' }}>
                            <p>Aquí se generará el reporte trimestral para exportar a Excel.</p>
                            <button className="btn-primary" disabled style={{ opacity: 0.5 }}>📄 Exportar Trimestre (Próximamente)</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Expense Modal */}
            {
                showExpenseModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>Nuevo Gasto</h3>
                            <form onSubmit={handleCreateExpense}>
                                <div className="form-group">
                                    <label>Fecha</label>
                                    <input
                                        type="date"
                                        value={expenseForm.date}
                                        onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Categoría</label>
                                    <select
                                        value={expenseForm.category}
                                        onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                    >
                                        <option value="alquiler">Alquiler</option>
                                        <option value="suministros">Suministros (Luz, Agua, Internet)</option>
                                        <option value="autonomo">Cuota Autónomo</option>
                                        <option value="asesoria">Asesoría/Gestoría</option>
                                        <option value="publicidad">Publicidad/Marketing</option>
                                        <option value="material">Material Oficina</option>
                                        <option value="otros">Otros</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Concepto/Descripción</label>
                                    <input
                                        type="text"
                                        value={expenseForm.description}
                                        onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                        required
                                        placeholder="Ej: Alquiler Enero"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Proveedor (Opcional)</label>
                                    <input
                                        type="text"
                                        value={expenseForm.provider}
                                        onChange={e => setExpenseForm({ ...expenseForm, provider: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Importe (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={expenseForm.amount}
                                        onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group checkbox">
                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px', fontWeight: 'bold', color: '#2b8a3e' }}>
                                        <input
                                            type="checkbox"
                                            checked={expenseForm.isRecurring || false}
                                            onChange={e => setExpenseForm({ ...expenseForm, isRecurring: e.target.checked })}
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                        🔄 Es un gasto fijo mensual (Guardar plantilla)
                                    </label>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setShowExpenseModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn-primary">Guardar Gasto</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            <ConfirmModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                isPrompt={modalConfig.isPrompt}
                isDanger={modalConfig.isDanger}
                confirmText={modalConfig.confirmText}
                inputPlaceholder={modalConfig.inputPlaceholder}
            />

        </div >
    );
};

export default ExpensesTab;
