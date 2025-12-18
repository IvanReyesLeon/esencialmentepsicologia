require('dotenv').config();
const { pool } = require('./config/db');

async function updateAnna() {
    try {
        const bio = `Soy Anna Becerra y amo mi profesión. Desde pequeña he querido entender el cerebro humano y mis comportamientos siempre estaban orientados en ayudar a los demás. De toda la vida me he preguntado por qué las personas actuamos de la manera en que lo hacemos y me ha apasionado ver como las emociones pueden gobernar nuestra conducta. Me encanta conocer cómo la química cerebral es capaz de modificar nuestro comportamiento hasta límites insospechados, las estructuras cerebrales implicadas en los procesos psicológicos o cómo somos capaces de superarnos día tras día.

Después de años de experiencia trabajando con personas con discapacidad y diversidad intelectual, tanto en España como en el Reino Unido, decidí dar un paso más en mi formación y especializarme en psicoterapia. Para ello, elegí uno de los másteres más reconocidos en el campo: el Máster en Psicología Clínica Integradora del Instituto Mensalus.

A medida que avanzaba en el programa, descubrí la profundidad y la eficacia de la psicoterapia. Me sorprendió cómo, a través de distintos enfoques y técnicas, era posible generar cambios reales y significativos en las personas. La psicología ha desarrollado en el último siglo herramientas terapéuticas que realmente funcionan, y formar parte de esta profesión me reafirmó en mi vocación.

“Todo es muy difícil antes de ser sencillo”. Thomas Fuller.
Confío plenamente en tu capacidad para afrontar cualquier desafío que se presente en tu vida. Juntos, trabajaremos en equipo para recorrer este camino terapéutico, descubriendo y potenciando los recursos que te ayuden a enfrentarlos de la mejor manera posible.
“La vida es un continuo resolver problemas”. Karl Popper.`;

        const methodology = `Creo firmemente que cada persona es única, cada situación es diferente y, por lo tanto, la forma de abordar cada proceso terapéutico también debe serlo. Por ello, no me limito a una única metodología, sino que adapto la terapia a las necesidades específicas de cada persona, ofreciendo un acompañamiento personalizado y flexible.

El enfoque que aplico en mis sesiones es integrador, combinando herramientas de distintos modelos terapéuticos como el sistémico, el cognitivo-conductual, el constructivista y el humanista, entre otros. Mi objetivo es que, juntos, encontremos las estrategias más adecuadas para que puedas avanzar, fortalecerte y crecer personal y emocionalmente.

Además, trabajo desde una perspectiva centrada en el trauma, utilizando técnicas como EMDR (Desensibilización y Reprocesamiento por Movimientos Oculares) e IFS (Sistema de Familias Internas), enfoques altamente efectivos para sanar experiencias difíciles y lograr un bienestar más profundo y duradero.

Nuestra mente es increíblemente flexible y poderosa, pero a veces también nos pone obstáculos. Puede generar barreras o dificultades que nos impiden avanzar, y en esos momentos, contar con el apoyo de un terapeuta puede marcar la diferencia para superarlas y alcanzar nuestros objetivos.`;

        const label = `Psicóloga Sanitaria`; // Short label
        const photo = `anna_becerra_new.png`; // New photo

        // Note: The UI separates Bio and Methodology. I should check if the DB has a 'methodology' column.
        // Looking at TherapistDetail.js: {therapist.methodology && ...}
        // So there is a methodology field.

        // I will check columns first to be sure methodology exists, if not I will append it to bio.
        // Looking at previous query results or schema would be good. 
        // Assuming schema has it or I alter it. Wait, I should check schema first.

        // Let's assume standard fields. If methodology is missing in DB, I will concatenate.
        // Actually, I'll try to update 'methodology' if it exists.

        // The previous `therapistQueries.js` usually lists fields. I'll check `allowedFields`.

        const query = `
      UPDATE therapists 
      SET description = $1, 
          label = $2, 
          photo = $3 
          -- methodology might not exist yet, I'll verify first.
      WHERE full_name ILIKE '%Anna Becerra%'
    `;

        // Actually, let's verify columns first
        const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'therapists'");
        const hasMethodology = cols.rows.some(r => r.column_name === 'methodology');

        if (hasMethodology) {
            await pool.query(`UPDATE therapists SET description = $1, methodology = $2, label = $3, photo = $4 WHERE full_name ILIKE '%Anna Becerra%'`, [bio, methodology, label, photo]);
            console.log('Updated with methodology column');
        } else {
            // Concatenate if no column
            const fullBio = bio + '\n\n## Metodología\n\n' + methodology;
            await pool.query(`UPDATE therapists SET description = $1, label = $2, photo = $3 WHERE full_name ILIKE '%Anna Becerra%'`, [fullBio, label, photo]);
            console.log('Updated description (concatenated)');
        }

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

updateAnna();
