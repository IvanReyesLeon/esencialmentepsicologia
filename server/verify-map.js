require('dotenv').config();
const { getTherapistMap } = require('./services/calendarService');
const pool = require('./config/db');

async function verify() {
    console.log("🔍 Verificando mapa dinámico...");
    try {
        const map = await getTherapistMap();

        // Buscar 'usertest'
        if (map['usertest']) {
            console.log("✅ ÉXITO: 'usertest' encontrado en el mapa ->", map['usertest']);
        } else {
            console.log("❌ FALLO: 'usertest' NO encontrado.");
            console.log("Claves disponibles:", Object.keys(map).sort());
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        pool.end();
    }
}

verify();
