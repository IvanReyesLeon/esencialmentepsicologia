const express = require('express');
const router = express.Router();
const { getAllTherapists } = require('../models/therapistQueries');
const { getAllWorkshops } = require('../models/workshopQueries');

// @desc    Generate dynamic sitemap.xml
// @route   GET /api/sitemap.xml
// @access  Public
router.get('/sitemap.xml', async (req, res) => {
    try {
        const baseUrl = process.env.CLIENT_URL || 'https://esencialmentepsicologia.com';

        // Obtener terapeutas y talleres activos
        const therapists = await getAllTherapists();
        const workshops = await getAllWorkshops();

        // Páginas estáticas
        const staticPages = [
            { url: '/', changefreq: 'monthly', priority: 1.0 },
            { url: '/terapeutas', changefreq: 'weekly', priority: 0.9 },
            { url: '/servicios', changefreq: 'monthly', priority: 0.8 },
            { url: '/contacto', changefreq: 'monthly', priority: 0.7 },
            { url: '/talleres', changefreq: 'weekly', priority: 0.8 },
            { url: '/donde-estamos', changefreq: 'monthly', priority: 0.6 },
        ];

        // Construir XML
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Añadir páginas estáticas
        staticPages.forEach(page => {
            xml += '  <url>\n';
            xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
            xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
            xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
            xml += `    <priority>${page.priority}</priority>\n`;
            xml += '  </url>\n';
        });

        // Añadir terapeutas
        therapists.forEach(therapist => {
            if (therapist.slug) {
                xml += '  <url>\n';
                xml += `    <loc>${baseUrl}/terapeutas/${therapist.slug}</loc>\n`;
                xml += `    <lastmod>${new Date(therapist.updated_at || therapist.created_at).toISOString().split('T')[0]}</lastmod>\n`;
                xml += '    <changefreq>monthly</changefreq>\n';
                xml += '    <priority>0.7</priority>\n';
                xml += '  </url>\n';
            }
        });

        // Añadir talleres
        workshops.forEach(workshop => {
            if (workshop.slug) {
                xml += '  <url>\n';
                xml += `    <loc>${baseUrl}/talleres/${workshop.slug}</loc>\n`;
                xml += `    <lastmod>${new Date(workshop.updated_at || workshop.created_at).toISOString().split('T')[0]}</lastmod>\n`;
                xml += '    <changefreq>weekly</changefreq>\n';
                xml += '    <priority>0.6</priority>\n';
                xml += '  </url>\n';
            }
        });

        xml += '</urlset>';

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (error) {
        console.error('Sitemap generation error:', error);
        res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Error generating sitemap</error>');
    }
});

module.exports = router;
