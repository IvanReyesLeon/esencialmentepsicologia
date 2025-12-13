const { getAllWorkshops } = require('../models/workshopQueries');

exports.getSitemap = async (req, res) => {
    try {
        const baseUrl = 'https://www.esencialmentepsicologia.com';
        const workshops = await getAllWorkshops();

        // Páginas estáticas
        const staticPages = [
            '',
            '/servicios',
            '/equipo',
            '/talleres',
            '/contacto',
            '/politica-privacidad',
            '/politica-cookies'
        ];

        let xml = '<?xml version="1.0" encoding="UTF-8"?>';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        // Añadir páginas estáticas
        staticPages.forEach(page => {
            xml += `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
        });

        // Añadir talleres dinámicos
        workshops.forEach(workshop => {
            if (workshop.is_active) {
                xml += `
  <url>
    <loc>${baseUrl}/talleres/${workshop.slug}</loc>
    <lastmod>${new Date(workshop.updated_at || workshop.created_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
            }
        });

        xml += '</urlset>';

        res.header('Content-Type', 'application/xml');
        res.send(xml);

    } catch (error) {
        console.error('Error generating sitemap:', error);
        res.status(500).send('Error generating sitemap');
    }
};
