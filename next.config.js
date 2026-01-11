/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimize for faster dev server startup
  experimental: {
    // Optimize package imports for faster compilation
    optimizePackageImports: ['@prisma/client'],
  },
}

module.exports = nextConfig
