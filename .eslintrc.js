module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: 'airbnb-base',
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'max-len': 'off', // "This ain't 1982, who cares" -J.Artis
    'linebreak-style': ['off', 'windows'], // deals with git wanting to checkout crlf on windows and lf on not-windows
  },
  ignorePatterns: ['dist/*', 'dist/**/*'],
  // note: true = 'writable', false = 'readonly'
  globals: {},
};
