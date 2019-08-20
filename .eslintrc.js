module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    'airbnb',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [
    'react',
  ],
  rules: {
    'max-len': ['error', {
      code: 130,
      comments: 150,
      ignoreTrailingComments: true,
      ignoreRegExpLiterals: true,
      ignoreTemplateLiterals: true,
    }],
    'class-methods-use-this': ['error', { exceptMethods: ['toCamelCase'] }],
    "no-mixed-operators": [ 'error', { allowSamePrecedence: true } ],
    indent: ['error', 4, { MemberExpression: 0 }],
    'no-underscore-dangle': ['error', { allowAfterThis: true }],
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'no-constant-condition': ['error', { checkLoops: false }],
    'no-await-in-loop': 'off',
    radix: 'off',
  },
};
