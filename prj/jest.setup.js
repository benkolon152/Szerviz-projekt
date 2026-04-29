/**
 * Jest Setup File
 * Global test configuration and mocks
 */

// Mock fetch for API testing
if (typeof global.fetch === "undefined") {
  global.fetch = jest.fn();
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

if (typeof global.localStorage === "undefined") {
  Object.defineProperty(global, "localStorage", {
    value: localStorageMock,
    writable: true,
  });
}

// Mock window.alert and window.confirm
if (typeof global.alert === "undefined") {
  global.alert = jest.fn();
}

if (typeof global.confirm === "undefined") {
  global.confirm = jest.fn(() => true);
}

if (typeof global.prompt === "undefined") {
  global.prompt = jest.fn();
}

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  if (localStorageMock.getItem) {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  }
});

// Suppress console errors in tests (optional)
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Not implemented: HTMLFormElement.prototype.submit")
    ) {
      return;
    }
    originalError.call(console, ...args);
  });

  console.warn = jest.fn((...args) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning") || args[0].includes("Svelte"))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  });
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
