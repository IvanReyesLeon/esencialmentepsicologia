import React, { useState, useEffect } from 'react';
import { billingAPI } from '../services/api';
import './BillingTab.css'; // We'll create this css or inline it for now

const BillingTab = ({ user, calendarId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [targetCalendarId, setTargetCalendarId] = useState(calendarId || 'esencialmentepsicologia@gmail.com');

    // Hardcoded iframe for now based on user input, could be dynamic
    const calendarEmbedUrl = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(targetCalendarId)}&ctz=Europe%2FMadrid`;

    useEffect(() => {
        fetchBillingData();
    }, [user, targetCalendarId]);

    const fetchBillingData = async () => {
        try {
            setLoading(true);
            setError(null);
            let response;

            if (user.role === 'admin') {
                response = await billingAPI.getGlobal(targetCalendarId);
            } else {
                response = await billingAPI.getMe(targetCalendarId);
            }

            setData(response.data);
        } catch (err) {
            console.error('Error fetching billing:', err);
            setError('Error al cargar datos de facturación');
        } finally {
            setLoading(false);
        }
    };

    const renderAdminTable = () => (
        <table className="billing-table">
            <thead>
                <tr>
                    <th>Terapeuta</th>
                    <th>Color ID</th>
                    <th>Horas Semanales</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                {data?.report?.map((item) => (
                    <tr key={item.therapistId}>
                        <td>{item.name}</td>
                        <td>
                            <span className="color-badge" style={{ backgroundColor: getColorHex(item.colorId) }}>
                                {item.colorId}
                            </span>
                        </td>
                        <td><strong>{item.hours.toFixed(1)} h</strong></td>
                        <td>
                            <span className="status-badge pending">Pendiente</span>
                        </td>
                    </tr>
                ))}
                {(!data?.report || data.report.length === 0) && (
                    <tr><td colSpan="4">No hay datos esta semana</td></tr>
                )}
            </tbody>
            <tfoot>
                <tr>
                    <td colSpan="2"><strong>Total Global</strong></td>
                    <td colSpan="2"><strong>{data?.period?.totalHours?.toFixed(1) || 0} h</strong></td>
                </tr>
            </tfoot>
        </table>
    );

    const renderTherapistView = () => (
        <div className="therapist-billing-card">
            <h3>Tu Resumen Semanal</h3>
            <div className="billing-stat-big">
                {data?.hours?.toFixed(1) || 0}
                <span>horas</span>
            </div>
            <p className="billing-period">
                {data?.period?.start && new Date(data.period.start).toLocaleDateString()} -
                {data?.period?.end && new Date(data.period.end).toLocaleDateString()}
            </p>
        </div>
    );

    // Helper just for visual reference (Google Calendar default palette approximation)
    const getColorHex = (id) => {
        const colors = {
            '1': '#7986cb', '2': '#33b679', '3': '#8e24aa', '4': '#e67c73', '5': '#f6c026',
            '6': '#f4511e', '7': '#039be5', '8': '#616161', '9': '#3f51b5', '10': '#0b8043', '11': '#d50000'
        };
        return colors[id] || '#ccc';
    };

    return (
        <div className="billing-tab">
            <h2>📅 Facturación y Horas</h2>

            {/* Calendar View */}
            <div className="calendar-container">
                <iframe
                    src={calendarEmbedUrl}
                    style={{ border: 0, width: '100%', height: '600px' }}
                    frameBorder="0"
                    scrolling="no"
                    title="Google Calendar"
                ></iframe>
            </div>

            <div className="billing-actions">
                <button onClick={fetchBillingData} className="btn btn-primary" disabled={loading}>
                    {loading ? 'Calculando...' : '🔄 Recalcular Horas'}
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="billing-results">
                {user.role === 'admin' ? renderAdminTable() : renderTherapistView()}
            </div>

            {user.role === 'admin' && data?.rawTotals && (
                <details className="debug-details">
                    <summary>Ver Totales Crudos (Debug)</summary>
                    <pre>{JSON.stringify(data.rawTotals, null, 2)}</pre>
                </details>
            )}
        </div>
    );
};

export default BillingTab;
