/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel-optimized configuration
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-icons', 'chart.js'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Enhanced image optimization for Vercel
  images: {
    // Enable optimization for production
    unoptimized: false,
    
    // Custom domains for image optimization
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/a1aa/image/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.hstatic.net',
      },
      {
        protocol: 'https',
        hostname: 'papka.vn',
      },
      {
        protocol: 'https',
        hostname: 'product.hstatic.net',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      }
    ],
    // Optimized formats for better performance
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  
  // Custom headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://fino-production.vercel.app' 
              : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  
  // Custom redirects for better SEO
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/products/:slug/details',
        destination: '/products/:slug',
        permanent: true,
      },
    ];
  },
  
  // Custom rewrites for clean URLs
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production'
          ? 'https://your-backend-api.vercel.app/api/:path*'
          : 'http://localhost:5000/api/:path*',
      },
    ];
  },
  
  // Webpack configuration for better bundling
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    };
    
    return config;
  },
  
  // Environment-specific settings
  env: {
    CUSTOM_KEY: process.env.NODE_ENV,
    BUILD_TIME: new Date().toISOString(),
    BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
  },
  
  // Output configuration for Vercel
  output: 'standalone',
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;