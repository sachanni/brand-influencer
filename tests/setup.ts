// Test setup and configuration
import { jest } from '@jest/globals';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Date.now for consistent timestamps in tests
const mockDate = new Date('2025-01-15T10:00:00Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
Date.now = jest.fn(() => mockDate.getTime());

// Mock Math.random for predictable random values in tests
Math.random = jest.fn(() => 0.5);

// Setup and teardown hooks
beforeAll(async () => {
  // Global setup before all tests
});

afterAll(async () => {
  // Global cleanup after all tests
  jest.restoreAllMocks();
});

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

export {};