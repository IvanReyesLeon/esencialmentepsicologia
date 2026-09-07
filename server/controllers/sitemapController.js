const { getAllWorkshops } = require('../models/workshopQueries');
const { getAllPosts } = require('../models/postQueries');
const { getAllTherapists } = require('../models/therapistQueries');

exports.getSitemap = async (req, res) => {
    try {
        const baseUrl = 'https://www.esencialmentepsicologia.com';
        const workshops = await getAllWorkshops();
        const posts = await getAllPosts(true); // Only published posts
        const therapists = await getAllTherapists();

        // Páginas estáticas y de arquitectura territorial
        const staticPages = [
            { url: '', priority: '1.0', changefreq: 'weekly' },
            { url: '/psicologo-valles-occidental', priority: '0.9', changefreq: 'weekly' },
            { url: '/psicologo-cerdanyola-del-valles', priority: '0.9', changefreq: 'weekly' },
            { url: '/psicologo-sabadell', priority: '0.8', changefreq: 'weekly' },
            { url: '/psicologo-sant-cugat', priority: '0.8', changefreq: 'weekly' },
            { url: '/psicologo-rubi', priority: '0.8', changefreq: 'weekly' },
            { url: '/psicologo-terrassa', priority: '0.8', changefreq: 'weekly' },
            { url: '/psicologo-barbera-del-valles', priority: '0.8', changefreq: 'weekly' },
            { url: '/terapia-online', priority: '0.9', changefreq: 'weekly' },
            { url: '/servicios', priority: '0.8', changefreq: 'monthly' },
            { url: '/terapeutas', priority: '0.8', changefreq: 'weekly' },
            { url: '/talleres', priority: '0.8', changefreq: 'weekly' },
            { url: '/blog', priority: '0.8', changefreq: 'weekly' },
            { url: '/contacto', priority: '0.7', changefreq: 'monthly' },
            { url: '/donde-estamos', priority: '0.7', changefreq: 'monthly' },
            { url: '/politica-privacidad', priority: '0.3', changefreq: 'yearly' },
            { url: '/politica-cookies', priority: '0.3', changefreq: 'yearly' }
        ];

        let xml = '<?xml version="1.0" encoding="UTF-8"?>';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        // Añadir páginas estáticas y locales
        staticPages.forEach(page => {
            xml += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
        });

        // Añadir terapeutas dinámicos
        therapists.forEach(therapist => {
            if (therapist.slug) {
                xml += `
  <url>
    <loc>${baseUrl}/terapeutas/${therapist.slug}</loc>
    <lastmod>${new Date(therapist.updated_at || therapist.created_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
            }
        });

        // Añadir talleres dinámicos
        workshops.forEach(workshop => {
            if (workshop.is_active && workshop.slug) {
                xml += `
  <url>
    <loc>${baseUrl}/talleres/${workshop.slug}</loc>
    <lastmod>${new Date(workshop.updated_at || workshop.created_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
            }
        });

        // Añadir posts del blog dinámicos
        posts.forEach(post => {
            if (post.slug) {
                xml += `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updated_at || post.created_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
            }
        });

        xml += '\n</urlset>';

        res.header('Content-Type', 'application/xml');
        res.send(xml);

    } catch (error) {
        console.error('Error generating sitemap:', error);
        res.status(500).send('Error generating sitemap');
    }
};
