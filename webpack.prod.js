const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');
// CleanWebpackPlugin mungkin tidak perlu jika output.clean: true sudah ada di common.js
const { CleanWebpackPlugin } = require('clean-webpack-plugin'); 
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = merge(common, {
  mode: 'production',
  
  output: {
    // Beri tahu Webpack base path aplikasi Anda di GitHub Pages
    // Pastikan nama repo 'Proyek-Web-Intermediate' sudah benar
    publicPath: '/Proyek-Web-Intermediate/', 
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
    // Jika output.clean: true sudah ada di common.js, baris ini bisa dihapus
    new CleanWebpackPlugin(), 
    
    // Sebaiknya tambahkan nama file output CSS dengan hash
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css', 
    }),
  ],
});