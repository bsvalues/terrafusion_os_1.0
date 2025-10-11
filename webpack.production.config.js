const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

/**
 * TerraFusion Production Webpack Configuration
 * Optimized for government-grade performance and production deployment
 * 
 * Performance Targets:
 * - Bundle size < 350KB (gzipped)
 * - Tree shaking enabled
 * - Code splitting optimized
 * - Asset compression active
 */

module.exports = {
  mode: 'production',
  
  // Entry points with code splitting
  entry: {
    main: './src/index.js',
    vendor: ['react', 'react-dom'],
    terrafusion: './src/terrafusion-core.js',
    government: './src/modules/government/index.js',
    assessment: './src/modules/assessment/index.js'
  },

  // Optimized output configuration
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
    publicPath: '/',
    clean: true,
    
    // Optimize for HTTP/2
    chunkLoadingGlobal: 'webpackChunkTerraFusion',
    
    // Enable source maps for debugging
    sourceMapFilename: '[name].[contenthash:8].map'
  },

  // Production optimization configuration
  optimization: {
    minimize: true,
    minimizer: [
      // JavaScript minification
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remove console.log statements
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.warn'], // Remove specific functions
            passes: 2 // Multiple optimization passes
          },
          mangle: {
            safari10: true
          },
          format: {
            comments: false // Remove comments
          }
        },
        extractComments: false
      }),
      
      // CSS minification
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true },
              normalizeWhitespace: true
            }
          ]
        }
      })
    ],

    // Advanced code splitting
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 244000,
      cacheGroups: {
        // Vendor libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        
        // TerraFusion core components
        terrafusion: {
          test: /[\\/]src[\\/]components[\\/]terrafusion[\\/]/,
          name: 'terrafusion-core',
          chunks: 'all',
          priority: 8
        },
        
        // Government modules
        government: {
          test: /[\\/]src[\\/]modules[\\/]government[\\/]/,
          name: 'government-modules',
          chunks: 'all',
          priority: 7
        },
        
        // Assessment modules
        assessment: {
          test: /[\\/]src[\\/]modules[\\/]assessment[\\/]/,
          name: 'assessment-modules',
          chunks: 'all',
          priority: 6
        },
        
        // Common components
        common: {
          test: /[\\/]src[\\/]components[\\/]common[\\/]/,
          name: 'common-components',
          chunks: 'all',
          priority: 5
        },
        
        // Shared utilities
        utils: {
          test: /[\\/]src[\\/]utils[\\/]/,
          name: 'utilities',
          chunks: 'all',
          priority: 4
        }
      }
    },

    // Runtime chunk optimization
    runtimeChunk: {
      name: 'runtime'
    },

    // Production-specific optimizations
    usedExports: true,
    sideEffects: false,
    providedExports: true,
    innerGraph: true,
    mangleExports: true
  },

  // Module resolution
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@modules': path.resolve(__dirname, 'src/modules'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@terrafusion/shared': path.resolve(__dirname, '../packages/shared'),
      '@terrafusion/ui-components': path.resolve(__dirname, '../packages/shared/ui-components')
    },
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer")
    }
  },

  // Module rules with optimizations
  module: {
    rules: [
      // JavaScript/TypeScript processing
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: '> 0.25%, not dead',
                  useBuiltIns: 'usage',
                  corejs: 3
                }],
                ['@babel/preset-react', {
                  runtime: 'automatic'
                }],
                '@babel/preset-typescript'
              ],
              plugins: [
                ['@babel/plugin-transform-runtime', {
                  corejs: false,
                  helpers: true,
                  regenerator: true
                }]
              ],
              cacheDirectory: true
            }
          }
        ]
      },

      // CSS processing with optimization
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: {
                auto: true,
                localIdentName: '[hash:base64:5]'
              }
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  ['autoprefixer'],
                  ['cssnano', {
                    preset: ['default', {
                      discardComments: { removeAll: true },
                      normalizeWhitespace: true
                    }]
                  }]
                ]
              }
            }
          }
        ]
      },

      // SCSS processing
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ]
      },

      // Image optimization
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8192 // 8kb
          }
        },
        generator: {
          filename: 'images/[name].[contenthash:8][ext]'
        },
        use: [
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
                quality: 85
              },
              optipng: {
                enabled: true,
                optimizationLevel: 7
              },
              pngquant: {
                quality: [0.8, 0.9],
                speed: 4
              },
              gifsicle: {
                interlaced: false
              },
              webp: {
                quality: 85
              }
            }
          }
        ]
      },

      // Font optimization
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 4096 // 4kb
          }
        },
        generator: {
          filename: 'fonts/[name].[contenthash:8][ext]'
        }
      }
    ]
  },

  // Production plugins
  plugins: [
    // Environment variables
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.TERRAFUSION_ENV': JSON.stringify('production'),
      'process.env.TERRAFUSION_API_URL': JSON.stringify(process.env.TERRAFUSION_API_URL || '/api'),
      '__DEV__': false
    }),

    // CSS extraction
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[name].[contenthash:8].chunk.css'
    }),

    // Gzip compression
    new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8
    }),

    // Bundle analyzer (only in analyze mode)
    ...(process.env.ANALYZE === 'true' ? [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
        reportFilename: 'bundle-report.html'
      })
    ] : []),

    // Progress plugin
    new webpack.ProgressPlugin((percentage, message, ...args) => {
      console.log(`🔧 Build Progress: ${Math.round(percentage * 100)}% - ${message}`);
    })
  ],

  // Performance budgets
  performance: {
    maxAssetSize: 300000, // 300kb
    maxEntrypointSize: 350000, // 350kb
    hints: 'error',
    assetFilter: function(assetFilename) {
      return assetFilename.endsWith('.js') || assetFilename.endsWith('.css');
    }
  },

  // Development tools
  devtool: 'source-map',
  
  // Stats configuration
  stats: {
    colors: true,
    modules: false,
    chunks: false,
    chunkModules: false,
    optimizationBailout: true,
    builtAt: true,
    timings: true
  },

  // Cache configuration
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  }
};

// Export configuration with environment-specific overrides
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 TerraFusion Production Build Configuration Loaded');
  console.log('📊 Performance Targets: Bundle < 350KB, Tree Shaking Enabled');
  console.log('🎯 Government-Grade Optimization Active');
}