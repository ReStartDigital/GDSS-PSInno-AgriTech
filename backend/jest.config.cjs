module.exports = {
  preset: 'ts-jest/presets/default-esm', // ✨ Configures ts-jest to process native ES Modules
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true, // Forces ts-jest to output modern ESM instead of CommonJS
      },
    ],
  },
  moduleNameMapper: {
    // Maps your clean compilation '.js' runtime extensions back to matching source '.ts' files
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};