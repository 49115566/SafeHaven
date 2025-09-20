// Jest setup file for demo tests

// Mock timers for tests that use setTimeout
jest.useFakeTimers();

// Increase timeout for async operations
jest.setTimeout(15000);

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Restore console after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Clean up after all tests
afterAll(() => {
  global.console = originalConsole;
  jest.useRealTimers();
});