/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: true
  },
  images: {
    domains: ['localhost', 'minio']
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3001',
    NEXT_PUBLIC_ROUTING_URL: process.env.NEXT_PUBLIC_ROUTING_URL || 'http://localhost:3002',
    NEXT_PUBLIC_ANALYTICS_URL: process.env.NEXT_PUBLIC_ANALYTICS_URL || 'http://localhost:3010',
    NEXT_PUBLIC_POOL_URL: process.env.NEXT_PUBLIC_POOL_URL || 'http://localhost:3013'
  }
}

module.exports = nextConfig
