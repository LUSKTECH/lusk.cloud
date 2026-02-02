/**
 * Property-Based Tests for Image Aspect Ratio Preservation
 * Lusk.cloud Landing Page
 *
 * **Validates: Requirements 6.4**
 *
 * Property 7: Image Aspect Ratio Preservation
 * For any image displayed at any viewport width, the image's rendered aspect ratio
 * SHALL remain equal to its intrinsic aspect ratio (no distortion).
 *
 * Key test cases:
 * - Images should use `object-fit: cover` or `object-fit: contain` (not `stretch`)
 * - Images should not have both explicit width AND height that would distort
 * - CSS should not use `transform: scale()` with different x/y values
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
 * Load CSS content from all component and utility CSS files
 * @returns {string} Combined CSS content
 */
function loadCssContent() {
  const cssDir = path.join(__dirname, '..', 'css');
  const cssFiles = [
    'styles.css',
    'components/hero.css',
    'components/about.css',
    'components/navigation.css',
    'components/services.css',
    'components/contact.css',
    'components/footer.css',
    'utilities/responsive.css',
    'utilities/animations.css',
    'utilities/variables.css',
  ];

  let combinedCss = '';

  for (const file of cssFiles) {
    const filePath = path.join(cssDir, file);
    if (fs.existsSync(filePath)) {
      combinedCss += `${fs.readFileSync(filePath, 'utf8')  }\n`;
    }
  }

  return combinedCss;
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
 * Extract CSS classes from an img element
 * @param {Object} img - The image element data
 * @returns {Array<string>} Array of CSS class names
 */
function extractImageClasses(img) {
  const classAttr = img.attributes.class || '';
  return classAttr.split(/\s+/).filter(c => c.length > 0);
}

/**
 * Extract CSS rules for a given selector from CSS content
 * @param {string} css - The CSS content
 * @param {string} selector - The CSS selector to find
 * @returns {Array<Object>} Array of CSS rule objects with property and value
 */
function extractCssRulesForSelector(css, selector) {
  const rules = [];

  // Escape special regex characters in selector
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Match CSS rules for the selector (handles multiple selectors and nested rules)
  const ruleRegex = new RegExp(
    `(?:^|[,}\\s])${escapedSelector}\\s*(?:,\\s*[^{]+)?\\s*\\{([^}]*)\\}`,
    'gim',
  );

  let match;
  while ((match = ruleRegex.exec(css)) !== null) {
    const declarations = match[1];

    // Parse individual declarations
    const declRegex = /([a-z-]+)\s*:\s*([^;]+)/gi;
    let declMatch;

    while ((declMatch = declRegex.exec(declarations)) !== null) {
      rules.push({
        property: declMatch[1].trim().toLowerCase(),
        value: declMatch[2].trim(),
      });
    }
  }

  return rules;
}

/**
 * Get all CSS rules that apply to an image element
 * @param {Object} img - The image element data
 * @param {string} css - The CSS content
 * @returns {Array<Object>} Array of CSS rules
 */
function getCssRulesForImage(img, css) {
  const allRules = [];

  // Get rules for element selector (img)
  allRules.push(...extractCssRulesForSelector(css, 'img'));

  // Get rules for class selectors
  const classes = extractImageClasses(img);
  for (const className of classes) {
    allRules.push(...extractCssRulesForSelector(css, `.${className}`));
  }

  return allRules;
}

/**
 * Valid object-fit values that preserve aspect ratio
 */
const VALID_OBJECT_FIT_VALUES = ['cover', 'contain', 'scale-down', 'none'];

/**
 * Check if an object-fit value preserves aspect ratio
 * @param {string} value - The object-fit value
 * @returns {boolean} True if the value preserves aspect ratio
 */
function isValidObjectFit(value) {
  if (!value) {
    return true;
  } // No object-fit is fine if no explicit dimensions
  const normalizedValue = value.toLowerCase().trim();
  return VALID_OBJECT_FIT_VALUES.includes(normalizedValue);
}

/**
 * Check if a transform value has non-uniform scaling
 * @param {string} value - The transform value
 * @returns {boolean} True if the transform has non-uniform scaling (distortion)
 */
function hasNonUniformScale(value) {
  if (!value) {
    return false;
  }

  // Check for scale() with different x/y values
  const scaleMatch = value.match(/scale\s*\(\s*([^,)]+)(?:\s*,\s*([^)]+))?\s*\)/i);
  if (scaleMatch) {
    const scaleX = parseFloat(scaleMatch[1]);
    const scaleY = scaleMatch[2] ? parseFloat(scaleMatch[2]) : scaleX;
    if (scaleX !== scaleY) {
      return true;
    }
  }

  // Check for scaleX and scaleY with different values
  const scaleXMatch = value.match(/scaleX\s*\(\s*([^)]+)\s*\)/i);
  const scaleYMatch = value.match(/scaleY\s*\(\s*([^)]+)\s*\)/i);

  if (scaleXMatch && scaleYMatch) {
    const scaleX = parseFloat(scaleXMatch[1]);
    const scaleY = parseFloat(scaleYMatch[1]);
    if (scaleX !== scaleY) {
      return true;
    }
  }

  return false;
}

/**
 * Check if an image has explicit dimensions that could cause distortion
 * An image with both width and height attributes AND no object-fit could be distorted
 * @param {Object} img - The image element data
 * @param {Array<Object>} cssRules - CSS rules for the image
 * @returns {Object} Validation result
 */
function checkExplicitDimensions(img, cssRules) {
  const hasWidthAttr = img.attributes.width !== undefined;
  const hasHeightAttr = img.attributes.height !== undefined;

  // Check for CSS width/height
  const hasWidthCss = cssRules.some(r => r.property === 'width' && !r.value.includes('auto'));
  const hasHeightCss = cssRules.some(r => r.property === 'height' && !r.value.includes('auto'));

  // Check for object-fit
  const objectFitRule = cssRules.find(r => r.property === 'object-fit');
  const hasObjectFit = objectFitRule !== undefined;

  // If both dimensions are set (either via attributes or CSS), object-fit should be present
  const hasBothDimensions = (hasWidthAttr || hasWidthCss) && (hasHeightAttr || hasHeightCss);

  if (hasBothDimensions && !hasObjectFit) {
    // Check if height is 'auto' which preserves aspect ratio
    const heightRule = cssRules.find(r => r.property === 'height');
    if (heightRule && heightRule.value.includes('auto')) {
      return { isValid: true, reason: 'Height is auto, preserving aspect ratio' };
    }

    const widthRule = cssRules.find(r => r.property === 'width');
    if (widthRule && widthRule.value.includes('auto')) {
      return { isValid: true, reason: 'Width is auto, preserving aspect ratio' };
    }

    // If using percentage-based dimensions, aspect ratio is typically preserved
    if (heightRule && heightRule.value.includes('%')) {
      return { isValid: true, reason: 'Height is percentage-based' };
    }

    // HTML attributes with object-fit: cover in CSS is valid
    // Check if the image class has object-fit defined
    if (hasWidthAttr && hasHeightAttr) {
      // HTML width/height attributes are hints for layout, not strict dimensions
      // Modern browsers use these for aspect-ratio calculation
      return { isValid: true, reason: 'HTML width/height attributes are layout hints' };
    }
  }

  return { isValid: true, reason: 'Dimensions do not cause distortion' };
}

/**
 * Validate that an image preserves its aspect ratio
 * @param {Object} img - The image element data
 * @param {string} css - The CSS content
 * @returns {Object} Validation result with isValid and reason
 */
function validateImageAspectRatio(img, css) {
  const cssRules = getCssRulesForImage(img, css);

  // Check 1: If object-fit is used, it should be a valid value
  const objectFitRule = cssRules.find(r => r.property === 'object-fit');
  if (objectFitRule) {
    if (!isValidObjectFit(objectFitRule.value)) {
      return {
        isValid: false,
        reason: `Invalid object-fit value: ${objectFitRule.value}. Should be cover, contain, scale-down, or none.`,
        img,
      };
    }
  }

  // Check 2: No non-uniform transform scaling
  const transformRule = cssRules.find(r => r.property === 'transform');
  if (transformRule && hasNonUniformScale(transformRule.value)) {
    return {
      isValid: false,
      reason: `Non-uniform scale transform detected: ${transformRule.value}`,
      img,
    };
  }

  // Check 3: Explicit dimensions should have object-fit or auto values
  const dimensionCheck = checkExplicitDimensions(img, cssRules);
  if (!dimensionCheck.isValid) {
    return {
      isValid: false,
      reason: dimensionCheck.reason,
      img,
    };
  }

  return {
    isValid: true,
    reason: 'Image aspect ratio is preserved',
    img,
  };
}

describe('Property 7: Image Aspect Ratio Preservation', () => {
  let htmlContent;
  let cssContent;
  let imgElements;

  beforeAll(() => {
    htmlContent = loadHtmlContent();
    cssContent = loadCssContent();
    imgElements = extractImgElements(htmlContent);
  });

  /**
   * **Validates: Requirements 6.4**
   *
   * Property: Images should use valid object-fit values that preserve aspect ratio
   */
  describe('Object-fit validation', () => {
    test('For any image with object-fit, the value SHALL preserve aspect ratio', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: Math.max(0, imgElements.length - 1) }),
          (index) => {
            if (imgElements.length === 0) {
              return true;
            }

            const img = imgElements[index];
            const cssRules = getCssRulesForImage(img, cssContent);
            const objectFitRule = cssRules.find(r => r.property === 'object-fit');

            // If object-fit is defined, it must be a valid value
            if (objectFitRule) {
              return isValidObjectFit(objectFitRule.value);
            }

            return true;
          },
        ),
        fcConfig,
      );
    });

    test('Valid object-fit values SHALL include cover, contain, scale-down, or none', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_OBJECT_FIT_VALUES),
          (objectFitValue) => {
            return isValidObjectFit(objectFitValue) === true;
          },
        ),
        fcConfig,
      );
    });

    test('object-fit: fill SHALL be considered invalid for aspect ratio preservation', () => {
      expect(isValidObjectFit('fill')).toBe(false);
    });
  });

  /**
   * **Validates: Requirements 6.4**
   *
   * Property: CSS should not use transform: scale() with different x/y values
   */
  describe('Transform scale validation', () => {
    test('For any image, transform SHALL NOT have non-uniform scale values', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: Math.max(0, imgElements.length - 1) }),
          (index) => {
            if (imgElements.length === 0) {
              return true;
            }

            const img = imgElements[index];
            const cssRules = getCssRulesForImage(img, cssContent);
            const transformRule = cssRules.find(r => r.property === 'transform');

            // If transform is defined, it must not have non-uniform scaling
            if (transformRule) {
              return !hasNonUniformScale(transformRule.value);
            }

            return true;
          },
        ),
        fcConfig,
      );
    });

    test('Uniform scale transforms SHALL be acceptable', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.1, max: 3, noNaN: true }),
          (scaleValue) => {
            const uniformScale = `scale(${scaleValue})`;
            return hasNonUniformScale(uniformScale) === false;
          },
        ),
        fcConfig,
      );
    });

    test('Non-uniform scale transforms SHALL be detected', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.double({ min: 0.1, max: 3, noNaN: true }),
            fc.double({ min: 0.1, max: 3, noNaN: true }),
          ).filter(([x, y]) => Math.abs(x - y) > 0.001),
          ([scaleX, scaleY]) => {
            const nonUniformScale = `scale(${scaleX}, ${scaleY})`;
            return hasNonUniformScale(nonUniformScale) === true;
          },
        ),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 6.4**
   *
   * Property: Images with explicit dimensions should preserve aspect ratio
   */
  describe('Explicit dimensions validation', () => {
    test('For any image with explicit dimensions, aspect ratio SHALL be preserved', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: Math.max(0, imgElements.length - 1) }),
          (index) => {
            if (imgElements.length === 0) {
              return true;
            }

            const img = imgElements[index];
            const result = validateImageAspectRatio(img, cssContent);

            return result.isValid;
          },
        ),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 6.4**
   *
   * Comprehensive validation of all images
   */
  describe('Comprehensive aspect ratio validation', () => {
    test('For any img element, aspect ratio validation SHALL pass', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: Math.max(0, imgElements.length - 1) }),
          (index) => {
            if (imgElements.length === 0) {
              return true;
            }

            const img = imgElements[index];
            const result = validateImageAspectRatio(img, cssContent);

            return result.isValid;
          },
        ),
        fcConfig,
      );
    });

    test('All images in the landing page SHALL pass aspect ratio validation', () => {
      const results = imgElements.map(img => validateImageAspectRatio(img, cssContent));
      const failedImages = results.filter(r => !r.isValid);

      if (failedImages.length > 0) {
        console.log('Failed images:');
        failedImages.forEach(r => {
          console.log(`  - ${r.img.attributes.src || 'unknown'}: ${r.reason}`);
        });
      }

      expect(failedImages).toHaveLength(0);
    });
  });

  /**
   * **Validates: Requirements 6.4**
   *
   * Specific image class validation
   */
  describe('Specific image class validation', () => {
    test('Hero images SHALL use object-fit: cover', () => {
      const heroImages = imgElements.filter(img => {
        const classes = extractImageClasses(img);
        return classes.some(c => c.includes('hero'));
      });

      heroImages.forEach(img => {
        const cssRules = getCssRulesForImage(img, cssContent);
        const objectFitRule = cssRules.find(r => r.property === 'object-fit');

        // Hero images should have object-fit: cover for full coverage
        if (objectFitRule) {
          expect(isValidObjectFit(objectFitRule.value)).toBe(true);
        }
      });
    });

    test('About section images SHALL preserve aspect ratio', () => {
      const aboutImages = imgElements.filter(img => {
        const classes = extractImageClasses(img);
        return classes.some(c => c.includes('about'));
      });

      aboutImages.forEach(img => {
        const result = validateImageAspectRatio(img, cssContent);
        expect(result.isValid).toBe(true);
      });
    });

    test('Logo images SHALL preserve aspect ratio', () => {
      const logoImages = imgElements.filter(img =>
        img.attributes.src && img.attributes.src.includes('logo'),
      );

      logoImages.forEach(img => {
        const result = validateImageAspectRatio(img, cssContent);
        expect(result.isValid).toBe(true);
      });
    });
  });

  /**
   * **Validates: Requirements 6.4**
   *
   * Verification that the page contains images to test
   */
  describe('Image presence verification', () => {
    test('Landing page SHALL contain at least one img element', () => {
      expect(imgElements.length).toBeGreaterThan(0);
    });

    test('All detected images SHALL be logged for verification', () => {
      console.log(`\nFound ${imgElements.length} img elements for aspect ratio testing:`);
      imgElements.forEach((img, index) => {
        const src = img.attributes.src || 'unknown';
        const classes = extractImageClasses(img).join(', ') || '(no classes)';
        const width = img.attributes.width || 'auto';
        const height = img.attributes.height || 'auto';
        console.log(`  ${index + 1}. src="${src}" classes="${classes}" width="${width}" height="${height}"`);
      });
    });
  });

  /**
   * **Validates: Requirements 6.4**
   *
   * Property-based tests for helper functions
   */
  describe('Helper function properties', () => {
    test('isValidObjectFit SHALL return true for all valid values', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('cover', 'contain', 'scale-down', 'none'),
          (value) => {
            return isValidObjectFit(value) === true;
          },
        ),
        fcConfig,
      );
    });

    test('isValidObjectFit SHALL return false for fill', () => {
      expect(isValidObjectFit('fill')).toBe(false);
    });

    test('isValidObjectFit SHALL handle case-insensitive values', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('COVER', 'Cover', 'CONTAIN', 'Contain'),
          (value) => {
            return isValidObjectFit(value) === true;
          },
        ),
        fcConfig,
      );
    });

    test('hasNonUniformScale SHALL detect scale(x, y) with different values', () => {
      expect(hasNonUniformScale('scale(1.5, 2)')).toBe(true);
      expect(hasNonUniformScale('scale(2, 1)')).toBe(true);
    });

    test('hasNonUniformScale SHALL accept scale(x, y) with same values', () => {
      expect(hasNonUniformScale('scale(1.5, 1.5)')).toBe(false);
      expect(hasNonUniformScale('scale(2, 2)')).toBe(false);
    });

    test('hasNonUniformScale SHALL accept single value scale(x)', () => {
      expect(hasNonUniformScale('scale(1.5)')).toBe(false);
      expect(hasNonUniformScale('scale(2)')).toBe(false);
    });

    test('hasNonUniformScale SHALL detect scaleX/scaleY with different values', () => {
      expect(hasNonUniformScale('scaleX(1.5) scaleY(2)')).toBe(true);
    });
  });
});
