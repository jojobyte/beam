module.exports = {
  root: true,
  parserOptions: { parser: 'babel-eslint' },
  extends: [
    '@jsdoc',
  ],
  rules: {
    'arrow-parens': 0,
    'generator-star-spacing': 0,
    'global-require': 0,
    'import/no-unresolved': 0,
    'import/extensions': 0,
    'import/newline-after-import': 0,
    'no-param-reassign': 0,
    'no-multi-assign': 0,
    'no-shadow': 0,
    'no-unused-vars': ['error', { 'args': 'none' }],
    'no-console': ['error', { 'allow': ['log', 'warn', 'error'] }]
  }
}