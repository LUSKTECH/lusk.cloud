/**
 * Main JavaScript Entry Point
 * Lusk.cloud Landing Page
 * A product of Lusk Technologies, Inc.
 */

(function() {
  'use strict';

  /**
     * Initialize all modules when DOM is ready
     */
  function init() {
    // Set current year in footer
    setCurrentYear();

    // Navigation is self-initializing via navigation.js
    // Additional modules will be initialized here as they are implemented:
    // - Smooth scroll (Task 4.1)
    // - Form validation (Task 8.3)
    // - Animations (Task 10.2)
  }

  /**
     * Set the current year in the footer copyright
     */
  function setCurrentYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
