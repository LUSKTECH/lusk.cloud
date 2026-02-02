/**
 * Smooth Scroll Module
 * Lusk.cloud Landing Page
 *
 * Requirements:
 * - 2.3: When visitor clicks a navigation link, page smoothly scrolls to corresponding section
 *
 * Provides smooth scrolling navigation using requestAnimationFrame for optimal performance.
 */

(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    navHeight: 70, // Height of sticky nav (matches --nav-height CSS variable)
    animationDuration: 800, // Duration of scroll animation in ms
    easing: easeInOutCubic, // Easing function for smooth animation
  };

  // Selectors
  const SELECTORS = {
    navLinks: 'a[href^="#"]', // All anchor links starting with #
  };

  /**
   * Easing function for smooth animation
   * Cubic ease-in-out provides natural acceleration and deceleration
   * @param {number} t - Progress value between 0 and 1
   * @returns {number} - Eased value between 0 and 1
   */
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Get the current scroll position
   * @returns {number} - Current vertical scroll position
   */
  function getScrollPosition() {
    return window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
  }

  /**
   * Get the offset for sticky navigation
   * Dynamically reads from CSS variable if available, falls back to config
   * @returns {number} - Navigation height offset in pixels
   */
  function getNavOffset() {
    const root = document.documentElement;
    const navHeightVar = getComputedStyle(root).getPropertyValue('--nav-height');

    if (navHeightVar) {
      const parsed = parseInt(navHeightVar, 10);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }

    return CONFIG.navHeight;
  }

  /**
   * Smooth scroll to a target element
   * Uses requestAnimationFrame for smooth animation
   *
   * @param {string} targetId - The ID of the target element (without #)
   * @param {number} [offset] - Optional offset from top (defaults to nav height)
   * @returns {boolean} - True if scroll was initiated, false if target not found
   */
  function smoothScrollTo(targetId, offset) {
    // Remove # if present
    const cleanId = targetId.replace(/^#/, '');

    // Get target element
    const targetElement = document.getElementById(cleanId);

    if (!targetElement) {
      console.warn(`Smooth scroll: Target element #${cleanId} not found`);
      return false;
    }

    // Calculate offset (use provided offset or nav height)
    const scrollOffset = typeof offset === 'number' ? offset : getNavOffset();

    // Get target position
    const targetRect = targetElement.getBoundingClientRect();
    const startPosition = getScrollPosition();
    const targetPosition = targetRect.top + startPosition - scrollOffset;

    // Calculate distance to scroll
    const distance = targetPosition - startPosition;

    // If distance is very small, just jump
    if (Math.abs(distance) < 1) {
      updateUrlHash(cleanId);
      return true;
    }

    // Animation variables
    let startTime = null;

    /**
     * Animation step function
     * @param {number} currentTime - Current timestamp from requestAnimationFrame
     */
    function animationStep(currentTime) {
      if (startTime === null) {
        startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / CONFIG.animationDuration, 1);
      const easedProgress = CONFIG.easing(progress);

      const currentPosition = startPosition + distance * easedProgress;

      window.scrollTo(0, currentPosition);

      if (progress < 1) {
        requestAnimationFrame(animationStep);
      } else {
        // Animation complete - update URL hash
        updateUrlHash(cleanId);

        // Focus the target element for accessibility
        focusTarget(targetElement);
      }
    }

    // Start animation
    requestAnimationFrame(animationStep);

    return true;
  }

  /**
   * Update URL hash without causing a jump
   * Uses history.pushState for smooth experience
   * @param {string} hash - The hash to set (without #)
   */
  function updateUrlHash(hash) {
    if (history.pushState) {
      history.pushState(null, null, `#${hash}`);
    } else {
      // Fallback for older browsers - this may cause a small jump
      window.location.hash = hash;
    }
  }

  /**
   * Focus the target element for accessibility
   * Makes the element focusable if it isn't already
   * @param {HTMLElement} element - The element to focus
   */
  function focusTarget(element) {
    // Check if element is naturally focusable
    const focusableElements = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'];
    const isFocusable =
      focusableElements.includes(element.tagName) || element.hasAttribute('tabindex');

    if (!isFocusable) {
      // Temporarily make it focusable
      element.setAttribute('tabindex', '-1');
    }

    element.focus({ preventScroll: true });

    // Remove tabindex after focus if we added it
    if (!isFocusable) {
      // Use a small delay to ensure focus event completes
      setTimeout(function () {
        element.removeAttribute('tabindex');
      }, 100);
    }
  }

  /**
   * Handle click on navigation link
   * @param {Event} event - Click event
   */
  function handleNavLinkClick(event) {
    const link = event.currentTarget;
    const href = link.getAttribute('href');

    // Only handle internal anchor links
    if (!href || !href.startsWith('#') || href === '#') {
      return;
    }

    // Prevent default anchor behavior
    event.preventDefault();

    // Extract target ID
    const targetId = href.substring(1);

    // Perform smooth scroll
    smoothScrollTo(targetId);
  }

  /**
   * Initialize smooth scroll functionality
   * Attaches click listeners to all navigation links
   * @param {NodeList|Array} [navLinks] - Optional specific links to attach to
   */
  function initSmoothScroll(navLinks) {
    // Get nav links if not provided
    const links = navLinks || document.querySelectorAll(SELECTORS.navLinks);

    if (!links || links.length === 0) {
      console.warn('Smooth scroll: No navigation links found');
      return;
    }

    // Attach click listeners to all nav links
    links.forEach(function (link) {
      link.addEventListener('click', handleNavLinkClick);
    });

    // Handle initial hash in URL (if page loads with a hash)
    handleInitialHash();
  }

  /**
   * Handle initial hash in URL
   * Scrolls to target if page loads with a hash
   */
  function handleInitialHash() {
    const hash = window.location.hash;

    if (hash && hash.length > 1) {
      // Small delay to ensure page is fully loaded
      setTimeout(function () {
        smoothScrollTo(hash);
      }, 100);
    }
  }

  /**
   * Remove smooth scroll listeners
   * Useful for cleanup or re-initialization
   * @param {NodeList|Array} [navLinks] - Optional specific links to detach from
   */
  function destroySmoothScroll(navLinks) {
    const links = navLinks || document.querySelectorAll(SELECTORS.navLinks);

    links.forEach(function (link) {
      link.removeEventListener('click', handleNavLinkClick);
    });
  }

  // Export for testing and external use
  window.LuskSmoothScroll = {
    init: initSmoothScroll,
    destroy: destroySmoothScroll,
    scrollTo: smoothScrollTo,
    getNavOffset,
    // Expose for testing
    _easeInOutCubic: easeInOutCubic,
    _getScrollPosition: getScrollPosition,
    _updateUrlHash: updateUrlHash,
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmoothScroll);
  } else {
    initSmoothScroll();
  }
})();
