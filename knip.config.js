// knip.config.js — Dead code detection
// Docs: https://knip.dev/overview/configuration
module.exports = {
  entry: ['src/**/*.{ts,tsx,js,jsx}'],
  project: ['scripts/**/*.{js,mjs,cjs}'],
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**', '**/coverage/**'],
  ignoreDependencies: [],
  ignoreBinaries: [],
}
