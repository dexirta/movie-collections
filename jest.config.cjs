/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-preset-angular',
  rootDir: __dirname,
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.spec.ts',
    '!src/app/testing/**/*.ts',
  ],
  coverageThreshold: {
    'src/app/state/**/*.ts': {
      statements: 80,
      branches: 60,
      functions: 80,
      lines: 80,
    },
    'src/app/core/**/*.ts': {
      statements: 80,
      branches: 50,
      functions: 80,
      lines: 80,
    },
    global: {
      statements: 65,
      branches: 50,
      functions: 65,
      lines: 65,
    },
  },
};
