import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  canonical, 
  ogImage, 
  ogType = 'website', 
  twitterHandle = '@ifrutico',
  structuredData,
  schemaType = 'WebPage'
}) => {
  const siteName = 'Frutico';
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} - Natural Fruit Ice Cream & Dairy Products`;
  const defaultDescription = 'Frutico by Vigneshwara Agro Products offers 100% natural fruit ice cream and premium dairy products made with handpicked fruits from Kolli Hills and Nilgiris.';
  const siteUrl = 'https://www.ifrutico.com';
  const defaultImage = `${siteUrl}/images/og-image.webp`;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonical || siteUrl} />
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Vigneshwara Agro Products" />

      {/* Open Graph Tags */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={ogImage || defaultImage} />
      <meta property="og:url" content={canonical || siteUrl} />
      <meta property="og:type" content={ogType} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={ogImage || defaultImage} />
      <meta name="twitter:site" content={twitterHandle} />

      {/* Security and Misc */}
      <meta name="theme-color" content="#10b981" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="geo.region" content="IN-TN" />
      <meta name="geo.placename" content="Musiri" />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
