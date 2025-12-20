require('dotenv').config();
const { pool } = require('./config/db');

async function seedPosts() {
    try {
        console.log('Seeding blog posts...');

        const posts = [
            {
                title: 'Ansiedad: qué es, síntomas reales y cómo saber si necesito ayuda psicológica',
                slug: 'ansiedad-que-es-sintomas-reales-y-como-saber-si-necesito-ayuda',
                image_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop', // Stock photo related to anxiety/calm
                excerpt: 'La ansiedad es una de las consultas más frecuentes en salud mental. Descubre qué es realmente, cuáles son sus síntomas y cuándo es el momento de buscar ayuda profesional.',
                content: `
                    <h2>¿Qué es la ansiedad?</h2>
                    <p>La ansiedad es una respuesta natural del cuerpo ante situaciones de estrés o peligro. Sin embargo, cuando esta respuesta se vuelve constante y desproporcionada, puede interferir significativamente en la vida diaria.</p>
                    
                    <h3>Síntomas reales de la ansiedad</h3>
                    <ul>
                        <li>Sensación de nerviosismo o tensión constante.</li>
                        <li>Aumento del ritmo cardíaco y respiración acelerada.</li>
                        <li>Dificultad para concentrarse o pensar en otra cosa que no sea la preocupación actual.</li>
                        <li>Problemas para conciliar el sueño.</li>
                    </ul>

                    <h3>¿Ansiedad o Estrés?</h3>
                    <p>Mientras que el estrés suele ser una respuesta a una causa externa y desaparece una vez que la situación se resuelve, la ansiedad puede persistir incluso sin un factor estresante evidente.</p>

                    <h3>¿Cuándo ir al psicólogo?</h3>
                    <p>Si sientes que la ansiedad controla tu vida, te impide realizar tus actividades cotidianas o afecta tus relaciones personales, es el momento de buscar apoyo profesional. En Esencialmente Psicología podemos ayudarte a encontrar las herramientas para gestionarla.</p>
                `,
                meta_title: 'Ansiedad: Qué es, síntomas y cuándo pedir ayuda | Esencialmente Psicología',
                meta_description: 'Descubre qué es la ansiedad, sus síntomas reales y las claves para saber si necesitas ayuda psicológica. Guía completa 2025.',
                published: true
            },
            {
                title: 'Burnout emocional: señales de alerta y cómo recuperarte antes de tocar fondo',
                slug: 'burnout-emocional-senales-alerta-como-recuperarte',
                image_url: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=2000&auto=format&fit=crop', // Stock photo related to burnout/tired
                excerpt: 'El agotamiento emocional o burnout está en aumento. Aprende a identificar las señales de alerta y conoce las estrategias para recuperarte y prevenirlo.',
                content: `
                    <h2>El auge del Burnout Emocional</h2>
                    <p>El "burnout" o síndrome del trabajador quemado no es solo cansancio; es un estado de agotamiento físico, emocional y mental causado por el estrés excesivo y prolongado.</p>

                    <h3>Señales de alerta que no debes ignorar</h3>
                    <ul>
                        <li>Agotamiento que no desaparece con el descanso.</li>
                        <li>Desapego o cinismo hacia el trabajo o las responsabilidades.</li>
                        <li>Sensación de ineficacia o falta de logro.</li>
                        <li>Irritabilidad constante con compañeros o familiares.</li>
                    </ul>

                    <h3>Causas comunes en 2025</h3>
                    <p>El trabajo híbrido, la autoexigencia y la "precariedad emocional silenciosa" son factores clave que están impulsando el aumento de casos de burnout.</p>

                    <h3>Cómo recuperarte antes de tocar fondo</h3>
                    <p>La recuperación comienza con el reconocimiento del problema. Establecer límites claros, priorizar el autocuidado y, a menudo, buscar acompañamiento terapéutico son pasos fundamentales para salir del burnout.</p>
                `,
                meta_title: 'Burnout Emocional: Señales de alerta y recuperación | Esencialmente Psicología',
                meta_description: '¿Sientes que estás quemado? Conoce las señales del burnout emocional y cómo recuperarte antes de tocar fondo. Consejos prácticos.',
                published: true
            }
        ];

        for (const post of posts) {
            // Check if exists to update or insert
            const existing = await pool.query('SELECT id FROM posts WHERE slug = $1', [post.slug]);
            if (existing.rows.length > 0) {
                console.log(`Actualizando post: ${post.title}`);
                await pool.query(`
                    UPDATE posts SET 
                        title = $1, content = $2, image_url = $3, excerpt = $4, 
                        meta_title = $5, meta_description = $6, published = $7, updated_at = NOW()
                    WHERE slug = $8
                `, [post.title, post.content, post.image_url, post.excerpt, post.meta_title, post.meta_description, post.published, post.slug]);
            } else {
                console.log(`Creando post: ${post.title}`);
                await pool.query(`
                    INSERT INTO posts (title, slug, content, image_url, excerpt, meta_title, meta_description, published)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [post.title, post.slug, post.content, post.image_url, post.excerpt, post.meta_title, post.meta_description, post.published]);
            }
        }

        console.log('✅ Posts insertados correctamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding posts:', error);
        process.exit(1);
    }
}

seedPosts();
