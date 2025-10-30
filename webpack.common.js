const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
// 1. IMPORT WORKBOX
const { InjectManifest } = require('workbox-webpack-plugin');

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'src/scripts/index.js'),
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      // Aturan CSS Anda akan ditangani oleh webpack.dev.js dan webpack.prod.js
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[hash][ext][query]',
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
      filename: 'index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/public/'),
          // 2. Perbaiki path tujuan agar lebih rapi
          to: path.resolve(__dirname, 'dist/public/'), 
          globOptions: {
            ignore: ['**/.gitkeep'],
          },
        },
        {
          from: path.resolve(__dirname, 'src/app.webmanifest'),
          to: path.resolve(__dirname, 'dist/'),
        },
        // 3. HAPUS 'sw.js' DARI SINI
        // {
        //   from: path.resolve(__dirname, 'src/sw.js'),
        //   to: path.resolve(__dirname, 'dist/'),
        // },
      ],
    }),

    // 4. TAMBAHKAN PLUGIN WORKBOX DI SINI
    new InjectManifest({
      swSrc: path.resolve(__dirname, 'src/sw.js'), // File sumber SW
      swDest: 'sw.js', // Nama file SW di folder 'dist'
    }),
  ],
};