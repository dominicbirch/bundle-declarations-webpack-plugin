/** @type {import('eslint').ESLint.Options} */
module.exports = {
	env: {
		browser: false,
		es2021: true,
	},
	extends: [
		'xo',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	plugins: [
		'@typescript-eslint',
	],
	ignorePatterns: [
		'lib/*.*',
	],
	rules: {},
};
