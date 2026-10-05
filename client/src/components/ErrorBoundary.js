import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    margin: '30px auto',
                    maxWidth: '600px',
                    padding: '30px',
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    textAlign: 'center',
                    fontFamily: 'inherit'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                    <h3 style={{ margin: '0 0 10px', color: '#c92a2a', fontSize: '1.4rem' }}>
                        Ha ocurrido un error al cargar esta sección
                    </h3>
                    <p style={{ color: '#666', lineHeight: 1.5, marginBottom: '24px' }}>
                        Se ha producido un problema inesperado al mostrar estos datos. Puedes intentar recargar la sección o volver al menú.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={this.handleReset}
                            style={{
                                padding: '10px 20px',
                                background: '#1c7ed6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.95rem'
                            }}
                        >
                            🔄 Reintentar
                        </button>
                        {this.props.onBack && (
                            <button
                                onClick={this.props.onBack}
                                style={{
                                    padding: '10px 20px',
                                    background: '#f1f3f5',
                                    color: '#495057',
                                    border: '1px solid #ced4da',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.95rem'
                                }}
                            >
                                ← Volver al Menú
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
