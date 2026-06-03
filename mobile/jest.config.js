module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|@expo/.*|@react-navigation/.*))',
  ],
};
