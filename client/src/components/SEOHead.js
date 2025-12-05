import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOHead = ({
    title = 'Esencialmente Psicología',
    description = 'Centro de psicología en Barcelona. Terapia individual, de pareja, familiar y grupal. Profesionales especializados en EMDR, ansiedad, depresión y trauma.',
    keywords = 'psicología, terapia, Barcelona, EMDR, ansiedad, depresión, terapia de pareja, psicólogos Barcelona',
    canonicalUrl,
    image = '/assets/logo.png',
    type = 'website',
    author = 'Esencialmente Psicología',
    locale = 'es_ES',
    structuredData
}) => {
    const siteUrl = process.env.REACT_APP_SITE_URL || 'https://esencialmentepsicologia.com';
    const fullUrl = canonicalUrl || `${siteUrl}${window.location.pathname}`;
    const defaultImage = '/assets/logo.png';
    const imageToUse = image || defaultImage;
    const fullImageUrl = imageToUse.startsWith('http') ? imageToUse : `${siteUrl}${imageToUse}`;

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <meta name="author" content={author} />
            <link rel="canonical" href={fullUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImageUrl} />
            <meta property="og:locale" content={locale} />
            <meta property="og:site_name" content="Esencialmente Psicología" />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={fullUrl} />
            <meta property="twitter:title" content={title} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={fullImageUrl} />

            {/* Additional SEO */}
            <meta name="robots" content="index, follow" />
            <meta name="googlebot" content="index, follow" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
            <meta name="language" content="Spanish" />

            {/* Schema.org JSON-LD */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Helmet>
    );
};

export default SEOHead;
