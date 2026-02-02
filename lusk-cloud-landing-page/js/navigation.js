/**
 * Navigation Module
 * Lusk.cloud Landing Page
 *
 * Requirements:
 * - 2.2: When visitor scrolls down, navigation bar remains visible as sticky header
 * - 2.5: When visitor clicks hamburger menu, navigation expands to show all options
 * - 8.3: Keyboard navigation is supported
 */

(function() {
  'use strict';

  // Configuration
  const STICKY_THRESHOLD = 50; // pixels from top to trigger sticky behavior
  const SELECTORS = {
    header: '.site-header',
    navToggle: '#nav-toggle',
    navMenu: '#nav-menu',
    navLinks: '.nav-link',
  };
  const CLASSES = {
    sticky: 'is-sticky',
    menuActive: 'is-active',
  };

  // State
  let isMenuOpen = false;

  /**
     * Initialize navigation functionality
     * Sets up scroll listener for sticky behavior and mobile menu toggle
     */
  function initNavigation() {
    const header = document.querySelector(SELECTORS.header);
    const navToggle = document.querySelector(SELECTORS.navToggle);
    const navMenu = document.querySelector(SELECTORS.navMenu);
    const navLinks = document.querySelectorAll(SELECTORS.navLinks);

    if (!header || !navToggle || !navMenu) {
      console.warn('Navigation: Required elements not found');
      return;
    }

    // Initialize sticky navigation
    initStickyNavigation(header);

    // Initialize mobile menu toggle
    initMobileMenu(navToggle, navMenu);

    // Close menu when clicking outside
    initOutsideClickHandler(navToggle, navMenu);

    // Close menu when nav link is clicked
    initNavLinkClickHandler(navLinks, navToggle, navMenu);

    // Handle keyboard navigation
    initKeyboardNavigation(navToggle, navMenu);
  }

  /**
     * Initialize sticky navigation behavior
     * Adds 'is-sticky' class to header when scrolled past threshold
     * @param {HTMLElement} header - The site header element
     */
  function initStickyNavigation(header) {
    let ticking = false;

    function updateStickyState() {
      const scrollY = window.scrollY || window.pageYOffset;

      if (scrollY > STICKY_THRESHOLD) {
        header.classList.add(CLASSES.sticky);
      } else {
        header.classList.remove(CLASSES.sticky);
      }

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateStickyState);
        ticking = true;
      }
    }

    // Initial check
    updateStickyState();

    // Attach scroll listener
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /**
     * Initialize mobile menu toggle functionality
     * @param {HTMLElement} navToggle - The hamburger button element
     * @param {HTMLElement} navMenu - The navigation menu element
     */
  function initMobileMenu(navToggle, navMenu) {
    navToggle.addEventListener('click', function(event) {
      event.preventDefault();
      toggleMobileMenu(navToggle, navMenu);
    });
  }

  /**
     * Toggle mobile menu visibility
     * Updates aria-expanded attribute for accessibility
     * @param {HTMLElement} navToggle - The hamburger button element
     * @param {HTMLElement} navMenu - The navigation menu element
     */
  function toggleMobileMenu(navToggle, navMenu) {
    isMenuOpen = !isMenuOpen;

    // Toggle menu visibility
    navMenu.classList.toggle(CLASSES.menuActive, isMenuOpen);

    // Update aria-expanded attribute for accessibility (Requirement 8.3)
    navToggle.setAttribute('aria-expanded', isMenuOpen.toString());

    // Prevent body scroll when menu is open
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';

    // Focus management for accessibility
    if (isMenuOpen) {
      // Focus first nav link when menu opens
      const firstLink = navMenu.querySelector(SELECTORS.navLinks);
      if (firstLink) {
        firstLink.focus();
      }
    } else {
      // Return focus to toggle button when menu closes
      navToggle.focus();
    }
  }

  /**
     * Close mobile menu
     * @param {HTMLElement} navToggle - The hamburger button element
     * @param {HTMLElement} navMenu - The navigation menu element
     */
  function closeMobileMenu(navToggle, navMenu) {
    if (isMenuOpen) {
      isMenuOpen = false;
      navMenu.classList.remove(CLASSES.menuActive);
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  }

  /**
     * Initialize click handler for closing menu when clicking outside
     * @param {HTMLElement} navToggle - The hamburger button element
     * @param {HTMLElement} navMenu - The navigation menu element
     */
  function initOutsideClickHandler(navToggle, navMenu) {
    document.addEventListener('click', function(event) {
      if (!isMenuOpen) {
        return;
      }

      const isClickInsideMenu = navMenu.contains(event.target);
      const isClickOnToggle = navToggle.contains(event.target);

      if (!isClickInsideMenu && !isClickOnToggle) {
        closeMobileMenu(navToggle, navMenu);
      }
    });
  }

  /**
     * Initialize click handler for nav links to close menu
     * @param {NodeList} navLinks - The navigation link elements
     * @param {HTMLElement} navToggle - The hamburger button element
     * @param {HTMLElement} navMenu - The navigation menu element
     */
  function initNavLinkClickHandler(navLinks, navToggle, navMenu) {
    navLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        closeMobileMenu(navToggle, navMenu);
      });
    });
  }

  /**
     * Initialize keyboard navigation support (Requirement 8.3)
     * @param {HTMLElement} navToggle - The hamburger button element
     * @param {HTMLElement} navMenu - The navigation menu element
     */
  function initKeyboardNavigation(navToggle, navMenu) {
    // Close menu on Escape key
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && isMenuOpen) {
        closeMobileMenu(navToggle, navMenu);
        navToggle.focus();
      }
    });

    // Handle Enter and Space on toggle button
    navToggle.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleMobileMenu(navToggle, navMenu);
      }
    });

    // Trap focus within menu when open
    navMenu.addEventListener('keydown', function(event) {
      if (!isMenuOpen || event.key !== 'Tab') {
        return;
      }

      const focusableElements = navMenu.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        // Shift+Tab on first element - move to toggle button
        event.preventDefault();
        navToggle.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        // Tab on last element - move to toggle button
        event.preventDefault();
        navToggle.focus();
      }
    });
  }

  // Export for testing and external use
  window.LuskNavigation = {
    init: initNavigation,
    toggleMobileMenu() {
      const navToggle = document.querySelector(SELECTORS.navToggle);
      const navMenu = document.querySelector(SELECTORS.navMenu);
      if (navToggle && navMenu) {
        toggleMobileMenu(navToggle, navMenu);
      }
    },
    closeMobileMenu() {
      const navToggle = document.querySelector(SELECTORS.navToggle);
      const navMenu = document.querySelector(SELECTORS.navMenu);
      if (navToggle && navMenu) {
        closeMobileMenu(navToggle, navMenu);
      }
    },
    isMenuOpen() {
      return isMenuOpen;
    },
    STICKY_THRESHOLD,
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
  } else {
    initNavigation();
  }

})();
