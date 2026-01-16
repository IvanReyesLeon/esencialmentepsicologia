const { Pool } = require('pg');

// Configuración del pool de conexiones a PostgreSQL (Neon)
const pool = new Pool({
    connectionString: process.env.DATABASE || process.env.DATABASE_URL,
    ssl: (process.env.DATABASE || process.env.DATABASE_URL)?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
    max: 20, // Máximo de conexiones en el pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// Event handlers para debug
pool.on('connect', () => {
    console.log('New client connected to PostgreSQL');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    // Don't exit - let the pool recover automatically from connection issues
});

// Función helper para ejecutar queries
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        if (process.env.NODE_ENV !== 'production') {
            console.log('Executed query', { text, duration, rows: res.rowCount });
        }
        return res;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

// Función para obtener un cliente del pool (para transacciones)
const getClient = async () => {
    const client = await pool.connect();
    const query = client.query;
    const release = client.release;

    // Monkeypatching para timeout
    const timeout = setTimeout(() => {
        console.error('A client has been checked out for more than 5 seconds!');
    }, 5000);

    client.release = () => {
        clearTimeout(timeout);
        client.query = query;
        client.release = release;
        return release.apply(client);
    };

    return client;
};

module.exports = {
    pool,
    query,
    getClient
};
