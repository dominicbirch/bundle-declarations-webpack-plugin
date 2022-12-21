import {resolve} from 'path';
import BundleDeclarationsWebpackPlugin from './dist/index.js';

const
	{name: packageName} = await import('./package.json', {assert: {type: 'json'}});
const outDir = resolve('./lib');

/** @type {import("webpack").Configuration} */
export default {
	target: 'node',
	mode: 'production',
	entry: './src/index.ts',
	output: {
		filename: 'index.js',
		path: outDir,
		pathinfo: false,
		publicPath: '/',
		library: packageName,
		libraryTarget: 'umd',
		libraryExport: 'default',
		umdNamedDefine: true,
		clean: true,
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx'],
		modules: ['node_modules'],
	},
	module: {
		rules: [
			{
				test: /\.ts$/i,
				include: resolve('./src'),
				exclude: /\.test\.[tj]s$/i,
				use: {
					loader: 'ts-loader',
					options: {
						onlyCompileBundledFiles: true,
						experimentalWatchApi: false,
					},
				},
			},
		],
	},
	externalsPresets: {node: true},
	externals: {
		webpack: 'webpack',
		'dts-bundle-generator': 'dts-bundle-generator',
	},
	plugins: [
		new BundleDeclarationsWebpackPlugin({
			entry: './src/index.ts',
			outFile: './dts/index.d.ts',
		}),
		c => c.hooks.shouldEmit.tap('SuppressEmit', () => false),
	],
	optimization: {
		usedExports: true,
	},
};
