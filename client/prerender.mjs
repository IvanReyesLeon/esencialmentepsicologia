
import puppeteer from 'puppeteer';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3333;
const BASE_URL = `http://localhost:${PORT}`;
const BUILD_DIR = path.join(__dirname, 'build');

// Routes to prerender
// Routes to prerender
const ROUTES = [
    '/',
    '/servicios',
    '/terapeutas',
    '/contacto',
    '/talleres',
    '/donde-estamos',
    '/blog'
];

// Simple MIME types
const MIMES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
};

async function fetchDynamicRoutes() {
    try {
        console.log('🔄 Fetching dynamic blog posts...');
        const response = await fetch('http://localhost:3001/api/posts');
        if (!response.ok) throw new Error('API not available');
        const posts = await response.json();

        posts.forEach(post => {
            if (post.slug) {
                ROUTES.push(`/blog/${post.slug}`);
            }
        });
        console.log(`✅ Added ${posts.length} blog posts to prerender queue.`);
    } catch (error) {
        console.warn('⚠️ Could not fetch blog posts for prerendering. Ensure server is running on port 3001.');
        console.warn(`Error: ${error.message}`);
    }
}

async function prerender() {
    await fetchDynamicRoutes();
    console.log('🚀 Starting custom prerender (Native HTTP)...');

    // 1. Verify build exists
    if (!fs.existsSync(BUILD_DIR)) {
        console.error('❌ Build directory not found. Run "npm run build" first.');
        process.exit(1);
    }

    // 2. Start native static server
    const server = http.createServer((req, res) => {
        try {
            // Normalize path
            let requestPath = req.url.split('?')[0]; // simple ignore query
            let filePath = path.join(BUILD_DIR, requestPath);

            // Basic security
            if (!filePath.startsWith(BUILD_DIR)) {
                res.writeHead(403);
                res.end();
                return;
            }

            // Check if file exists
            let fileExists = fs.existsSync(filePath) && fs.lstatSync(filePath).isFile();

            // SPA Fallback Logic
            // If file doesn't exist and it looks like a route (no extension or not found), serve index.html
            // But we want to let Puppeteer find assets (js/css)
            if (!fileExists) {
                if (path.extname(requestPath) === '') {
                    // It's a route, serve index.html
                    filePath = path.join(BUILD_DIR, 'index.html');
                    fileExists = true;
                } else {
                    // Missing asset
                    res.writeHead(404);
                    res.end();
                    return;
                }
            }

            // Serve file
            if (fileExists) {
                const ext = path.extname(filePath);
                const contentType = MIMES[ext] || 'application/octet-stream';
                res.writeHead(200, { 'Content-Type': contentType });
                const stream = fs.createReadStream(filePath);
                stream.pipe(res);
                return;
            }

            res.writeHead(404);
            res.end();

        } catch (e) {
            console.error('Server error:', e);
            res.writeHead(500);
            res.end();
        }
    });

    server.listen(PORT, () => {
        console.log(`📡 Static server running on port ${PORT}`);
    });

    let browser;
    let failures = 0;


    try {
        // 3. Launch Puppeteer
        try {
            browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--single-process', // Sometimes helps in strict containers
                    '--no-zygote'
                ]
            });
        } catch (launchError) {
            console.warn('⚠️ Unable to launch Puppeteer. This is common in CI environments (Vercel/Netlify) lacking shared libraries.');
            console.warn('⚠️ Error details:', launchError.message);
            console.warn('⚠️ Skipping prerender phase. The site will be served as a standard SPA.');
            process.exit(0); // Soft fail to allow deployment
        }

        for (const route of ROUTES) {
            try {
                console.log(`Processing: ${route}...`);
                const page = await browser.newPage();

                // Optimize: Block non-essential resources
                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    const resourceType = req.resourceType();
                    const url = req.url();
                    // Block images, media, fonts, and google maps/analytics to speed up
                    if (
                        ['image', 'media', 'font'].includes(resourceType) ||
                        url.includes('google-analytics') ||
                        url.includes('googletagmanager') ||
                        url.includes('google.com/maps')
                    ) {
                        req.abort();
                    } else {
                        req.continue();
                    }
                });

                // Set viewport
                await page.setViewport({ width: 1280, height: 800 });

                // Custom Timeout for heavy pages
                const isHeavyPage = route.includes('/servicios') || route.includes('/terapeutas');
                const timeout = isHeavyPage ? 60000 : 30000;

                // Go to URL
                await page.goto(`${BASE_URL}${route}`, {
                    waitUntil: 'networkidle2', // Looser condition
                    timeout: timeout
                });

                // 4. WAIT condition (Robustness)
                // Global Wait
                await page.waitForFunction(() => document.title.length > 5, { timeout: timeout });

                // Route Specific Waits
                if (route === '/servicios') {
                    // Wait for pricing grid OR no pricing message OR just the hero
                    await page.waitForFunction(
                        () => document.querySelector('.pricing-grid') || document.querySelector('.no-pricing') || document.querySelector('h1'),
                        { timeout: timeout }
                    );
                } else if (route === '/terapeutas') {
                    await page.waitForFunction(
                        () => document.querySelector('.therapists-grid') || document.querySelector('.no-therapists') || document.querySelector('h1'),
                        { timeout: timeout }
                    );
                } else {
                    // Default: Wait for root content (existing logic)
                    await page.waitForSelector('#root div', { timeout: timeout });
                }

                // Small delay to ensure render settling
                await new Promise(r => setTimeout(r, 1000));

                // 5. Extract HTML
                const html = await page.evaluate(() => {
                    return '<!DOCTYPE html>' + document.documentElement.outerHTML;
                });

                // 6. Save to file
                let outputPath;
                if (route === '/') {
                    outputPath = path.join(BUILD_DIR, 'index.html');
                } else {
                    const cleanRoute = route.substring(1);
                    const routeDir = path.join(BUILD_DIR, cleanRoute);

                    if (!fs.existsSync(routeDir)) {
                        fs.mkdirSync(routeDir, { recursive: true });
                    }
                    outputPath = path.join(routeDir, 'index.html');
                }

                fs.writeFileSync(outputPath, html);
                console.log(`✅ Saved: ${route} -> ${outputPath}`);
                await page.close();

            } catch (err) {
                console.error(`❌ Failed route: ${route}`, err.message);
                failures++;
                const pages = await browser.pages();
                if (pages.length > 1) await pages[pages.length - 1].close();
            }
        }

    } catch (err) {
        console.error('❌ Critical Puppeteer error:', err);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
        server.close();
        console.log(`🏁 Prerender finished. Failures: ${failures}`);

        if (failures >= 3) {
            console.error('❌ Too many failures. Exiting with error.');
            process.exit(1);
        } else if (failures > 0) {
            console.warn('⚠️ Completed with warnings.');
            process.exit(0); // Allow soft fail
        } else {
            console.log('✨ Success!');
            process.exit(0);
        }
    }
}

prerender();
