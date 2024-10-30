const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  mode: 'development',
  // entry: './src/index.tsx',
  entry:  path.resolve(__dirname, './src/index.tsx'),
  output: {
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        // test: /\.(js|jsx)$/,
        test: /\.ts$|tsx/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        // use: [
          // {loader: 'css-loader', options:{url: false}}
        //  ]
        use: [
          'style-loader',
           'css-loader'
        ],
      },
      {
        test: /\.(png|jpg)$/i,
        type: 'asset/resource'
    },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    hot: true,
    open: true,
  },
};