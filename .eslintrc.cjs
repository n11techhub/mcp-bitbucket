module.exports = {
  env: {
    es2021: true,
    node: true,
    jest: true, // Assuming Jest is used for testing based on devDependencies
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended', // Uses recommended rules from @typescript-eslint/eslint-plugin
    'plugin:security-node/recommended',
  ],
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser for TypeScript
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json', // Points to your tsconfig.json for type-aware linting
  },
  plugins: [
    '@typescript-eslint',
    'security-node',
  ],
  rules: {
    // You can add or override rules here. For example:
    // '@typescript-eslint/no-explicit-any': 'warn',
    // 'no-console': 'warn', // Example: discourage console.log in production code
  },
  ignorePatterns: [
    'build/',        // Ignore the build output directory
    'node_modules/', // Ignore node_modules
    'coverage/',     // Ignore coverage reports
    'dist/',         // Commonly used for distribution files
    '.eslintrc.cjs',  // ESLint should not lint its own config file by default with this setup
  ],
};
