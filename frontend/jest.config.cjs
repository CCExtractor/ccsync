// Activer le serializer Radix pour tous les tests
process.env.RADIX_SNAPSHOT = '1';

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': ['<rootDir>/src/$1', '<rootDir>/lib/$1'],
    '\\.(scss|sass|css)$': 'identity-obj-proxy',
  },
  transformIgnorePatterns: ['/node_modules/(?!react-toastify)'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  testMatch: ['**/__tests__/**/*.{ts,tsx}', '**/?(*.)+(spec|test).{ts,tsx}'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        diagnostics: {
          ignoreCodes: [1343],
        },
        astTransformers: {
          before: [
            {
              path: 'node_modules/ts-jest-mock-import-meta',
              options: {
                metaObjectReplacement: {
                  url: 'https://www.url.com',
                  env: {},
                },
              },
            },
          ],
        },
      },
    ],
  },
};
