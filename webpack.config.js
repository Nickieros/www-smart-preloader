const path = require('path');

module.exports = {
    entry: ['babel-polyfill', './src/Preloader.js'],
    output: {
        filename: './Preloader.js',
    },
    devtool: 'source-map',
    module: {
        rules: [{
            test: /\.js$/,
            include: path.resolve(__dirname, 'src/'),
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env'],
                },
            },
        },
        ],
    },
    plugins: [
    ],
};
