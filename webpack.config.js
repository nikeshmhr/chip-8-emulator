const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");


module.exports = {
    entry: {
        index: './src/index.ts'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "./index.html" }
            ],
        }),
        new CopyPlugin({
            patterns: [
                { from: "./rom", to: "rom" }
            ],
        })
    ],
};