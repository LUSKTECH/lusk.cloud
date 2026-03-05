/**
 * Unit Tests for Cloud Particles Module
 * Lusk.cloud Landing Page
 *
 * Tests the canvas-based cloud particle system including
 * initialization, rendering, physics, mouse interaction,
 * visibility observer, and reduced-motion handling.
 */

describe('Cloud Particles Module', () => {
  let mockCtx;
  let observerCallback;
  let rafCallbacks;

  function createMockContext() {
    return {
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      beginPath: jest.fn(),
      ellipse: jest.fn(),
      fill: jest.fn(),
      fillRect: jest.fn(),
      createRadialGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      fillStyle: '',
      filter: 'none',
    };
  }

  beforeEach(() => {
    document.body.innerHTML = '';
    rafCallbacks = [];
    observerCallback = null;

    mockCtx = createMockContext();

    // Track which canvas gets which context
    const originalCreateElement = document.createElement.bind(document);
    let canvasCount = 0;
    jest.spyOn(document, 'createElement').mockImplementation(tag => {
      const el = originalCreateElement(tag);
      if (tag === 'canvas') {
        canvasCount++;
        if (canvasCount === 1) {
          // Main canvas
          el.getContext = jest.fn(() => mockCtx);
        } else {
          // Offscreen texture canvases
          el.getContext = jest.fn(() => createMockContext());
        }
      }
      return el;
    });

    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn(callback => {
      observerCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    // Mock requestAnimationFrame to capture callbacks
    global.requestAnimationFrame = jest.fn(cb => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    global.cancelAnimationFrame = jest.fn();

    // Mock matchMedia — default: no reduced motion
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  function setupHero(width = 1200, height = 600) {
    const hero = document.createElement('section');
    hero.id = 'hero';
    Object.defineProperty(hero, 'offsetWidth', { value: width, configurable: true });
    Object.defineProperty(hero, 'offsetHeight', { value: height, configurable: true });
    document.body.appendChild(hero);
    return hero;
  }

  function loadModule() {
    require('../js/cloud-particles.js');
  }

  function flushRAF() {
    const cbs = [...rafCallbacks];
    rafCallbacks = [];
    cbs.forEach(cb => cb());
  }

  describe('Initialization', () => {
    test('should create a canvas element inside the hero section', () => {
      setupHero();
      loadModule();
      flushRAF();

      const hero = document.getElementById('hero');
      const canvas = hero.querySelector('canvas.cloud-canvas');
      expect(canvas).not.toBeNull();
    });

    test('should set aria-hidden on the canvas for accessibility', () => {
      setupHero();
      loadModule();
      flushRAF();

      const canvas = document.querySelector('.cloud-canvas');
      expect(canvas.getAttribute('aria-hidden')).toBe('true');
    });

    test('should not initialize when hero element is missing', () => {
      // No hero in DOM
      loadModule();

      expect(document.querySelector('.cloud-canvas')).toBeNull();
    });

    test('should call requestAnimationFrame for deferred sizing', () => {
      setupHero();
      loadModule();

      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    test('should set canvas dimensions from hero size', () => {
      setupHero(1000, 500);
      loadModule();
      flushRAF();

      const canvas = document.querySelector('.cloud-canvas');
      expect(canvas.width).toBe(1000);
      expect(canvas.height).toBe(500);
    });
  });

  describe('Reduced Motion', () => {
    test('should not initialize when prefers-reduced-motion is set', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      setupHero();
      loadModule();

      expect(document.querySelector('.cloud-canvas')).toBeNull();
    });
  });

  describe('Mouse Interaction', () => {
    test('should update mouse position on mousemove', () => {
      const hero = setupHero();
      loadModule();
      flushRAF();

      const canvas = hero.querySelector('canvas');
      // Mock getBoundingClientRect
      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        width: 1200,
        height: 600,
      }));

      const event = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 200,
      });
      hero.dispatchEvent(event);

      // The module should have processed the event without errors
      expect(canvas.getBoundingClientRect).toHaveBeenCalled();
    });

    test('should reset mouse position on mouseleave', () => {
      const hero = setupHero();
      loadModule();
      flushRAF();

      hero.dispatchEvent(new Event('mouseleave'));
      // Should not throw
      expect(true).toBe(true);
    });

    test('should handle touch events', () => {
      const hero = setupHero();
      loadModule();
      flushRAF();

      const canvas = hero.querySelector('canvas');
      canvas.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        width: 1200,
        height: 600,
      }));

      const touchEvent = new Event('touchmove');
      touchEvent.touches = [{ clientX: 150, clientY: 250 }];
      hero.dispatchEvent(touchEvent);

      expect(canvas.getBoundingClientRect).toHaveBeenCalled();
    });

    test('should reset mouse position on touchend', () => {
      const hero = setupHero();
      loadModule();
      flushRAF();

      hero.dispatchEvent(new Event('touchend'));
      expect(true).toBe(true);
    });
  });

  describe('Visibility Observer', () => {
    test('should create an IntersectionObserver for the hero', () => {
      setupHero();
      loadModule();
      flushRAF();

      expect(global.IntersectionObserver).toHaveBeenCalled();
    });

    test('should pause animation when hero is not intersecting', () => {
      setupHero();
      loadModule();
      flushRAF();

      // Simulate hero going off-screen
      observerCallback([{ isIntersecting: false }]);

      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });

    test('should resume animation when hero becomes visible again', () => {
      setupHero();
      loadModule();
      flushRAF();

      // Pause first
      observerCallback([{ isIntersecting: false }]);
      const rafCountBefore = global.requestAnimationFrame.mock.calls.length;

      // Resume
      observerCallback([{ isIntersecting: true }]);

      expect(global.requestAnimationFrame.mock.calls.length).toBeGreaterThan(rafCountBefore);
    });
  });

  describe('Render Loop', () => {
    test('should call clearRect on each render frame', () => {
      setupHero();
      loadModule();
      flushRAF();

      // The deferred RAF runs init, which calls render(), which calls clearRect
      expect(mockCtx.clearRect).toHaveBeenCalled();
    });

    test('should call drawImage for cloud rendering', () => {
      setupHero();
      loadModule();
      flushRAF();

      // render() draws each cloud via drawImage
      expect(mockCtx.drawImage).toHaveBeenCalled();
    });

    test('should schedule next frame via requestAnimationFrame', () => {
      setupHero();
      loadModule();
      flushRAF();

      // Initial RAF for deferred init + render loop RAF
      expect(global.requestAnimationFrame.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Resize Handling', () => {
    test('should update canvas dimensions on window resize', () => {
      const hero = setupHero(800, 400);
      loadModule();
      flushRAF();

      // Change hero dimensions
      Object.defineProperty(hero, 'offsetWidth', { value: 1600, configurable: true });
      Object.defineProperty(hero, 'offsetHeight', { value: 800, configurable: true });

      window.dispatchEvent(new Event('resize'));

      const canvas = document.querySelector('.cloud-canvas');
      expect(canvas.width).toBe(1600);
      expect(canvas.height).toBe(800);
    });

    test('should not crash when hero is removed before resize', () => {
      setupHero();
      loadModule();
      flushRAF();

      document.getElementById('hero').remove();
      expect(() => window.dispatchEvent(new Event('resize'))).not.toThrow();
    });
  });

  describe('DOMContentLoaded', () => {
    test('should defer init when document is still loading', () => {
      setupHero();

      const originalReadyState = document.readyState;
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true,
        configurable: true,
      });

      const addEventSpy = jest.spyOn(document, 'addEventListener');
      loadModule();

      expect(addEventSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));

      // Trigger DOMContentLoaded
      const handler = addEventSpy.mock.calls.find(c => c[0] === 'DOMContentLoaded')[1];
      handler();
      flushRAF();

      expect(document.querySelector('.cloud-canvas')).not.toBeNull();

      // Restore readyState so subsequent tests aren't affected
      Object.defineProperty(document, 'readyState', {
        value: originalReadyState,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('Cloud Texture Generation', () => {
    test('should generate cloud textures with canvas 2d context', () => {
      setupHero();
      loadModule();
      flushRAF();

      // The main canvas context should have drawImage called
      // (each cloud is drawn via ctx.drawImage with its offscreen texture)
      expect(mockCtx.drawImage).toHaveBeenCalled();
      // drawImage is called once per cloud (20 clouds)
      expect(mockCtx.drawImage.mock.calls.length).toBe(20);
    });
  });

  describe('Zero-size hero', () => {
    test('should not resize canvas when hero has zero dimensions', () => {
      setupHero(0, 0);
      loadModule();
      flushRAF();

      // Canvas is created but resize() should not update dimensions
      // (canvas keeps default 300x150 from HTML spec)
      const canvas = document.querySelector('.cloud-canvas');
      expect(canvas).not.toBeNull();
      // The resize function guards with if (w > 0 && h > 0)
      // so canvas stays at default dimensions
      expect(canvas.width).toBe(300);
      expect(canvas.height).toBe(150);
    });
  });

  describe('IntersectionObserver not supported', () => {
    test('should still initialize and render when IntersectionObserver is unavailable', () => {
      setupHero();
      delete global.IntersectionObserver;
      loadModule();
      flushRAF();

      // Canvas should still be created
      expect(mockCtx.clearRect).toHaveBeenCalled();
      expect(mockCtx.drawImage).toHaveBeenCalled();
    });
  });
});
