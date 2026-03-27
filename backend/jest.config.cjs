/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  setupFiles: ["<rootDir>/tests/setup-env.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup-db.ts"],
  testMatch: ["**/*.test.ts"],
  clearMocks: true,
};
