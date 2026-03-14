module.exports = {
  // Add more custom options here
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/config/jest-setup.js'],
  testMatch: [
    '**/__tests__/**/*.(test|spec).[jt]s?(x)',
    '!**/__tests__/config/**/*'
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.prisma/client)/)'
  ],
  moduleNameMapper: {
    '^@prisma/client$': '<rootDir>/node_modules/@prisma/client',
    '^next-intl$': '<rootDir>/src/__tests__/config/next-intl-mock.tsx',
    '^next-intl/server$': '<rootDir>/src/__tests__/config/next-intl-server-mock.ts',
    '^next-intl/routing$': '<rootDir>/src/__tests__/config/next-intl-routing-mock.ts',
    '^@/(.*)$': '<rootDir>/$1'
  }
};
