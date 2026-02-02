/**
 * Unit Tests for Animations Module
 * Lusk.cloud Landing Page
 *
 * Tests the scroll-triggered and hover animations
 * Validates: Requirements 7.4
 */

describe('Animations Module', () => {
  let mockIntersectionObserver;
  let observerCallback;
  let observedElements;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    observedElements = [];

    // Mock IntersectionObserver
    mockIntersectionObserver = jest.fn(callback => {
      observerCallback = callback;
      return {
        observe: jest.fn(el => observedElements.push(el)),
        unobserve: jest.fn(el => {
          observedElements = observedElements.filter(e => e !== el);
        }),
        disconnect: jest.fn(() => {
          observedElements = [];
        }),
      };
    });

    global.IntersectionObserver = mockIntersectionObserver;
    global.IntersectionObserverEntry = class {
      constructor() {
        this.intersectionRatio = 0;
      }
    };
    global.IntersectionObserverEntry.prototype.intersectionRatio = 0;

    // Mock matchMedia
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    // Clear module cache
    delete window.AnimationController;
    jest.resetModules();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function loadModule() {
    require('../js/animations.js');
  }

  describe('Module Loading', () => {
    test('should expose AnimationController on window', () => {
      document.body.innerHTML = '<div data-animate="fade-in">Test</div>';
      loadModule();

      expect(window.AnimationController).toBeDefined();
      expect(typeof window.AnimationController.init).toBe('function');
    });

    test('should initialize IntersectionObserver when supported', () => {
      document.body.innerHTML = '<div data-animate="fade-in">Test</div>';
      loadModule();

      expect(mockIntersectionObserver).toHaveBeenCalled();
    });
  });

  describe('isIntersectionObserverSupported()', () => {
    test('should return true when IntersectionObserver is available', () => {
      loadModule();
      expect(window.AnimationController.isIntersectionObserverSupported()).toBe(true);
    });

    test('should return false when IntersectionObserver is not available', () => {
      delete global.IntersectionObserver;
      loadModule();
      expect(window.AnimationController.isIntersectionObserverSupported()).toBe(false);
    });
  });

  describe('prefersReducedMotion()', () => {
    test('should return false when user does not prefer reduced motion', () => {
      loadModule();
      expect(window.AnimationController.prefersReducedMotion()).toBe(false);
    });

    test('should return true when user prefers reduced motion', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
      }));

      loadModule();
      expect(window.AnimationController.prefersReducedMotion()).toBe(true);
    });
  });

  describe('handleNoSupport()', () => {
    test('should make all animated elements visible immediately', () => {
      document.body.innerHTML = `
        <div data-animate="fade-in" id="el1">Test 1</div>
        <div data-animate="fade-in-up" id="el2">Test 2</div>
      `;

      delete global.IntersectionObserver;
      loadModule();

      const el1 = document.getElementById('el1');
      const el2 = document.getElementById('el2');

      expect(el1.classList.contains('is-visible')).toBe(true);
      expect(el1.style.opacity).toBe('1');
      expect(el2.classList.contains('is-visible')).toBe(true);
    });
  });

  describe('handleReducedMotion()', () => {
    test('should show elements without animation when reduced motion preferred', () => {
      document.body.innerHTML = '<div data-animate="fade-in" id="el1">Test</div>';

      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
      }));

      loadModule();

      const el1 = document.getElementById('el1');
      expect(el1.classList.contains('is-visible')).toBe(true);
      expect(el1.style.animation).toBe('none');
    });
  });

  describe('initScrollAnimations()', () => {
    test('should observe all elements with data-animate attribute', () => {
      document.body.innerHTML = `
        <div data-animate="fade-in">Test 1</div>
        <div data-animate="fade-in-up">Test 2</div>
        <div>No animation</div>
      `;

      loadModule();

      expect(observedElements.length).toBe(2);
    });

    test('should accept custom configuration', () => {
      document.body.innerHTML = '<div data-animate="fade-in">Test</div>';
      loadModule();

      window.AnimationController.initScrollAnimations({ threshold: 0.5 });

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ threshold: 0.5 })
      );
    });
  });

  describe('handleIntersection()', () => {
    test('should add is-visible class when element intersects', () => {
      document.body.innerHTML = '<div data-animate="fade-in" id="el1">Test</div>';
      loadModule();

      const el1 = document.getElementById('el1');
      const entry = {
        isIntersecting: true,
        target: el1,
      };

      observerCallback([entry]);

      expect(el1.classList.contains('is-visible')).toBe(true);
    });

    test('should apply animation delay from data attribute', () => {
      document.body.innerHTML =
        '<div data-animate="fade-in" data-animate-delay="500" id="el1">Test</div>';
      loadModule();

      const el1 = document.getElementById('el1');
      const entry = {
        isIntersecting: true,
        target: el1,
      };

      observerCallback([entry]);

      expect(el1.style.animationDelay).toBe('500ms');
    });

    test('should unobserve element after animation when once is true', () => {
      document.body.innerHTML = '<div data-animate="fade-in" id="el1">Test</div>';
      loadModule();

      const el1 = document.getElementById('el1');
      const observer = window.AnimationController.observer;
      const entry = {
        isIntersecting: true,
        target: el1,
      };

      observerCallback([entry]);

      expect(observer.unobserve).toHaveBeenCalledWith(el1);
    });

    test('should not unobserve when data-animate-once is false', () => {
      document.body.innerHTML =
        '<div data-animate="fade-in" data-animate-once="false" id="el1">Test</div>';
      loadModule();

      const el1 = document.getElementById('el1');
      const observer = window.AnimationController.observer;
      const entry = {
        isIntersecting: true,
        target: el1,
      };

      observerCallback([entry]);

      expect(observer.unobserve).not.toHaveBeenCalled();
    });

    test('should remove is-visible class when element leaves viewport and animate-once is false', () => {
      document.body.innerHTML =
        '<div data-animate="fade-in" data-animate-once="false" id="el1" class="is-visible">Test</div>';
      loadModule();

      const el1 = document.getElementById('el1');
      const entry = {
        isIntersecting: false,
        target: el1,
      };

      observerCallback([entry]);

      expect(el1.classList.contains('is-visible')).toBe(false);
    });
  });

  describe('animateElement()', () => {
    test('should add animation type and visible class to element', () => {
      document.body.innerHTML = '<div id="el1">Test</div>';
      loadModule();

      const el1 = document.getElementById('el1');
      window.AnimationController.animateElement(el1, 'fade-in-up');

      expect(el1.dataset.animate).toBe('fade-in-up');
      expect(el1.classList.contains('is-visible')).toBe(true);
    });

    test('should handle null element gracefully', () => {
      loadModule();
      expect(() => {
        window.AnimationController.animateElement(null, 'fade-in');
      }).not.toThrow();
    });
  });

  describe('resetAnimation()', () => {
    test('should remove is-visible class from element', () => {
      document.body.innerHTML = '<div id="el1" class="is-visible">Test</div>';
      loadModule();

      const el1 = document.getElementById('el1');
      window.AnimationController.resetAnimation(el1);

      expect(el1.classList.contains('is-visible')).toBe(false);
    });

    test('should handle null element gracefully', () => {
      loadModule();
      expect(() => {
        window.AnimationController.resetAnimation(null);
      }).not.toThrow();
    });
  });

  describe('observe() and unobserve()', () => {
    test('should add element to observer', () => {
      document.body.innerHTML = '<div id="el1">Test</div>';
      loadModule();

      const el1 = document.getElementById('el1');
      const observer = window.AnimationController.observer;

      window.AnimationController.observe(el1);

      expect(observer.observe).toHaveBeenCalledWith(el1);
    });

    test('should remove element from observer', () => {
      document.body.innerHTML = '<div data-animate="fade-in" id="el1">Test</div>';
      loadModule();

      const el1 = document.getElementById('el1');
      const observer = window.AnimationController.observer;

      window.AnimationController.unobserve(el1);

      expect(observer.unobserve).toHaveBeenCalledWith(el1);
    });
  });

  describe('destroy()', () => {
    test('should disconnect observer and set to null', () => {
      document.body.innerHTML = '<div data-animate="fade-in">Test</div>';
      loadModule();

      const observer = window.AnimationController.observer;
      window.AnimationController.destroy();

      expect(observer.disconnect).toHaveBeenCalled();
      expect(window.AnimationController.observer).toBeNull();
    });
  });

  describe('Hover Animations', () => {
    test('should add is-hovered class on mouseenter for service cards', () => {
      document.body.innerHTML = '<div class="service-card" id="card1">Card</div>';
      loadModule();

      const card = document.getElementById('card1');
      card.dispatchEvent(new Event('mouseenter'));

      expect(card.classList.contains('is-hovered')).toBe(true);
    });

    test('should remove is-hovered class on mouseleave for service cards', () => {
      document.body.innerHTML = '<div class="service-card is-hovered" id="card1">Card</div>';
      loadModule();

      const card = document.getElementById('card1');
      card.dispatchEvent(new Event('mouseleave'));

      expect(card.classList.contains('is-hovered')).toBe(false);
    });

    test('should add is-hovered class on mouseenter for CTA buttons', () => {
      document.body.innerHTML = '<button class="btn-primary" id="btn1">Click</button>';
      loadModule();

      const btn = document.getElementById('btn1');
      btn.dispatchEvent(new Event('mouseenter'));

      expect(btn.classList.contains('is-hovered')).toBe(true);
    });

    test('should remove is-hovered class on mouseleave for CTA buttons', () => {
      document.body.innerHTML = '<button class="btn-secondary is-hovered" id="btn1">Click</button>';
      loadModule();

      const btn = document.getElementById('btn1');
      btn.dispatchEvent(new Event('mouseleave'));

      expect(btn.classList.contains('is-hovered')).toBe(false);
    });
  });
});

describe('DOMContentLoaded initialization', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete window.AnimationController;
    jest.resetModules();
  });

  test('should add DOMContentLoaded listener when document is loading', () => {
    document.body.innerHTML = '<div data-animate="fade-in">Test</div>';

    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
    global.IntersectionObserverEntry = class {
      constructor() {
        this.intersectionRatio = 0;
      }
    };
    global.IntersectionObserverEntry.prototype.intersectionRatio = 0;

    // Mock matchMedia
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
    }));

    // Mock readyState before loading module
    const originalReadyState = Object.getOwnPropertyDescriptor(document, 'readyState');
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    });

    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

    require('../js/animations.js');

    expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));

    // Restore
    if (originalReadyState) {
      Object.defineProperty(document, 'readyState', originalReadyState);
    } else {
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        configurable: true,
      });
    }
    addEventListenerSpy.mockRestore();
  });
});
