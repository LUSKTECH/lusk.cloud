/**
 * Unit Tests for Navigation Module
 * Lusk.cloud Landing Page
 *
 * Tests the sticky navigation and mobile menu functionality
 * Validates: Requirements 2.2, 2.5, 8.3
 */

describe('Navigation Module', () => {
  let rafCallback;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';

    // Mock requestAnimationFrame
    window.requestAnimationFrame = jest.fn(callback => {
      rafCallback = callback;
      return 1;
    });

    // Mock scroll position
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'pageYOffset', {
      value: 0,
      writable: true,
      configurable: true,
    });

    // Clear module cache
    delete window.LuskNavigation;
    jest.resetModules();
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.style.overflow = '';
  });

  function setupDOM() {
    document.body.innerHTML = `
      <header class="site-header">
        <nav>
          <button id="nav-toggle" aria-expanded="false">Menu</button>
          <ul id="nav-menu">
            <a href="#home" class="nav-link">Home</a>
            <a href="#services" class="nav-link">Services</a>
            <a href="#about" class="nav-link">About</a>
            <a href="#contact" class="nav-link">Contact</a>
          </ul>
        </nav>
      </header>
    `;
  }

  function loadModule() {
    require('../js/navigation.js');
  }

  describe('Module Loading', () => {
    test('should expose LuskNavigation on window', () => {
      setupDOM();
      loadModule();

      expect(window.LuskNavigation).toBeDefined();
      expect(typeof window.LuskNavigation.init).toBe('function');
      expect(typeof window.LuskNavigation.toggleMobileMenu).toBe('function');
      expect(typeof window.LuskNavigation.closeMobileMenu).toBe('function');
      expect(typeof window.LuskNavigation.isMenuOpen).toBe('function');
    });

    test('should warn when required elements not found', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      document.body.innerHTML = '<div>No nav here</div>';
      loadModule();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Required elements not found'),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Sticky Navigation', () => {
    test('should add is-sticky class when scrolled past threshold', () => {
      setupDOM();
      loadModule();

      const header = document.querySelector('.site-header');

      // Simulate scroll past threshold
      window.scrollY = 100;
      window.dispatchEvent(new Event('scroll'));

      // Execute RAF callback
      if (rafCallback) {
        rafCallback();
      }

      expect(header.classList.contains('is-sticky')).toBe(true);
    });

    test('should remove is-sticky class when scrolled back to top', () => {
      setupDOM();
      loadModule();

      const header = document.querySelector('.site-header');
      header.classList.add('is-sticky');

      // Simulate scroll to top
      window.scrollY = 0;
      window.dispatchEvent(new Event('scroll'));

      if (rafCallback) {
        rafCallback();
      }

      expect(header.classList.contains('is-sticky')).toBe(false);
    });

    test('should not add is-sticky class at exactly threshold', () => {
      setupDOM();
      loadModule();

      const header = document.querySelector('.site-header');

      window.scrollY = 50; // Exactly at threshold
      window.dispatchEvent(new Event('scroll'));

      if (rafCallback) {
        rafCallback();
      }

      expect(header.classList.contains('is-sticky')).toBe(false);
    });

    test('should expose STICKY_THRESHOLD constant', () => {
      setupDOM();
      loadModule();

      expect(window.LuskNavigation.STICKY_THRESHOLD).toBe(50);
    });
  });

  describe('Mobile Menu Toggle', () => {
    test('should toggle menu visibility on button click', () => {
      setupDOM();
      loadModule();

      const navToggle = document.getElementById('nav-toggle');
      const navMenu = document.getElementById('nav-menu');

      navToggle.click();

      expect(navMenu.classList.contains('is-active')).toBe(true);
      expect(navToggle.getAttribute('aria-expanded')).toBe('true');
    });

    test('should close menu on second click', () => {
      setupDOM();
      loadModule();

      const navToggle = document.getElementById('nav-toggle');
      const navMenu = document.getElementById('nav-menu');

      navToggle.click(); // Open
      navToggle.click(); // Close

      expect(navMenu.classList.contains('is-active')).toBe(false);
      expect(navToggle.getAttribute('aria-expanded')).toBe('false');
    });

    test('should prevent body scroll when menu is open', () => {
      setupDOM();
      loadModule();

      const navToggle = document.getElementById('nav-toggle');

      navToggle.click();

      expect(document.body.style.overflow).toBe('hidden');
    });

    test('should restore body scroll when menu is closed', () => {
      setupDOM();
      loadModule();

      const navToggle = document.getElementById('nav-toggle');

      navToggle.click(); // Open
      navToggle.click(); // Close

      expect(document.body.style.overflow).toBe('');
    });

    test('should focus first nav link when menu opens', () => {
      setupDOM();
      loadModule();

      const navToggle = document.getElementById('nav-toggle');
      const firstLink = document.querySelector('.nav-link');

      navToggle.click();

      expect(document.activeElement).toBe(firstLink);
    });

    test('should return focus to toggle when menu closes', () => {
      setupDOM();
      loadModule();

      const navToggle = document.getElementById('nav-toggle');

      navToggle.click(); // Open
      navToggle.click(); // Close

      expect(document.activeElement).toBe(navToggle);
    });
  });

  describe('toggleMobileMenu() API', () => {
    test('should toggle menu via API', () => {
      setupDOM();
      loadModule();

      const navMenu = document.getElementById('nav-menu');

      window.LuskNavigation.toggleMobileMenu();

      expect(navMenu.classList.contains('is-active')).toBe(true);
    });
  });

  describe('closeMobileMenu() API', () => {
    test('should close menu via API', () => {
      setupDOM();
      loadModule();

      const navToggle = document.getElementById('nav-toggle');
      const navMenu = document.getElementById('nav-menu');

      navToggle.click(); // Open first
      window.LuskNavigation.closeMobileMenu();

      expect(navMenu.classList.contains('is-active')).toBe(false);
    });

    test('should do nothing if menu is already closed', () => {
      setupDOM();
      loadModule();

      expect(() => {
        window.LuskNavigation.closeMobileMenu();
      }).not.toThrow();
    });
  });

  describe('isMenuOpen() API', () => {
    test('should return false when menu is closed', () => {
      setupDOM();
      loadModule();

      expect(window.LuskNavigation.isMenuOpen()).toBe(false);
    });

    test('should return true when menu is open', () => {
      setupDOM();
      loadModule();

      window.LuskNavigation.toggleMobileMenu();

      expect(window.LuskNavigation.isMenuOpen()).toBe(true);
    });
  });

  describe('Outside Click Handler', () => {
    test('should close menu when clicking outside', () => {
      setupDOM();
      loadModule();

      const navToggle = document.getElementById('nav-toggle');
      const navMenu = document.getElementById('nav-menu');

      navToggle.click(); // Open menu

      // Click outside
      document.body.click();

      expect(navMenu.classList.contains('is-active')).toBe(false);
    });

    test('should not close menu when clicking inside menu', () => {
      setupDOM();
      loadModule();

      const navToggle = document.getElementById('nav-toggle');
      const navMenu = document.getElementById('nav-menu');

      navToggle.click(); // Open menu

      // Click inside menu
      navMenu.click();

      expect(navMenu.classList.contains('is-active')).toBe(true);
    });

    test('should not close menu when clicking toggle button', () => {
      setupDOM();
      loadModule();

      const navToggle = document.getElementById('nav-toggle');
      const navMenu = document.getElementById('nav-menu');

      navToggle.click(); // Open menu

      // The toggle click handler will toggle it, so we check it's still working
      expect(navMenu.classList.contains('is-active')).toBe(true);
    });
  });

  describe('Nav Link Click Handler', () => {
    test('should close menu when nav link is clicked', () => {
      setupDOM();
      loadModule();

      const navToggle = document.getElementById('nav-toggle');
      const navMenu = document.getElementById('nav-menu');
      const navLink = document.querySelector('.nav-link');

      navToggle.click(); // Open menu
      navLink.click(); // Click nav link

      expect(navMenu.classList.contains('is-active')).toBe(false);
    });
  });

  describe('Keyboard Navigation', () => {
    test('should close menu on Escape key', () => {
      setupDOM();
      loadModule();

      const navToggle = document.getElementById('nav-toggle');
      const navMenu = document.getElementById('nav-menu');

      navToggle.click(); // Open menu

      // Press Escape
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(navMenu.classList.contains('is-active')).toBe(false);
    });

    test('should focus toggle button after Escape', () => {
      setupDOM();
      loadModule();

      const navToggle = document.getElementById('nav-toggle');

      navToggle.click(); // Open menu

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(document.activeElement).toBe(navToggle);
    });

    test('should not close menu on Escape when menu is closed', () => {
      setupDOM();
      loadModule();

      // Menu is closed, Escape should do nothing
      expect(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      }).not.toThrow();
    });

    test('should toggle menu on Enter key on toggle button', () => {
      setupDOM();
      loadModule();

      const navToggle = document.getElementById('nav-toggle');
      const navMenu = document.getElementById('nav-menu');

      navToggle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(navMenu.classList.contains('is-active')).toBe(true);
    });

    test('should toggle menu on Space key on toggle button', () => {
      setupDOM();
      loadModule();

      const navToggle = document.getElementById('nav-toggle');
      const navMenu = document.getElementById('nav-menu');

      navToggle.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

      expect(navMenu.classList.contains('is-active')).toBe(true);
    });

    test('should trap focus within menu when Tab is pressed', () => {
      setupDOM();
      loadModule();

      const navToggle = document.getElementById('nav-toggle');
      const navMenu = document.getElementById('nav-menu');
      const links = navMenu.querySelectorAll('.nav-link');
      const lastLink = links[links.length - 1];

      navToggle.click(); // Open menu

      // Focus last link
      lastLink.focus();

      // Press Tab on last element - the focus trap should call navToggle.focus()
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: false,
        bubbles: true,
        cancelable: true,
      });

      // Spy on navToggle.focus to verify it gets called
      const focusSpy = jest.spyOn(navToggle, 'focus');

      // Mock activeElement to return lastLink
      const originalActiveElement = Object.getOwnPropertyDescriptor(document, 'activeElement');
      Object.defineProperty(document, 'activeElement', {
        get: () => lastLink,
        configurable: true,
      });

      navMenu.dispatchEvent(tabEvent);

      // Focus trap should have called focus on navToggle
      expect(focusSpy).toHaveBeenCalled();
      expect(tabEvent.defaultPrevented).toBe(true);

      // Restore
      if (originalActiveElement) {
        Object.defineProperty(document, 'activeElement', originalActiveElement);
      }
      focusSpy.mockRestore();
    });

    test('should trap focus when Shift+Tab on first element', () => {
      setupDOM();
      loadModule();

      const navToggle = document.getElementById('nav-toggle');
      const navMenu = document.getElementById('nav-menu');
      const firstLink = navMenu.querySelector('.nav-link');

      navToggle.click(); // Open menu

      // Focus first link
      firstLink.focus();

      // Spy on navToggle.focus to verify it gets called
      const focusSpy = jest.spyOn(navToggle, 'focus');

      // Mock activeElement to return firstLink
      const originalActiveElement = Object.getOwnPropertyDescriptor(document, 'activeElement');
      Object.defineProperty(document, 'activeElement', {
        get: () => firstLink,
        configurable: true,
      });

      // Press Shift+Tab on first element
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });

      navMenu.dispatchEvent(tabEvent);

      // Focus trap should have called focus on navToggle
      expect(focusSpy).toHaveBeenCalled();
      expect(tabEvent.defaultPrevented).toBe(true);

      // Restore
      if (originalActiveElement) {
        Object.defineProperty(document, 'activeElement', originalActiveElement);
      }
      focusSpy.mockRestore();
    });
  });
});

describe('DOMContentLoaded initialization', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete window.LuskNavigation;
    jest.resetModules();
  });

  test('should add DOMContentLoaded listener when document is loading', () => {
    document.body.innerHTML = `
      <header class="site-header">
        <button id="nav-toggle" aria-expanded="false">Menu</button>
        <ul id="nav-menu">
          <a href="#home" class="nav-link">Home</a>
        </ul>
      </header>
    `;

    // Mock readyState before loading module
    const originalReadyState = Object.getOwnPropertyDescriptor(document, 'readyState');
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    });

    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

    require('../js/navigation.js');

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

describe('Focus trap edge cases', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete window.LuskNavigation;
    jest.resetModules();
  });

  test('should handle Tab when not on first or last element', () => {
    document.body.innerHTML = `
      <header class="site-header">
        <button id="nav-toggle" aria-expanded="false">Menu</button>
        <ul id="nav-menu">
          <a href="#home" class="nav-link">Home</a>
          <a href="#services" class="nav-link">Services</a>
          <a href="#about" class="nav-link">About</a>
        </ul>
      </header>
    `;

    require('../js/navigation.js');

    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const middleLink = navMenu.querySelectorAll('.nav-link')[1];

    navToggle.click(); // Open menu

    // Focus middle link
    middleLink.focus();

    Object.defineProperty(document, 'activeElement', {
      value: middleLink,
      configurable: true,
    });

    // Press Tab - should not prevent default (normal tab behavior)
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: false,
      bubbles: true,
      cancelable: true,
    });

    navMenu.dispatchEvent(tabEvent);

    // Event should not be prevented for middle elements
    expect(tabEvent.defaultPrevented).toBe(false);
  });

  test('should not trap focus when menu is closed', () => {
    document.body.innerHTML = `
      <header class="site-header">
        <button id="nav-toggle" aria-expanded="false">Menu</button>
        <ul id="nav-menu">
          <a href="#home" class="nav-link">Home</a>
        </ul>
      </header>
    `;

    require('../js/navigation.js');

    const navMenu = document.getElementById('nav-menu');

    // Menu is closed, Tab should do nothing special
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: false,
      bubbles: true,
      cancelable: true,
    });

    navMenu.dispatchEvent(tabEvent);

    // Event should not be prevented when menu is closed
    expect(tabEvent.defaultPrevented).toBe(false);
  });

  test('should not trap focus for non-Tab keys', () => {
    document.body.innerHTML = `
      <header class="site-header">
        <button id="nav-toggle" aria-expanded="false">Menu</button>
        <ul id="nav-menu">
          <a href="#home" class="nav-link">Home</a>
        </ul>
      </header>
    `;

    require('../js/navigation.js');

    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    navToggle.click(); // Open menu

    // Press a non-Tab key
    const keyEvent = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    });

    navMenu.dispatchEvent(keyEvent);

    // Event should not be prevented for non-Tab keys
    expect(keyEvent.defaultPrevented).toBe(false);
  });
});
