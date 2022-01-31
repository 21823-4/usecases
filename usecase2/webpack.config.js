const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  // Development settings
  mode: 'development',
  
  target: 'node',
  
  // Entry point code
  entry: './src/web_form/index.ts',

  // Output destination of js file after bundling
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js'
  },

  // Source map file output settings
  devtool: 'source-map',

  module: {
    rules: [
      // How to handle TypeScript files
      {
        test: /\.ts$/,
        use: "ts-loader",
        include: path.resolve(__dirname, 'src'),
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(jpg|png|gif)$/,
        use: ["url-loader"]
      }
    ],
  },
  // Settings for omitting the extension in the import statement
  resolve: {
    // Specify the extension as an array
    extensions: [
      '.ts', '.js',
    ],
  },
  plugins: [
    // HTML file output settings
    new HtmlWebpackPlugin({
      template: './src/web_form/index.html'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "./src/web_form/config.json",
          to: path.resolve(__dirname, "dist")
        },
        {
          from: "./input_data",
          to: path.resolve(__dirname, "dist/data")
        }
      ],
    })
  ]
};
