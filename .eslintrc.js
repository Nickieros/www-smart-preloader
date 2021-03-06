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
    radix: 'off',
    indent: ['error', 4, { MemberExpression: 0 }],
    'arrow-parens': ['error', 'as-needed', { 'requireForBlockBody': false }],
    'import/extensions': 'off',
    'max-len': ['error', { code: 130, comments: 150, ignoreTrailingComments: true, ignoreRegExpLiterals: true, ignoreTemplateLiterals: true, }],
    'class-methods-use-this': 'off', // ['error', { exceptMethods: ['toCamelCase'] }],
    'no-underscore-dangle': ['error', { allowAfterThis: true }],
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'no-constant-condition': ['error', { checkLoops: false }],
    'no-await-in-loop': 'off',
    'no-trailing-spaces': ['error', { skipBlankLines: true }],
    'no-multi-assign': 'off',
    'no-param-reassign': 'off',
    'no-unused-vars': ['error', { 'vars': 'local' }],
    'no-console': ['error', { allow: ['error'] }],
    'no-multi-spaces': ['error', { exceptions: { 'VariableDeclarator': true, 'ImportDeclaration': true } }],
    'no-mixed-operators': ['error',{'groups': [
        ['&', '|', '^', '~', '<<', '>>', '>>>'],
        ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
        ['&&', '||'],
        ['in', 'instanceof']]}],
    // 'no-underscore-dangle': 'off',
  },
};
