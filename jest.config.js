export default {
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!(svelte|@sveltejs)/)'
  ],
  // Use the experimental vm module to support ESM in Jest
  experimental: {
    vm: true
  }
};
