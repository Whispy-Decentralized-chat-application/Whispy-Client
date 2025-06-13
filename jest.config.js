// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  testMatch: ['**/test/**/*.test.ts'], // busca tests en la carpeta /test
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // hace que @/app/ceramic/xyz funcione en los tests
  },
  setupFiles: [],
};
