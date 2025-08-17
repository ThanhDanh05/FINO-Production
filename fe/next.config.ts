/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Disable image optimization completely for external images
    unoptimized: true,
    // Allow all domains temporarily for development
    domains: [
      'product.hstatic.net',
      'storage.googleapis.com', 
      'images.unsplash.com',
      'cdn.hstatic.net',
      'papka.vn',
      'dosi-in.com',
      'localhost'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http', 
        hostname: '**',
      }
    ],
    // Disable loader to prevent optimization issues
    loader: 'default',
    // Add dangerouslyAllowSVG if needed
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = nextConfig;