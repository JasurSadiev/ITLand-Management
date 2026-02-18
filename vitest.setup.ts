import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock ResizeObserver which is missing in JSDOM
// It must be a constructor (class)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Alternatively, use a class if the above still fails
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
global.ResizeObserver = MockResizeObserver as any
