/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ['./jest.setup.js'],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {}],
  },
};