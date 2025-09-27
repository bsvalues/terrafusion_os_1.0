const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: './src/renderer/index.tsx',
  target: 'electron-renderer',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'renderer.js',
    publicPath: './',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@/components': path.resolve(__dirname, 'src/renderer/components'),
      '@/hooks': path.resolve(__dirname, 'src/renderer/hooks'),
      '@/services': path.resolve(__dirname, 'src/renderer/services'),
      '@/types': path.resolve(__dirname, 'src/renderer/types'),
      '@/utils': path.resolve(__dirname, 'src/renderer/utils'),
      '@/styles': path.resolve(__dirname, 'src/renderer/styles'),
    },
  },
  devtool: isDevelopment ? 'eval-source-map' : 'source-map',
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg|ico)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]',
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][ext]',
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html',
    }),
    new MonacoWebpackPlugin({
      // Essential languages only for faster loading
      languages: [
        'typescript',
        'javascript',
        'json',
        'markdown',
      ],
      // Core features only for faster loading
      features: [
        'bracketMatching',
        'clipboard',
        'codeAction',
        'comment',
        'coreCommands',
        'find',
        'folding',
        'format',
        'hover',
        'inlineCompletions',
        'linesOperations',
        'multicursor',
        'parameterHints',
        'suggest',
        'snippets',
      ],
    }),
    !isDevelopment &&
      new MiniCssExtractPlugin({
        filename: 'styles/[name].css',
      }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/renderer/assets'),
          to: path.resolve(__dirname, 'dist/assets'),
          noErrorOnMissing: true,
        },
        {
          from: path.resolve(__dirname, 'src/renderer/sw.js'),
          to: path.resolve(__dirname, 'dist/sw.js'),
          noErrorOnMissing: false,
        },
      ],
    }),

    // Hot Module Replacement for instant updates
    isDevelopment && new webpack.HotModuleReplacementPlugin(),

    // Enhanced development experience
    isDevelopment && new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.TERRAFUSION_DEV': JSON.stringify('true'),
      'process.env.SUPREME_COMMANDER_MODE': JSON.stringify('development'),
    }),
  ].filter(Boolean),

  // Development server configuration
  devServer: isDevelopment ? {
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    port: 3201,
    hot: true,
    open: false,
    historyApiFallback: true,
    headers: {
      'X-TerraFusion-IDE': 'Development-Mode',
      'X-Supreme-Commander': 'Active',
    },
    client: {
      logging: 'warn',
      overlay: {
        errors: true,
        warnings: false,
      },
    },
  } : undefined,
  externals: {
    electron: 'commonjs2 electron',
  },
};