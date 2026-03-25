module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', './jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  testPathIgnorePatterns: ['/node_modules/', '/.claude/'],
  collectCoverageFrom: [
    'store/**/*.ts',
    'services/**/*.ts',
    'hooks/**/*.ts',
    'lib/**/*.ts',
    'app/(auth)/**/*.tsx',
  ],
  coverageReporters: ['text', 'lcov'],
  moduleNameMapper: {
    // Fix AsyncStorage native module null in test environment
    '@react-native-async-storage/async-storage': require.resolve(
      '@react-native-async-storage/async-storage/jest/async-storage-mock'
    ),
  },
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '(jest-)?react-native' +
      '|@react-native(-community)?' +
      '|expo(nent)?' +
      '|@expo(nent)?/.*' +
      '|@expo-google-fonts/.*' +
      '|react-navigation' +
      '|@react-navigation/.*' +
      '|@unimodules/.*' +
      '|unimodules' +
      '|native-base' +
      '|react-native-svg' +
      '|victory-native' +
      '|@shopify/.*' +
      '|nativewind' +
      '|zustand' +
      '|i18n-js' +
      '|@supabase/.*' +
      '))',
  ],
};
