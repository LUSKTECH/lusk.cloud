/**
 * Animations Module
 * Lusk.cloud Landing Page
 *
 * Handles scroll-triggered animations using IntersectionObserver
 * Requirements: 7.4 (Subtle, smooth transitions that evoke floating or drifting sensations)
 */

(function () {
  'use strict';

  /**
   * Animation Controller
   * Manages scroll-triggered and hover animations
   */
  const AnimationController = {
    /**
     * Default configuration for scroll animations
     */
    defaultConfig: {
      threshold: 0.1, // Trigger when 10% of element is visible
      rootMargin: '0px', // No margin around viewport
      once: true, // Animate only once by default
    },

    /**
     * IntersectionObserver instance
     */
    observer: null,

    /**
     * Initialize the animation controller
     */
    init() {
      // Check for IntersectionObserver support
      if (!this.isIntersectionObserverSupported()) {
        this.handleNoSupport();
        return;
      }

      // Check for reduced motion preference
      if (this.prefersReducedMotion()) {
        this.handleReducedMotion();
        return;
      }

      // Initialize scroll animations
      this.initScrollAnimations();
    },

    /**
     * Check if IntersectionObserver is supported
     * @returns {boolean}
     */
    isIntersectionObserverSupported() {
      return (
        'IntersectionObserver' in window &&
        'IntersectionObserverEntry' in window &&
        'intersectionRatio' in window.IntersectionObserverEntry.prototype
      );
    },

    /**
     * Check if user prefers reduced motion
     * @returns {boolean}
     */
    prefersReducedMotion() {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    /**
     * Handle browsers without IntersectionObserver support
     * Graceful degradation: show all elements immediately
     */
    handleNoSupport() {
      const animatedElements = document.querySelectorAll('[data-animate]');
      animatedElements.forEach(function (element) {
        element.classList.add('is-visible');
        element.style.opacity = '1';
      });
    },

    /**
     * Handle reduced motion preference
     * Show all elements without animation
     */
    handleReducedMotion() {
      const animatedElements = document.querySelectorAll('[data-animate]');
      animatedElements.forEach(function (element) {
        element.classList.add('is-visible');
        element.style.opacity = '1';
        element.style.animation = 'none';
      });
    },

    /**
     * Initialize scroll-triggered animations
     * @param {Object} customConfig - Optional custom configuration
     */
    initScrollAnimations(customConfig) {
      const config = Object.assign({}, this.defaultConfig, customConfig);
      const self = this;

      // Create the IntersectionObserver
      this.observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            self.handleIntersection(entry, config);
          });
        },
        {
          threshold: config.threshold,
          rootMargin: config.rootMargin,
        }
      );

      // Observe all elements with data-animate attribute
      const animatedElements = document.querySelectorAll('[data-animate]');
      animatedElements.forEach(function (element) {
        self.observer.observe(element);
      });
    },

    /**
     * Handle intersection event for an element
     * @param {IntersectionObserverEntry} entry
     * @param {Object} config
     */
    handleIntersection(entry, config) {
      if (entry.isIntersecting) {
        const element = entry.target;

        // Get animation delay from data attribute
        const delay = element.dataset.animateDelay;
        if (delay) {
          element.style.animationDelay = `${delay}ms`;
        }

        // Add visible class to trigger animation
        element.classList.add('is-visible');

        // Unobserve if animation should only happen once
        const animateOnce = element.dataset.animateOnce !== 'false';
        if (config.once && animateOnce) {
          this.observer.unobserve(element);
        }
      } else {
        // Remove visible class if animation should repeat
        const animateOnce = entry.target.dataset.animateOnce;
        if (animateOnce === 'false') {
          entry.target.classList.remove('is-visible');
        }
      }
    },

    /**
     * Manually trigger animation on an element
     * @param {HTMLElement} element
     * @param {string} animationType - Animation type (fade-in, fade-in-up, etc.)
     */
    animateElement(element, animationType) {
      if (!element) {
        return;
      }

      element.dataset.animate = animationType;
      element.classList.add('is-visible');
    },

    /**
     * Reset animation on an element
     * @param {HTMLElement} element
     */
    resetAnimation(element) {
      if (!element) {
        return;
      }

      element.classList.remove('is-visible');

      // Force reflow to restart animation
      void element.offsetWidth;
    },

    /**
     * Add a new element to be observed
     * @param {HTMLElement} element
     */
    observe(element) {
      if (this.observer && element) {
        this.observer.observe(element);
      }
    },

    /**
     * Stop observing an element
     * @param {HTMLElement} element
     */
    unobserve(element) {
      if (this.observer && element) {
        this.observer.unobserve(element);
      }
    },

    /**
     * Disconnect the observer and clean up
     */
    destroy() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    },
  };

  /**
   * Initialize scroll animations on elements with data-animate attribute
   * This is the main entry point for the animations module
   */
  function initScrollAnimations() {
    AnimationController.init();
  }

  /**
   * Initialize hover animations
   * Adds event listeners for enhanced hover effects
   */
  function initHoverAnimations() {
    // Service cards hover effect enhancement
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        this.classList.add('is-hovered');
      });
      card.addEventListener('mouseleave', function () {
        this.classList.remove('is-hovered');
      });
    });

    // CTA buttons hover effect
    const ctaButtons = document.querySelectorAll('.btn-primary, .btn-secondary');
    ctaButtons.forEach(function (button) {
      button.addEventListener('mouseenter', function () {
        this.classList.add('is-hovered');
      });
      button.addEventListener('mouseleave', function () {
        this.classList.remove('is-hovered');
      });
    });
  }

  /**
   * Initialize all animations
   */
  function init() {
    initScrollAnimations();
    initHoverAnimations();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose AnimationController for external use
  window.AnimationController = AnimationController;
})();
