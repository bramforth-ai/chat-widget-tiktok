const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const textOnly = env && env.textOnly;

  // Build configuration based on environment and parameters
  const config = {
    mode: argv.mode || 'development',
    entry: {
      // Voice-enabled version
      'widget-elevenlabs': './src/js/voice/index-voice-elevenlabs.js',
      // Text-only version uses a dedicated entry point with no voice functionality
      'widget-elevenlabs-text': './src/js/no-voice/index-text-only.js'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].min.js' : '[name].js',
      clean: true,
      // Add library settings to ensure the widget is accessible globally
      library: {
        name: 'ChatWidget',
        type: 'window',
        export: 'default'
      }
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader']
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        chunks: textOnly ? ['widget-elevenlabs-text'] : ['widget-elevenlabs'],
        // Pass textOnly to the script
        templateParameters: {
          textOnly: !!textOnly
        }
      }),
      new MiniCssExtractPlugin({
        filename: isProduction ? 'styles.min.css' : 'styles.css'
      })
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 9000,
      hot: true
    }
  };

  // If textOnly is specified, only build the text-only version
  if (textOnly) {
    config.entry = {
      'widget-elevenlabs-text': './src/js/no-voice/index-text-only.js'
    };
  }

  return config;
};