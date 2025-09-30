const path = require('path');

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, 'index.js'),
  output: {
    path: path.resolve(__dirname, '..', 'ui'),
    filename: 'bundle.js', // deterministic filename (no hashes)
    publicPath: './',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        const path = require('path');

        module.exports = {
          mode: 'production',
          entry: path.resolve(__dirname, 'index.js'),
          output: {
            path: path.resolve(__dirname, '..', 'ui'),
            filename: 'bundle.js', // deterministic filename (no hashes)
            publicPath: './',
          },
          resolve: {
            extensions: ['.js', '.jsx', '.json'],
          },
          module: {
            rules: [
              {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                  loader: 'babel-loader',
                },
              },
              {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
              },
              {
                test: /\.(png|jpg|jpeg|gif|svg)$/i,
                type: 'asset/resource',
                generator: {
                  filename: 'assets/[name][ext]'
                }
              }
            ],
          },
          optimization: {
            minimize: true,
          },
        };
