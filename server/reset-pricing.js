// Script para activar y crear todos los precios necesarios
const { query } = require('./config/db');

async function resetPricing() {
    try {
        console.log('Activando todos los precios existentes...');
        await query('UPDATE pricing SET is_active = true');

        console.log('Verificando precios...');
        const result = await query(`
      SELECT 
        st.id, st.name, st.display_name,
        p.id as price_id, p.is_active
      FROM session_types st
      LEFT JOIN pricing p ON p.session_type_id = st.id
    `);

        console.log('Estado de precios:');
        result.rows.forEach(row => {
            console.log(`- ${row.display_name}: ${row.price_id ? `ID ${row.price_id}, activo=${row.is_active}` : 'NO CONFIGURADO'}`);
        });

        // Crear precios para los tipos faltantes
        const missingTypes = result.rows.filter(r => !r.price_id);
        for (const type of missingTypes) {
            const defaults = {
                individual: { price: 60, duration: 60, desc: 'Sesión de terapia individual' },
                couple: { price: 75, duration: 75, desc: 'Sesión de terapia de pareja' },
                family: { price: 80, duration: 75, desc: 'Sesión de terapia familiar' },
                group: { price: 40, duration: 90, desc: 'Sesión de terapia grupal' }
            };

            const def = defaults[type.name] || { price: 60, duration: 60, desc: `Sesión de ${type.display_name}` };

            console.log(`Creando precio para ${type.display_name}...`);
            await query(`
        INSERT INTO pricing (session_type_id, price, duration, description, is_active)
        VALUES ($1, $2, $3, $4, true)
      `, [type.id, def.price, def.duration, def.desc]);
        }

        console.log('✅ Todos los precios están configurados y activos!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetPricing();
