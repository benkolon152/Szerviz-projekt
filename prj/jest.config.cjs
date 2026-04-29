module.exports = {
  testEnvironment: "node",
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{js,cjs}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{js,cjs}",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  testMatch: [
    "**/__tests__/**/*.test.{js,cjs}",
    "**/?(*.)+(spec|test).{js,cjs}",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/.svelte-kit/", "/dist/"],
  moduleFileExtensions: ["js", "cjs", "json"],
};
