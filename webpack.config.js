// webpack v4
//
// At its core, webpack is a static module bundler for modern JavaScript applications. When webpack processes your application,
// it internally builds a dependency graph which maps every module your project needs and generates one or more bundles.

// A resolver is a library which helps in locating a module by its absolute path.
const path = require('path');
// The HtmlWebpackPlugin simplifies creation of HTML files to serve your webpack bundles.
// This is especially useful for webpack bundles that include a hash in the filename which changes every compilation.
const HtmlWebpackPlugin = require("html-webpack-plugin");
// This plugin extracts CSS into separate files. It creates a CSS file per JS file which contains CSS.
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const pageTitle = 'Esri Drought Aware';

module.exports = (env, argv) => {

    // Entry
    // An entry point indicates which module webpack should use to begin building out its internal dependency graph.
    // webpack will figure out which other modules and libraries that entry point depends on (directly and indirectly).
    //
    // Output
    // The output property tells webpack where to emit the bundles it creates and how to name these files. It defaults to ./dist/main.js
    // for the main output file and to the ./dist folder for any other generated file.
    //
    // Loaders
    // Out of the box, webpack only understands JavaScript and JSON files. Loaders allow webpack to process other types of files and convert
    // them into valid modules that can be consumed by your application and added to the dependency graph.

    const devMode = argv.mode === 'development' ? true : false;

    return {
        entry: {
            drought: path.resolve(__dirname, "./src/assets/js/drought/index.js")
        },
        output: {
            path: path.join(__dirname, "./dist"),
            filename: "[name].[chunkhash].js"
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader"
                    }
                },
                {
                    test: /\.(sa|sc|c)ss$/,
                    use: [
                        devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
                        {
                            loader: "css-loader", options: {
                                sourceMap: true
                            }
                        }, {
                            loader: "sass-loader", options: {
                                sourceMap: true
                            }
                        }
                    ]
                },
                {
                    test: /\.svg$/,
                    loader: "url-loader",
                    options: {
                        limit: 25000,
                        fallback: {
                            loader: "file-loader",
                            options: {
                                name: "[name].[hash].[ext]",
                                outputPath: (url, resourcePath, context) => {
                                    return `assets/svg/${url}`;
                                },
                                publicPath: function(url) {
                                    return '/assets/svg/' + url;
                                },
                            }
                        }
                    }
                },
                {
                    test: /\.(csv|tsv)$/i,
                    use: "csv-loader",
                },
                {
                    test: /\.(woff|ttf|eot)$/,
                    loader: "file-loader",
                    options: {
                        name: '[name].[hash].[ext]',
                        outputPath: (url, resourcePath, context) => {
                            return `assets/fonts/${url}`;
                        },
                        publicPath: function(url) {
                            return '/droughtaware/assets/fonts/' + url;
                        },
                    }
                },
                // { test: /\.(png|jpg|gif)$/,  loader: "url-loader?limit=25000" },
                {
                    test: /\.(png|jpg|gif)$/i,
                    loader: "file-loader",
                    options: {
                        name: '[name].[hash].[ext]',
                        outputPath: (url, resourcePath, context) => {
                            return `assets/img/${url}`;
                        },
                        publicPath: function(url) {
                            return '/assets/img/' + url;
                        },
                    }
                },
            ]
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: '[name].[hash].css',
                chunkFilename: '[id].[hash].css',
            }),
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, './src/layouts/index.html'),
                filename: 'index.html',
                chunks: []
            }),
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, './src/layouts/site.layout.html'),
                filename: 'drought/index.html',
                pageName: 'drought',
                chunks: ['drought'],
                title: pageTitle,
                minify: {
                    html5                          : true,
                    collapseWhitespace             : true,
                    minifyCSS                      : true,
                    minifyJS                       : true,
                    minifyURLs                     : false,
                    removeComments                 : true,
                    removeEmptyAttributes          : true,
                    removeOptionalTags             : true,
                    removeRedundantAttributes      : true,
                    removeScriptTypeAttributes     : true,
                    removeStyleLinkTypeAttributes : true,
                    useShortDoctype                : true
                }
            }),
        ]
    };
}

