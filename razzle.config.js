const path = require('path');
const autoprefixer = require('autoprefixer');
const makeLoaderFinder = require('razzle-dev-utils/makeLoaderFinder');
const fileLoaderFinder = makeLoaderFinder('file-loader');
const eslintLoaderFinder = makeLoaderFinder('eslint-loader');

const projectRootPath = path.resolve(__dirname, './');

module.exports = {
  modify: (config, { target, dev }, webpack) => {
    const BASE_CSS_LOADER = {
      loader: 'css-loader',
      options: {
        importLoaders: 2,
        sourceMap: true,
        localIdentName: '[name]__[local]___[hash:base64:5]',
      },
    };

    const POST_CSS_LOADER = {
      loader: require.resolve('postcss-loader'),
      options: {
        // Necessary for external CSS imports to work
        // https://github.com/facebookincubator/create-react-app/issues/2677
        ident: 'postcss',
        plugins: () => [
          require('postcss-flexbugs-fixes'),
          autoprefixer({
            browsers: [
              '>1%',
              'last 4 versions',
              'Firefox ESR',
              'not ie < 9', // React doesn't support IE8 anyway
            ],
            flexbox: 'no-2009',
          }),
        ],
      },
    };
    const LESSLOADER = {
      test: /\.less$/,
      include: [
        path.resolve(__dirname, './theme'),
        /node_modules\/semantic-ui-less/,
      ],
      use: [
        {
          loader: 'style-loader',
        },
        BASE_CSS_LOADER,
        POST_CSS_LOADER,
        {
          loader: 'less-loader',
          options: {
            outputStyle: 'expanded',
            sourceMap: true,
          },
        },
      ],
    };

    const SVGLOADER = {
      test: /\.svg$/,
      include: [
        path.resolve(__dirname, './src/icons'),
        /node_modules\/@plone\/plone-react\/src\/icons/,
      ],
      use: [
        {
          loader: 'svg-loader',
        },
        {
          loader: 'svgo-loader',
          options: {
            plugins: [
              { removeTitle: true },
              { convertPathData: false },
              { removeUselessStrokeAndFill: true },
              { removeViewBox: false },
            ],
          },
        },
      ],
    };

    if (target === 'web') {
      config.plugins.unshift(
        new webpack.DefinePlugin({
          __CLIENT__: true,
          __SERVER__: false,
        }),
      );
    }

    if (target === 'node') {
      config.plugins.unshift(
        new webpack.DefinePlugin({
          __CLIENT__: false,
          __SERVER__: true,
        }),
      );
    }

    config.module.rules.push(LESSLOADER);
    config.module.rules.push(SVGLOADER);

    // Don't load config|variables|overrides) files with file-loader
    // Don't load SVGs from ./src/icons with file-loader
    const fileLoader = config.module.rules.find(fileLoaderFinder);
    fileLoader.exclude = [
      /\.(config|variables|overrides)$/,
      path.join(__dirname, 'src', 'icons'),
      ...fileLoader.exclude,
    ];

    const eslintLoader = config.module.rules.find(eslintLoaderFinder);
    eslintLoader.exclude = [path.join(__dirname, 'src', 'develop')];

    config.resolve.alias = {
      ...config.resolve.alias,
      '../../theme.config$': `${projectRootPath}/theme/site/theme.config`,
      '@plone/plone-react': `${projectRootPath}/src/develop/plone-react/src/`,
    };

    return config;
  },
};
