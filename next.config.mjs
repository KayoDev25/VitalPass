/** @type {import('next').NextConfig} */
const nextConfig = {
  // Las librerías de blockchain se cargan tal cual en el servidor (no se empaquetan).
  serverExternalPackages: ['@hashgraph/sdk', '@stellar/stellar-sdk'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
