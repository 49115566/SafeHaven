module.exports = {
  testEnvironment: 'node',
  testTimeout: 15000, // 15 seconds for async tests with setTimeout
  collectCoverageFrom: [
    '../*.js',
    '!../node_modules/**',
    '!../coverage/**'
  ],
  coverageReporters: [
    'text',
    'lcov'
  ],
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};