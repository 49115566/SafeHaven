const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  target: 'node',
  mode: 'production',
  // Memory optimization: exclude most node_modules but include specific ones that need bundling
  externals: [nodeExternals({
    allowlist: [
      // Include shared package since it's a local dependency
      'safehaven-shared',
      // Include AWS SDK and all its dependencies for Lambda
      /^aws-sdk/,
      /^@aws-sdk/,
      /^@smithy/,
      // Include any modules that need to be bundled
      /^uuid/,
      /^bcryptjs/,
      /^joi/,
      /^jsonwebtoken/,
      /^jws/,
      /^jmespath/,
      /^xml2js/,
      /^querystring/,
      /^querystringify/,
    ]
  })],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            // Memory optimization: only transpile, skip type checking
            transpileOnly: true,
            // Reduce memory usage
            experimentalWatchApi: true,
          }
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    // Reduce resolution overhead
    modules: ['node_modules'],
  },
  output: {
    libraryTarget: 'commonjs2',
    filename: '[name].js',
    // Clean output directory
    clean: true,
  },
  optimization: {
    // Disable minification to reduce memory usage during build
    minimize: false,
    // Split chunks if needed to reduce memory per bundle
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
      }
    }
  },
  // Memory management
  stats: 'errors-only',
  // Prevent memory leaks in watch mode
  watchOptions: {
    ignored: /node_modules/,
  },
  // Performance settings to avoid warnings
  performance: {
    hints: false,
  },
};