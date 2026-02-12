/**
 * TerraFusion Frontend Engine - Production Webpack Configuration
 * 
 * Optimizations:
 * - Minification (TerserPlugin)
 * - Tree-shaking (production mode)
 * - Code splitting (dynamic imports)
 * - CSS extraction and minification
 * - Bundle size optimization
 * - Source maps for debugging
 * 
 * Target: < 500 KB initial bundle (from 1.28 MiB dev build)
 */

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  mode: 'production',
  
  entry: {
    main: './index.jsx',
    webgl: './src/components/WebGLTranscendence.jsx' // Lazy-loadable WebGL component
  },
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
    publicPath: '/frontend_engine/',
    clean: true // Clean dist folder before build
  },
  
  module: {
    rules: [
      {
        test: /\.(jsx?|tsx?)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: '> 0.25%, not dead',
                modules: false, // Enable tree-shaking
                useBuiltIns: 'usage',
                corejs: 3
              }],
              ['@babel/preset-react', {
                runtime: 'automatic' // New JSX transform (smaller bundle)
              }],
              '@babel/preset-typescript'
            ],
            plugins: [
              '@babel/plugin-syntax-dynamic-import' // Enable code splitting
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader, // Extract CSS to separate file
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: {
                auto: true,
                localIdentName: '[hash:base64:8]' // Shorter class names
              }
            }
          },
          'postcss-loader' // Add vendor prefixes
        ]
      },
      {
        test: /\.json$/,
        type: 'json',
        parser: {
          parse: JSON.parse
        }
      }
    ]
  },
  
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@theme': path.resolve(__dirname, 'src/theme'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@tokens': path.resolve(__dirname, '../../design/tokens.json')
    }
  },
  
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remove console.log statements
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
            passes: 2 // Multiple compression passes
          },
          mangle: {
            safari10: true // Fix Safari 10 bugs
          },
          format: {
            comments: false, // Remove comments
            ascii_only: true // Ensure ASCII-only output
          }
        },
        extractComments: false,
        parallel: true // Use multi-threading
      }),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true },
              normalizeWhitespace: true,
              minifyFontValues: true,
              minifySelectors: true
            }
          ]
        }
      })
    ],
    
    // Code splitting configuration
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor chunk (React, etc.)
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          priority: 10,
          reuseExistingChunk: true
        },
        // Terra-UI components chunk
        components: {
          test: /[\\/]src[\\/]components[\\/]/,
          name: 'components',
          priority: 5,
          minChunks: 2, // Only split if used in 2+ places
          reuseExistingChunk: true
        },
        // Design system chunk
        design: {
          test: /[\\/]design[\\/]|[\\/]design-sync[\\/]/,
          name: 'design',
          priority: 3,
          reuseExistingChunk: true
        },
        // Common code chunk
        common: {
          minChunks: 2,
          priority: 1,
          reuseExistingChunk: true
        }
      }
    },
    
    // Runtime chunk for webpack runtime code
    runtimeChunk: {
      name: 'runtime'
    },
    
    // Module IDs optimization
    moduleIds: 'deterministic', // Stable IDs for better caching
    
    // Chunk IDs optimization
    chunkIds: 'deterministic'
  },
  
  plugins: [
    // Extract CSS to separate file
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[name].[contenthash:8].chunk.css'
    }),
    
    // Gzip compression
    new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240, // Only compress files > 10 KB
      minRatio: 0.8
    }),
    
    // Brotli compression (better than gzip)
    new CompressionPlugin({
      filename: '[path][base].br',
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      compressionOptions: {
        level: 11 // Max compression
      },
      threshold: 10240,
      minRatio: 0.8
    }),
    
    // Bundle analyzer (generate report)
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json'
    })
  ],
  
  // Performance budgets
  performance: {
    maxEntrypointSize: 512000, // 500 KB initial bundle
    maxAssetSize: 512000, // 500 KB per asset
    hints: 'error', // Fail build if exceeded
    assetFilter: (assetFilename) => {
      // Only check JS/CSS files
      return /\.(js|css)$/.test(assetFilename);
    }
  },
  
  // Source maps for production debugging
  devtool: 'source-map',
  
  // Stats configuration
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
    entrypoints: true,
    assets: true,
    performance: true,
    timings: true
  }
};
