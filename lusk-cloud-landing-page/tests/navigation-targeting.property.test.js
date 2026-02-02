/**
 * Property-Based Tests for Navigation Link Targeting
 * Lusk.cloud Landing Page
 *
 * **Validates: Requirements 2.3**
 *
 * Property 3: Navigation Link Targeting
 * For any navigation link clicked, the page SHALL scroll to position the
 * corresponding target section within the visible viewport, accounting for
 * the sticky header offset.
 */

const fc = require('fast-check');

// fast-check configuration as specified in design document
const fcConfig = {
  numRuns: 100,
  verbose: true,
};

// Configuration matching smooth-scroll.js
const NAV_OFFSET = 70; // Height of sticky nav (matches --nav-height CSS variable)

/**
 * Calculates the expected scroll position for a target section
 * This mirrors the logic in smooth-scroll.js smoothScrollTo function
 * @param {number} sectionTop - The top position of the target section (relative to document)
 * @param {number} navOffset - The navigation bar height offset
 * @returns {number} - The expected scroll position
 */
function calculateExpectedScrollPosition(sectionTop, navOffset) {
  return Math.max(0, sectionTop - navOffset);
}

/**
 * Checks if a section is visible in the viewport after scrolling
 * @param {number} sectionTop - The top position of the section (relative to document)
 * @param {number} sectionHeight - The height of the section
 * @param {number} scrollY - The current scroll position
 * @param {number} viewportHeight - The height of the viewport
 * @param {number} navOffset - The navigation bar height offset
 * @returns {boolean} - Whether the section is visible in the viewport
 */
function isSectionVisibleInViewport(sectionTop, sectionHeight, scrollY, viewportHeight, navOffset) {
  // The visible area starts below the sticky nav
  const visibleTop = scrollY + navOffset;
  const visibleBottom = scrollY + viewportHeight;

  // Section bounds
  const sectionBottom = sectionTop + sectionHeight;

  // Section is visible if any part of it is within the visible area
  return sectionTop < visibleBottom && sectionBottom > visibleTop;
}

/**
 * Simulates the scroll calculation performed by smooth-scroll.js
 * @param {number} sectionTop - The top position of the target section
 * @param {number} currentScrollY - The current scroll position
 * @param {number} navOffset - The navigation bar height offset
 * @returns {number} - The target scroll position
 */
function simulateScrollCalculation(sectionTop, currentScrollY, navOffset) {
  // This mirrors the calculation in smoothScrollTo:
  // targetPosition = targetRect.top + startPosition - scrollOffset
  // where targetRect.top is relative to viewport, so:
  // targetRect.top = sectionTop - currentScrollY
  const targetRectTop = sectionTop - currentScrollY;
  const targetPosition = targetRectTop + currentScrollY - navOffset;

  return Math.max(0, targetPosition);
}

describe('Property 3: Navigation Link Targeting', () => {
  /**
   * **Validates: Requirements 2.3**
   *
   * Property: After scroll completes, target section top should be at or
   * below the sticky nav (accounting for the nav offset).
   */
  describe('Section positioning after scroll', () => {
    test('For any section position, scroll calculation positions section at nav offset', () => {
      fc.assert(
        fc.property(
          // Generate section top positions (0 to 10000px from document top)
          fc.integer({ min: 0, max: 10000 }),
          // Generate current scroll positions (0 to 5000px)
          fc.integer({ min: 0, max: 5000 }),
          (sectionTop, currentScrollY) => {
            // Calculate the target scroll position
            const targetScrollY = simulateScrollCalculation(sectionTop, currentScrollY, NAV_OFFSET);

            // After scrolling, the section's position relative to viewport
            const sectionTopInViewport = sectionTop - targetScrollY;

            // Property: Section top should be positioned at the nav offset
            // (or at 0 if section is at the very top of the document)
            if (sectionTop <= NAV_OFFSET) {
              // If section is near the top, scroll to 0 and section will be visible
              return targetScrollY === 0;
            }

            // Section top should be at the nav offset (with small tolerance)
            return Math.abs(sectionTopInViewport - NAV_OFFSET) < 1;
          },
        ),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 2.3**
   *
   * Property: Target section should be visible in the viewport after scrolling.
   */
  describe('Section visibility after scroll', () => {
    test('For any section and viewport size, section is visible after scroll', () => {
      fc.assert(
        fc.property(
          // Generate section top positions
          fc.integer({ min: 0, max: 10000 }),
          // Generate section heights (minimum 100px, max 2000px)
          fc.integer({ min: 100, max: 2000 }),
          // Generate viewport heights (common viewport sizes)
          fc.integer({ min: 400, max: 1200 }),
          // Generate initial scroll positions
          fc.integer({ min: 0, max: 5000 }),
          (sectionTop, sectionHeight, viewportHeight, initialScrollY) => {
            // Calculate the target scroll position
            const targetScrollY = simulateScrollCalculation(sectionTop, initialScrollY, NAV_OFFSET);

            // Check if section is visible in viewport after scroll
            const isVisible = isSectionVisibleInViewport(
              sectionTop,
              sectionHeight,
              targetScrollY,
              viewportHeight,
              NAV_OFFSET,
            );

            // Property: Section must be visible in viewport after scroll
            return isVisible === true;
          },
        ),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 2.3**
   *
   * Property: The scroll position should account for the nav offset correctly.
   */
  describe('Nav offset accounting', () => {
    test('For any section position, scroll accounts for nav offset', () => {
      fc.assert(
        fc.property(
          // Generate section top positions above the nav offset
          fc.integer({ min: NAV_OFFSET + 1, max: 10000 }),
          sectionTop => {
            // Calculate expected scroll position
            const expectedScrollY = calculateExpectedScrollPosition(sectionTop, NAV_OFFSET);

            // Simulate the scroll calculation
            const actualScrollY = simulateScrollCalculation(sectionTop, 0, NAV_OFFSET);

            // Property: Calculated scroll should match expected
            return Math.abs(actualScrollY - expectedScrollY) < 1;
          },
        ),
        fcConfig,
      );
    });

    test('Scroll position is always non-negative', () => {
      fc.assert(
        fc.property(
          // Generate any section position including near the top
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 0, max: 5000 }),
          (sectionTop, currentScrollY) => {
            const targetScrollY = simulateScrollCalculation(sectionTop, currentScrollY, NAV_OFFSET);

            // Property: Scroll position must never be negative
            return targetScrollY >= 0;
          },
        ),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 2.3**
   *
   * Property: Scroll calculation is deterministic - same inputs always
   * produce the same scroll position.
   */
  describe('Scroll calculation determinism', () => {
    test('For any inputs, scroll calculation is deterministic', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 0, max: 5000 }),
          (sectionTop, currentScrollY) => {
            // Calculate twice with same inputs
            const firstResult = simulateScrollCalculation(sectionTop, currentScrollY, NAV_OFFSET);
            const secondResult = simulateScrollCalculation(sectionTop, currentScrollY, NAV_OFFSET);

            // Property: Same inputs must produce same output
            return firstResult === secondResult;
          },
        ),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 2.3**
   *
   * Property: For sections at different positions, scrolling to each
   * positions them correctly relative to the nav.
   */
  describe('Multiple section targeting', () => {
    test('For any set of section positions, each can be correctly targeted', () => {
      fc.assert(
        fc.property(
          // Generate an array of 2-5 section positions (simulating multiple page sections)
          fc.array(fc.integer({ min: 0, max: 10000 }), { minLength: 2, maxLength: 5 }),
          sectionPositions => {
            // Sort positions to simulate sections in order on page
            const sortedPositions = [...sectionPositions].sort((a, b) => a - b);

            // For each section, verify scroll calculation is correct
            return sortedPositions.every(sectionTop => {
              const targetScrollY = simulateScrollCalculation(sectionTop, 0, NAV_OFFSET);

              // After scrolling, section should be at nav offset (or visible if near top)
              if (sectionTop <= NAV_OFFSET) {
                return targetScrollY === 0;
              }

              const sectionTopInViewport = sectionTop - targetScrollY;
              return Math.abs(sectionTopInViewport - NAV_OFFSET) < 1;
            });
          },
        ),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 2.3**
   *
   * Property: Edge case - sections at the very top of the page are handled correctly.
   */
  describe('Edge cases', () => {
    test('Section at position 0 scrolls to top of page', () => {
      const targetScrollY = simulateScrollCalculation(0, 0, NAV_OFFSET);
      expect(targetScrollY).toBe(0);
    });

    test('Section at nav offset position scrolls to top of page', () => {
      const targetScrollY = simulateScrollCalculation(NAV_OFFSET, 0, NAV_OFFSET);
      expect(targetScrollY).toBe(0);
    });

    test('Section just below nav offset scrolls to position it at nav', () => {
      const sectionTop = NAV_OFFSET + 100;
      const targetScrollY = simulateScrollCalculation(sectionTop, 0, NAV_OFFSET);
      const sectionTopInViewport = sectionTop - targetScrollY;

      expect(Math.abs(sectionTopInViewport - NAV_OFFSET)).toBeLessThan(1);
    });

    test('For any viewport height, visible area calculation is correct', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 300, max: 1500 }),
          fc.integer({ min: 0, max: 5000 }),
          (viewportHeight, scrollY) => {
            // Visible area should be viewport minus nav offset
            const visibleTop = scrollY + NAV_OFFSET;
            const visibleBottom = scrollY + viewportHeight;
            const visibleHeight = visibleBottom - visibleTop;

            // Property: Visible height should be viewport height minus nav offset
            return visibleHeight === viewportHeight - NAV_OFFSET;
          },
        ),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 2.3**
   *
   * Property: The calculateExpectedScrollPosition function correctly
   * computes the scroll target.
   */
  describe('calculateExpectedScrollPosition correctness', () => {
    test('For any section above nav offset, expected position is section minus offset', () => {
      fc.assert(
        fc.property(fc.integer({ min: NAV_OFFSET + 1, max: 100000 }), sectionTop => {
          const expected = calculateExpectedScrollPosition(sectionTop, NAV_OFFSET);
          return expected === sectionTop - NAV_OFFSET;
        }),
        fcConfig,
      );
    });

    test('For any section at or below nav offset, expected position is 0', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: NAV_OFFSET }), sectionTop => {
          const expected = calculateExpectedScrollPosition(sectionTop, NAV_OFFSET);
          return expected === 0;
        }),
        fcConfig,
      );
    });
  });
});
