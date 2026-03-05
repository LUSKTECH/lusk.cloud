/**
 * Unit Tests for Smooth Scroll Module
 * Lusk.cloud Landing Page
 *
 * Tests the smooth scroll functionality for navigation
 * Validates: Requirements 2.3
 */

// Mock requestAnimationFrame for testing
let rafCallbacks = [];
let rafId = 0;
let rafMock;
let cancelRafMock;

beforeAll(() => {
  // Mock requestAnimationFrame
  rafMock = jest.fn(callback => {
    rafId++;
    rafCallbacks.push({ id: rafId, callback });
    return rafId;
  });

  cancelRafMock = jest.fn(id => {
    rafCallbacks = rafCallbacks.filter(item => item.id !== id);
  });

  global.requestAnimationFrame = rafMock;
  global.cancelAnimationFrame = cancelRafMock;
});

beforeEach(() => {
  // Reset DOM
  document.body.innerHTML = '';
  rafCallbacks = [];
  rafId = 0;

  // Reset scroll position
  window.scrollY = 0;
  window.pageYOffset = 0;

  // Mock scrollTo
  window.scrollTo = jest.fn();

  // Mock history.pushState
  window.history.pushState = jest.fn();

  // Clear module cache and window object
  delete window.LuskSmoothScroll;
  jest.resetModules();

  // Restore RAF mocks after resetModules
  global.requestAnimationFrame = rafMock;
  global.cancelAnimationFrame = cancelRafMock;

  // Clear RAF mock calls
  rafMock.mockClear();
  cancelRafMock.mockClear();
});

afterEach(() => {
  jest.clearAllMocks();
});

// Helper to execute pending RAF callbacks
function flushRAF(timestamp = 0) {
  const callbacks = [...rafCallbacks];
  rafCallbacks = [];
  callbacks.forEach(item => item.callback(timestamp));
}

// Helper to run animation to completion
function runAnimationToCompletion(duration = 800) {
  let time = 0;
  const step = 16; // ~60fps

  while (time <= duration + step) {
    flushRAF(time);
    time += step;
  }
}

// Helper to load the module with proper DOM setup
function loadModuleWithDOM(html = '<div></div>') {
  document.body.innerHTML = html;
  require('../js/smooth-scroll.js');
}

describe('Smooth Scroll Module', () => {
  describe('Module Loading', () => {
    test('should expose LuskSmoothScroll on window after loading', () => {
      loadModuleWithDOM(`
                <nav>
                    <a href="#test" class="nav-link">Test</a>
                </nav>
                <section id="test">Test</section>
            `);

      expect(window.LuskSmoothScroll).toBeDefined();
      expect(typeof window.LuskSmoothScroll.init).toBe('function');
      expect(typeof window.LuskSmoothScroll.scrollTo).toBe('function');
      expect(typeof window.LuskSmoothScroll.destroy).toBe('function');
      expect(typeof window.LuskSmoothScroll.getNavOffset).toBe('function');
    });
  });

  describe('smoothScrollTo()', () => {
    beforeEach(() => {
      // Set up DOM with sections
      document.body.innerHTML = `
                <nav>
                    <a href="#hero" class="nav-link">Home</a>
                    <a href="#services" class="nav-link">Services</a>
                    <a href="#about" class="nav-link">About</a>
                    <a href="#contact" class="nav-link">Contact</a>
                </nav>
                <section id="hero" style="height: 500px;">Hero</section>
                <section id="services" style="height: 500px;">Services</section>
                <section id="about" style="height: 500px;">About</section>
                <section id="contact" style="height: 500px;">Contact</section>
            `;

      // Mock getBoundingClientRect for sections
      const sections = {
        hero: { top: 0 },
        services: { top: 500 },
        about: { top: 1000 },
        contact: { top: 1500 },
      };

      Object.keys(sections).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.getBoundingClientRect = jest.fn(() => ({
            top: sections[id].top - window.scrollY,
            left: 0,
            right: 0,
            bottom: 0,
            width: 0,
            height: 500,
          }));
        }
      });

      require('../js/smooth-scroll.js');
    });

    test('should return true when target element exists', () => {
      const result = window.LuskSmoothScroll.scrollTo('services');
      expect(result).toBe(true);
    });

    test('should return false when target element does not exist', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = window.LuskSmoothScroll.scrollTo('nonexistent');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Target element #nonexistent not found'),
      );

      consoleSpy.mockRestore();
    });

    test('should handle targetId with # prefix', () => {
      const result = window.LuskSmoothScroll.scrollTo('#services');
      expect(result).toBe(true);
    });

    test('should call requestAnimationFrame for animation', () => {
      window.LuskSmoothScroll.scrollTo('services');

      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    test('should call window.scrollTo during animation', () => {
      window.LuskSmoothScroll.scrollTo('services');

      // Execute first animation frame
      flushRAF(0);

      expect(window.scrollTo).toHaveBeenCalled();
    });

    test('should update URL hash after animation completes', () => {
      window.LuskSmoothScroll.scrollTo('services');

      // Run animation to completion
      runAnimationToCompletion();

      expect(window.history.pushState).toHaveBeenCalledWith(null, null, '#services');
    });

    test('should use custom offset when provided', () => {
      const customOffset = 100;
      window.LuskSmoothScroll.scrollTo('services', customOffset);

      // Animation should start
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('getNavOffset()', () => {
    beforeEach(() => {
      loadModuleWithDOM(`
                <nav>
                    <a href="#test" class="nav-link">Test</a>
                </nav>
                <section id="test">Test</section>
            `);
    });

    test('should return default nav height when CSS variable not set', () => {
      const offset = window.LuskSmoothScroll.getNavOffset();
      expect(offset).toBe(70); // Default CONFIG.navHeight
    });

    test('should read nav height from CSS variable when available', () => {
      document.documentElement.style.setProperty('--nav-height', '80px');

      const offset = window.LuskSmoothScroll.getNavOffset();
      expect(offset).toBe(80);

      // Cleanup
      document.documentElement.style.removeProperty('--nav-height');
    });
  });

  describe('initSmoothScroll()', () => {
    beforeEach(() => {
      document.body.innerHTML = `
                <nav>
                    <a href="#hero" class="nav-link">Home</a>
                    <a href="#services" class="nav-link">Services</a>
                </nav>
                <section id="hero">Hero</section>
                <section id="services">Services</section>
            `;

      // Mock getBoundingClientRect
      document.getElementById('hero').getBoundingClientRect = jest.fn(() => ({
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 500,
      }));
      document.getElementById('services').getBoundingClientRect = jest.fn(() => ({
        top: 500,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 500,
      }));

      require('../js/smooth-scroll.js');
    });

    test('should attach click listeners to nav links', () => {
      const link = document.querySelector('a[href="#services"]');

      // Simulate click
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });

      link.dispatchEvent(event);

      // Should have started animation
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    test('should prevent default anchor behavior on click', () => {
      const link = document.querySelector('a[href="#services"]');

      // Create a custom event that we can track
      let defaultPrevented = false;
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });

      // Override preventDefault to track if it was called
      const originalPreventDefault = event.preventDefault.bind(event);
      event.preventDefault = function () {
        defaultPrevented = true;
        originalPreventDefault();
      };

      link.dispatchEvent(event);

      expect(defaultPrevented).toBe(true);
    });
  });

  describe('destroy()', () => {
    beforeEach(() => {
      document.body.innerHTML = `
                <nav>
                    <a href="#services" class="nav-link">Services</a>
                </nav>
                <section id="services">Services</section>
            `;

      document.getElementById('services').getBoundingClientRect = jest.fn(() => ({
        top: 500,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 500,
      }));

      require('../js/smooth-scroll.js');
    });

    test('should remove click listeners from nav links', () => {
      // Destroy smooth scroll
      window.LuskSmoothScroll.destroy();

      // Clear previous RAF calls
      global.requestAnimationFrame.mockClear();

      // Try clicking a link
      const link = document.querySelector('a[href="#services"]');
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });

      link.dispatchEvent(event);

      // Should NOT have started animation (listener removed)
      expect(global.requestAnimationFrame).not.toHaveBeenCalled();
    });
  });

  describe('Easing Function', () => {
    beforeEach(() => {
      loadModuleWithDOM(`
                <nav>
                    <a href="#test" class="nav-link">Test</a>
                </nav>
                <section id="test">Test</section>
            `);
    });

    test('should return 0 at start (t=0)', () => {
      const result = window.LuskSmoothScroll._easeInOutCubic(0);
      expect(result).toBe(0);
    });

    test('should return 1 at end (t=1)', () => {
      const result = window.LuskSmoothScroll._easeInOutCubic(1);
      expect(result).toBe(1);
    });

    test('should return 0.5 at midpoint (t=0.5)', () => {
      const result = window.LuskSmoothScroll._easeInOutCubic(0.5);
      expect(result).toBe(0.5);
    });

    test('should ease in during first half (value < t)', () => {
      const t = 0.25;
      const result = window.LuskSmoothScroll._easeInOutCubic(t);
      expect(result).toBeLessThan(t);
    });

    test('should ease out during second half (value > t)', () => {
      const t = 0.75;
      const result = window.LuskSmoothScroll._easeInOutCubic(t);
      expect(result).toBeGreaterThan(t);
    });
  });

  describe('URL Hash Handling', () => {
    beforeEach(() => {
      document.body.innerHTML = `
                <nav>
                    <a href="#services" class="nav-link">Services</a>
                </nav>
                <section id="services">Services</section>
            `;

      document.getElementById('services').getBoundingClientRect = jest.fn(() => ({
        top: 500,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 500,
      }));

      require('../js/smooth-scroll.js');
    });

    test('should update hash using history.pushState', () => {
      window.LuskSmoothScroll._updateUrlHash('services');

      expect(window.history.pushState).toHaveBeenCalledWith(null, null, '#services');
    });

    test('should fallback to location.hash when pushState unavailable', () => {
      const originalPushState = window.history.pushState;
      window.history.pushState = null;

      // This should not throw
      expect(() => {
        window.LuskSmoothScroll._updateUrlHash('services');
      }).not.toThrow();

      // Restore
      window.history.pushState = originalPushState;
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      document.body.innerHTML = `
                <nav>
                    <a href="#" class="nav-link">Empty</a>
                    <a href="#services" class="nav-link">Services</a>
                </nav>
                <section id="services">Services</section>
            `;

      document.getElementById('services').getBoundingClientRect = jest.fn(() => ({
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 500,
      }));

      require('../js/smooth-scroll.js');
    });

    test('should handle empty hash links gracefully', () => {
      const link = document.querySelector('a[href="#"]');

      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });

      // Should not throw
      expect(() => {
        link.dispatchEvent(event);
      }).not.toThrow();
    });

    test('should handle scroll to current position (no distance)', () => {
      // Target is at current scroll position
      window.scrollY = 0;

      const result = window.LuskSmoothScroll.scrollTo('services');

      // Should still return true and update hash
      expect(result).toBe(true);
    });

    test('should jump immediately when distance is very small', () => {
      // Set up target at almost current position (distance < 1)
      // distance = targetRect.top + startPosition - scrollOffset
      // We need: |targetRect.top + 0 - 70| < 1
      // So targetRect.top should be between 69 and 71
      document.getElementById('services').getBoundingClientRect = jest.fn(() => ({
        top: 70.5, // This gives distance = 70.5 + 0 - 70 = 0.5 < 1
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 500,
      }));

      // Clear RAF mock to verify it's NOT called (we jump instead of animate)
      rafMock.mockClear();

      const result = window.LuskSmoothScroll.scrollTo('services');

      // Should return true (jumped immediately)
      expect(result).toBe(true);

      // RAF should NOT have been called since we jumped
      expect(rafMock).not.toHaveBeenCalled();
    });
  });

  describe('No Navigation Links', () => {
    test('should warn when no navigation links found', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      document.body.innerHTML = '<div>No links here</div>';
      require('../js/smooth-scroll.js');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No navigation links found'));

      consoleSpy.mockRestore();
    });
  });
});

describe('DOMContentLoaded initialization', () => {
  test('should add DOMContentLoaded listener when document is loading', () => {
    document.body.innerHTML = `
      <nav>
        <a href="#test" class="nav-link">Test</a>
      </nav>
      <section id="test">Test</section>
    `;

    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    });

    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

    require('../js/smooth-scroll.js');

    expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));

    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      configurable: true,
    });
    addEventListenerSpy.mockRestore();
  });
});

describe('Initial hash handling', () => {
  test('should scroll to hash on page load', () => {
    // Set up DOM first
    document.body.innerHTML = `
      <nav>
        <a href="#services" class="nav-link">Services</a>
      </nav>
      <section id="services">Services</section>
    `;

    document.getElementById('services').getBoundingClientRect = jest.fn(() => ({
      top: 500,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 500,
    }));

    // Set the hash before loading the module
    window.location.hash = '#services';

    // Use fake timers
    jest.useFakeTimers();

    // Ensure RAF mock is in place
    global.requestAnimationFrame = rafMock;

    // Load the module - this will call initSmoothScroll which calls handleInitialHash
    require('../js/smooth-scroll.js');

    // Run all pending timers (including the 100ms setTimeout in handleInitialHash)
    jest.runAllTimers();

    // Check that RAF was called (smoothScrollTo calls requestAnimationFrame)
    expect(rafMock).toHaveBeenCalled();

    // Clean up hash
    window.location.hash = '';

    jest.useRealTimers();
  });
});

describe('Focus target accessibility', () => {
  test('should handle focusable elements without adding tabindex', () => {
    document.body.innerHTML = `
      <nav>
        <a href="#link-target" class="nav-link">Link</a>
      </nav>
      <a href="#" id="link-target">Focusable Link</a>
    `;

    document.getElementById('link-target').getBoundingClientRect = jest.fn(() => ({
      top: 500,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 100,
    }));

    require('../js/smooth-scroll.js');

    const target = document.getElementById('link-target');
    const focusSpy = jest.spyOn(target, 'focus');

    window.LuskSmoothScroll.scrollTo('link-target');

    // Run animation to completion
    let time = 0;
    while (time <= 900) {
      const callbacks = [...rafCallbacks];
      rafCallbacks = [];
      callbacks.forEach(item => item.callback(time));
      time += 16;
    }

    expect(focusSpy).toHaveBeenCalled();
    // Should not have tabindex since it's naturally focusable
    expect(target.hasAttribute('tabindex')).toBe(false);
  });

  test('should add and remove tabindex for non-focusable elements', () => {
    jest.useFakeTimers();

    document.body.innerHTML = `
      <nav>
        <a href="#section-target" class="nav-link">Section</a>
      </nav>
      <section id="section-target">Section Content</section>
    `;

    document.getElementById('section-target').getBoundingClientRect = jest.fn(() => ({
      top: 500,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 100,
    }));

    // Ensure RAF mock is in place
    global.requestAnimationFrame = rafMock;

    require('../js/smooth-scroll.js');

    const target = document.getElementById('section-target');
    const focusSpy = jest.spyOn(target, 'focus');

    window.LuskSmoothScroll.scrollTo('section-target');

    // Run animation to completion
    let time = 0;
    while (time <= 900) {
      const callbacks = [...rafCallbacks];
      rafCallbacks = [];
      callbacks.forEach(item => item.callback(time));
      time += 16;
    }

    expect(focusSpy).toHaveBeenCalled();
    // Should have tabindex=-1 temporarily
    expect(target.getAttribute('tabindex')).toBe('-1');

    // Advance timers to trigger tabindex removal
    jest.advanceTimersByTime(150);

    // Tabindex should be removed
    expect(target.hasAttribute('tabindex')).toBe(false);

    jest.useRealTimers();
  });
});
