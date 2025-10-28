// ISI FILE: webpack.prod.js (DENGAN publicPath BARU)

const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin'); // Mungkin tidak perlu
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = merge(common, {
  mode: 'production',

  output: {
    // --- PERBAIKAN DI SINI ---
    // Sesuaikan dengan nama repo baru Anda
    publicPath: '/Proyek-Web-Inter/',
    // -------------------------
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    // new CleanWebpackPlugin(), // Bisa dihapus jika output.clean: true ada di common
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
  ],
});