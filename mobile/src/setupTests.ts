import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage globally
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Global test timeout
jest.setTimeout(10000);