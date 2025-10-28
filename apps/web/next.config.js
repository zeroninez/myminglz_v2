/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  swcMinify: true,
  webpack: (config, { dev, isServer }) => {
    // 개발 환경에서만 적용되는 설정
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
      
      // 캐시 설정 최적화
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        cacheDirectory: require('path').resolve(__dirname, '.next/cache/webpack'),
        name: isServer ? 'server' : 'client',
        version: '1.0.0'
      }
    }

    // 성능 최적화
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      runtimeChunk: {
        name: 'runtime',
      },
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: 10,
            enforce: true,
          },
        },
      },
    }

    return config
  }
}

module.exports = nextConfig