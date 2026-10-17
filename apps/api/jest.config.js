/** @type {import('jest').Config} */
const base = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }] },
  testEnvironment: 'node',
  moduleNameMapper: { '^@findit/shared$': '<rootDir>/../../packages/shared/src/types.ts' },
};

module.exports = {
  projects: [
    {
      ...base,
      displayName: 'unit',
      rootDir: __dirname,
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
    },
    {
      ...base,
      displayName: 'e2e',
      rootDir: __dirname,
      testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
      globalSetup: '<rootDir>/test/global-setup.ts',
      setupFiles: ['<rootDir>/test/env.ts'],
    },
  ],
  // 시드가 처음 사진을 만들 때 몇 초 걸린다
  testTimeout: 30000,
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/**/*.spec.ts'],
  coverageReporters: ['text-summary', 'text'],
  coverageThreshold: { global: { statements: 80 } },
};
