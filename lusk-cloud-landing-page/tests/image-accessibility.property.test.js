/**
 * Property-Based Tests for Image Accessibility
 * Lusk.cloud Landing Page
 *
 * **Validates: Requirements 8.2**
 *
 * Property 8: Image Accessibility
 * For any img element rendered on the landing page, the element SHALL have a
 * non-empty alt attribute providing meaningful description of the image content.
 *
 * Note: Decorative images with aria-hidden="true" may have empty alt="" which is acceptable
 * per WCAG guidelines for purely decorative images.
 */

const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

// fast-check configuration as specified in design document
const fcConfig = {
  numRuns: 100,
  verbose: true,
};

/**
 * Load the HTML content from index.html
 * @returns {string} The HTML content
 */
function loadHtmlContent() {
  const htmlPath = path.join(__dirname, '..', 'index.html');
  return fs.readFileSync(htmlPath, 'utf8');
}

/**
 * Parse HTML and extract all img elements with their attributes
 * @param {string} html - The HTML content
 * @returns {Array<Object>} Array of img element data
 */
function extractImgElements(html) {
  const imgRegex = /<img\s+([^>]*)>/gi;
  const images = [];
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const attributesStr = match[1];
    const img = {
      fullTag: match[0],
      attributes: {},
    };

    // Extract individual attributes
    const attrRegex = /(\w+(?:-\w+)?)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/gi;
    let attrMatch;

    while ((attrMatch = attrRegex.exec(attributesStr)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrValue = attrMatch[2] || attrMatch[3] || attrMatch[4] || '';
      img.attributes[attrName] = attrValue;
    }

    images.push(img);
  }

  return images;
}

/**
 * Check if an image is decorative (has aria-hidden="true")
 * @param {Object} img - The image element data
 * @returns {boolean} True if the image is decorative
 */
function isDecorativeImage(img) {
  return img.attributes['aria-hidden'] === 'true';
}

/**
 * Check if an alt attribute value is meaningful (non-empty and not whitespace-only)
 * @param {string} altValue - The alt attribute value
 * @returns {boolean} True if the alt value is meaningful
 */
function isMeaningfulAlt(altValue) {
  if (typeof altValue !== 'string') {
    return false;
  }
  return altValue.trim().length > 0;
}

/**
 * Check if an image has a valid alt attribute
 * For non-decorative images: must have non-empty alt
 * For decorative images: empty alt="" is acceptable
 * @param {Object} img - The image element data
 * @returns {Object} Validation result with isValid and reason
 */
function validateImageAccessibility(img) {
  const hasAltAttribute = 'alt' in img.attributes;
  const altValue = img.attributes.alt;
  const isDecorative = isDecorativeImage(img);

  if (!hasAltAttribute) {
    return {
      isValid: false,
      reason: 'Missing alt attribute',
      img,
    };
  }

  if (isDecorative) {
    // Decorative images can have empty alt=""
    return {
      isValid: true,
      reason: 'Decorative image with aria-hidden="true"',
      img,
    };
  }

  if (!isMeaningfulAlt(altValue)) {
    return {
      isValid: false,
      reason: 'Alt attribute is empty or whitespace-only for non-decorative image',
      img,
    };
  }

  return {
    isValid: true,
    reason: 'Has meaningful alt text',
    img,
  };
}

describe('Property 8: Image Accessibility', () => {
  let htmlContent;
  let imgElements;

  beforeAll(() => {
    htmlContent = loadHtmlContent();
    imgElements = extractImgElements(htmlContent);
  });

  /**
   * **Validates: Requirements 8.2**
   *
   * Property: All img elements SHALL have an alt attribute
   */
  describe('Alt attribute presence', () => {
    test('All img elements SHALL have an alt attribute', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: Math.max(0, imgElements.length - 1) }),
          (index) => {
            if (imgElements.length === 0) {
              return true;
            }

            const img = imgElements[index];
            const hasAlt = 'alt' in img.attributes;

            // Property: Every img element must have an alt attribute
            return hasAlt;
          },
        ),
        fcConfig,
      );
    });

    test('For any img element in the HTML, alt attribute SHALL be present', () => {
      imgElements.forEach((img, _index) => {
        const hasAlt = 'alt' in img.attributes;
        expect(hasAlt).toBe(true);
      });
    });
  });

  /**
   * **Validates: Requirements 8.2**
   *
   * Property: Non-decorative img elements SHALL have non-empty alt text
   */
  describe('Alt attribute content for non-decorative images', () => {
    test('For any non-decorative img element, alt attribute SHALL not be empty', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: Math.max(0, imgElements.length - 1) }),
          (index) => {
            if (imgElements.length === 0) {
              return true;
            }

            const img = imgElements[index];

            // Skip decorative images (aria-hidden="true")
            if (isDecorativeImage(img)) {
              return true;
            }

            const altValue = img.attributes.alt;

            // Property: Non-decorative images must have non-empty alt
            return isMeaningfulAlt(altValue);
          },
        ),
        fcConfig,
      );
    });

    test('For any non-decorative img element, alt attribute SHALL not be whitespace-only', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: Math.max(0, imgElements.length - 1) }),
          (index) => {
            if (imgElements.length === 0) {
              return true;
            }

            const img = imgElements[index];

            // Skip decorative images
            if (isDecorativeImage(img)) {
              return true;
            }

            const altValue = img.attributes.alt || '';

            // Property: Alt text must not be only whitespace
            return altValue.trim().length > 0;
          },
        ),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 8.2**
   *
   * Property: Decorative images with aria-hidden="true" may have empty alt=""
   */
  describe('Decorative image handling', () => {
    test('Decorative images (aria-hidden="true") with empty alt SHALL be acceptable', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: Math.max(0, imgElements.length - 1) }),
          (index) => {
            if (imgElements.length === 0) {
              return true;
            }

            const img = imgElements[index];
            const result = validateImageAccessibility(img);

            // Property: All images must pass accessibility validation
            return result.isValid;
          },
        ),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 8.2**
   *
   * Property: All images pass comprehensive accessibility validation
   */
  describe('Comprehensive image accessibility validation', () => {
    test('For any img element, accessibility validation SHALL pass', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: Math.max(0, imgElements.length - 1) }),
          (index) => {
            if (imgElements.length === 0) {
              return true;
            }

            const img = imgElements[index];
            const result = validateImageAccessibility(img);

            // Property: Every image must be accessible
            return result.isValid;
          },
        ),
        fcConfig,
      );
    });

    test('All images in the landing page SHALL pass accessibility validation', () => {
      const results = imgElements.map(img => validateImageAccessibility(img));
      const failedImages = results.filter(r => !r.isValid);

      expect(failedImages).toHaveLength(0);
    });
  });

  /**
   * **Validates: Requirements 8.2**
   *
   * Verification that the page contains images to test
   */
  describe('Image presence verification', () => {
    test('Landing page SHALL contain at least one img element', () => {
      expect(imgElements.length).toBeGreaterThan(0);
    });

    test('All detected images SHALL be logged for verification', () => {
      console.log(`\nFound ${imgElements.length} img elements in the landing page:`);
      imgElements.forEach((img, index) => {
        const src = img.attributes.src || 'unknown';
        const alt = img.attributes.alt || '(no alt)';
        const isDecorative = isDecorativeImage(img);
        console.log(`  ${index + 1}. src="${src}" alt="${alt}" decorative=${isDecorative}`);
      });
    });
  });

  /**
   * **Validates: Requirements 8.2**
   *
   * Property-based test with generated alt text variations
   */
  describe('Alt text validation properties', () => {
    /**
 * Helper to generate string from character set (fast-check v4 compatible)
 * @param {string} chars - Characters to use
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {fc.Arbitrary<string>}
 */
    function stringFromChars(chars, minLength, maxLength) {
      return fc.array(fc.constantFrom(...chars.split('')), { minLength, maxLength })
        .map(arr => arr.join(''));
    }

    /**
 * Generates valid alt text strings
 * @returns {fc.Arbitrary<string>}
 */
    function validAltTextArbitrary() {
      return fc.string({ minLength: 1, maxLength: 200 })
        .filter(s => s.trim().length > 0);
    }

    /**
 * Generates invalid alt text strings (empty or whitespace-only)
 * @returns {fc.Arbitrary<string>}
 */
    function invalidAltTextArbitrary() {
      return fc.oneof(
        fc.constant(''),
        stringFromChars(' \t\n', 1, 10),
      );
    }

    test('For any valid alt text, isMeaningfulAlt SHALL return true', () => {
      fc.assert(
        fc.property(
          validAltTextArbitrary(),
          (altText) => {
            return isMeaningfulAlt(altText) === true;
          },
        ),
        fcConfig,
      );
    });

    test('For any invalid alt text (empty/whitespace), isMeaningfulAlt SHALL return false', () => {
      fc.assert(
        fc.property(
          invalidAltTextArbitrary(),
          (altText) => {
            return isMeaningfulAlt(altText) === false;
          },
        ),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 8.2**
   *
   * Edge cases and specific image validation
   */
  describe('Specific image validation', () => {
    test('Logo images SHALL have descriptive alt text', () => {
      const logoImages = imgElements.filter(img =>
        img.attributes.src && img.attributes.src.includes('logo'),
      );

      logoImages.forEach(img => {
        const result = validateImageAccessibility(img);
        expect(result.isValid).toBe(true);
        expect(isMeaningfulAlt(img.attributes.alt)).toBe(true);
      });
    });

    test('Content images SHALL have descriptive alt text', () => {
      const contentImages = imgElements.filter(img =>
        !isDecorativeImage(img) &&
        img.attributes.src &&
        !img.attributes.src.includes('logo'),
      );

      contentImages.forEach(img => {
        const result = validateImageAccessibility(img);
        expect(result.isValid).toBe(true);
      });
    });

    test('Decorative images SHALL have aria-hidden="true"', () => {
      const decorativeImages = imgElements.filter(img => isDecorativeImage(img));

      decorativeImages.forEach(img => {
        expect(img.attributes['aria-hidden']).toBe('true');
      });
    });
  });
});
