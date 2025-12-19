import { beforeAll, afterEach, afterAll } from 'vitest'

// Setup global mocks
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true
    })
  })

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  } as any

  // Mock navigator.geolocation
  Object.defineProperty(navigator, 'geolocation', {
    writable: true,
    value: {
      getCurrentPosition: (success: Function) => {
        success({
          coords: {
            latitude: -25.9655,
            longitude: 32.5832,
            accuracy: 10
          }
        })
      },
      watchPosition: () => 1,
      clearWatch: () => {}
    }
  })
})

// Cleanup after each test
afterEach(() => {
  // Clear any mocks or timers
  vi.clearAllMocks()
  vi.clearAllTimers()
})

afterAll(() => {
  // Final cleanup
})

