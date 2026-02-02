/**
 * Property-Based Tests for Keyboard Accessibility
 * Lusk.cloud Landing Page
 *
 * **Validates: Requirements 8.3**
 *
 * Property 9: Keyboard Accessibility
 * For any interactive element (buttons, links, form inputs) on the landing page,
 * the element SHALL be focusable via keyboard navigation and SHALL respond to
 * keyboard activation (Enter/Space keys as appropriate).
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
 * Load CSS content from all CSS files
 * @returns {string} Combined CSS content
 */
function loadCssContent() {
  const cssDir = path.join(__dirname, '..', 'css');
  let cssContent = '';

  function readCssFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        readCssFiles(filePath);
      } else if (file.endsWith('.css')) {
        cssContent += `${fs.readFileSync(filePath, 'utf8')}\n`;
      }
    }
  }

  readCssFiles(cssDir);
  return cssContent;
}

/**
 * Extract all interactive elements from HTML
 * @param {string} html - The HTML content
 * @returns {Array<Object>} Array of interactive element data
 */
function extractInteractiveElements(html) {
  const elements = [];

  // Extract anchor elements (links)
  const anchorRegex = /<a\s+([^>]*)>/gi;
  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    elements.push({
      type: 'link',
      tagName: 'a',
      fullTag: match[0],
      attributes: parseAttributes(match[1]),
    });
  }

  // Extract button elements
  const buttonRegex = /<button\s+([^>]*)>/gi;
  while ((match = buttonRegex.exec(html)) !== null) {
    elements.push({
      type: 'button',
      tagName: 'button',
      fullTag: match[0],
      attributes: parseAttributes(match[1]),
    });
  }

  // Extract input elements
  const inputRegex = /<input\s+([^>]*)\/?>/gi;
  while ((match = inputRegex.exec(html)) !== null) {
    elements.push({
      type: 'input',
      tagName: 'input',
      fullTag: match[0],
      attributes: parseAttributes(match[1]),
    });
  }

  // Extract textarea elements
  const textareaRegex = /<textarea\s+([^>]*)>/gi;
  while ((match = textareaRegex.exec(html)) !== null) {
    elements.push({
      type: 'textarea',
      tagName: 'textarea',
      fullTag: match[0],
      attributes: parseAttributes(match[1]),
    });
  }

  // Extract select elements
  const selectRegex = /<select\s+([^>]*)>/gi;
  while ((match = selectRegex.exec(html)) !== null) {
    elements.push({
      type: 'select',
      tagName: 'select',
      fullTag: match[0],
      attributes: parseAttributes(match[1]),
    });
  }

  return elements;
}

/**
 * Parse HTML attributes from a string
 * @param {string} attributesStr - The attributes string
 * @returns {Object} Parsed attributes
 */
function parseAttributes(attributesStr) {
  const attributes = {};
  const attrRegex = /(\w+(?:-\w+)?)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/gi;
  let attrMatch;

  while ((attrMatch = attrRegex.exec(attributesStr)) !== null) {
    const attrName = attrMatch[1].toLowerCase();
    const attrValue = attrMatch[2] || attrMatch[3] || attrMatch[4] || '';
    attributes[attrName] = attrValue;
  }

  // Check for boolean attributes (like disabled, hidden)
  const booleanAttrs = ['disabled', 'hidden', 'readonly'];
  for (const attr of booleanAttrs) {
    const boolRegex = new RegExp(`\\b${attr}\\b(?!=)`, 'i');
    if (boolRegex.test(attributesStr)) {
      attributes[attr] = 'true';
    }
  }

  return attributes;
}

/**
 * Check if an element is intentionally hidden from keyboard navigation
 * Elements with tabindex="-1" that are also aria-hidden or hidden are acceptable
 * @param {Object} element - The element data
 * @returns {boolean} True if intentionally hidden
 */
function isIntentionallyHidden(element) {
  const attrs = element.attributes;

  // Check if element has aria-hidden="true"
  if (attrs['aria-hidden'] === 'true') {
    return true;
  }

  // Check if element has hidden attribute
  if (attrs.hidden === 'true' || 'hidden' in attrs) {
    return true;
  }

  // Check if element has type="hidden" (for inputs)
  if (element.tagName === 'input' && attrs.type === 'hidden') {
    return true;
  }

  // Check if element is disabled
  if (attrs.disabled === 'true' || 'disabled' in attrs) {
    return true;
  }

  return false;
}

/**
 * Check if an element is focusable via keyboard
 * @param {Object} element - The element data
 * @returns {Object} Validation result
 */
function isFocusable(element) {
  const attrs = element.attributes;
  const tabindex = attrs.tabindex;

  // If intentionally hidden, it's acceptable to not be focusable
  if (isIntentionallyHidden(element)) {
    return {
      isFocusable: true,
      reason: 'Element is intentionally hidden from keyboard navigation',
      isHidden: true,
    };
  }

  // Check for negative tabindex which removes from tab order
  // This applies to any negative value, not just -1
  if (tabindex !== undefined) {
    const tabindexNum = parseInt(tabindex, 10);
    if (!isNaN(tabindexNum) && tabindexNum < 0) {
      return {
        isFocusable: false,
        reason: `Element has tabindex="${tabindex}" but is not marked as hidden or aria-hidden`,
        isHidden: false,
      };
    }
  }

  // Native interactive elements are focusable by default
  const nativelyFocusable = ['a', 'button', 'input', 'textarea', 'select'];
  if (nativelyFocusable.includes(element.tagName)) {
    // Links need href to be focusable
    if (element.tagName === 'a' && !attrs.href) {
      return {
        isFocusable: false,
        reason: 'Anchor element missing href attribute',
        isHidden: false,
      };
    }

    return {
      isFocusable: true,
      reason: 'Native interactive element is focusable by default',
      isHidden: false,
    };
  }

  // Non-native elements need tabindex >= 0 to be focusable
  if (tabindex !== undefined && parseInt(tabindex, 10) >= 0) {
    return {
      isFocusable: true,
      reason: 'Element has tabindex >= 0',
      isHidden: false,
    };
  }

  return {
    isFocusable: false,
    reason: 'Element is not natively focusable and lacks tabindex',
    isHidden: false,
  };
}

/**
 * Check if an element can respond to keyboard activation
 * @param {Object} element - The element data
 * @returns {Object} Validation result
 */
function canRespondToKeyboard(element) {
  const attrs = element.attributes;

  // If intentionally hidden, skip keyboard response check
  if (isIntentionallyHidden(element)) {
    return {
      canRespond: true,
      reason: 'Element is intentionally hidden',
      expectedKeys: [],
    };
  }

  // Native elements respond to keyboard by default
  switch (element.tagName) {
    case 'a':
      // Links respond to Enter key
      return {
        canRespond: true,
        reason: 'Links natively respond to Enter key',
        expectedKeys: ['Enter'],
      };

    case 'button':
      // Buttons respond to Enter and Space keys
      return {
        canRespond: true,
        reason: 'Buttons natively respond to Enter and Space keys',
        expectedKeys: ['Enter', 'Space'],
      };

    case 'input': {
      // Input behavior depends on type
      const inputType = attrs.type || 'text';
      if (inputType === 'submit' || inputType === 'button' || inputType === 'reset') {
        return {
          canRespond: true,
          reason: 'Button-type inputs respond to Enter and Space keys',
          expectedKeys: ['Enter', 'Space'],
        };
      }
      if (inputType === 'checkbox' || inputType === 'radio') {
        return {
          canRespond: true,
          reason: 'Checkbox/radio inputs respond to Space key',
          expectedKeys: ['Space'],
        };
      }
      return {
        canRespond: true,
        reason: 'Text inputs accept keyboard input',
        expectedKeys: ['typing'],
      };
    }

    case 'textarea':
      return {
        canRespond: true,
        reason: 'Textareas accept keyboard input',
        expectedKeys: ['typing'],
      };

    case 'select':
      return {
        canRespond: true,
        reason: 'Selects respond to arrow keys and Enter',
        expectedKeys: ['Enter', 'ArrowUp', 'ArrowDown'],
      };

    default:
      return {
        canRespond: false,
        reason: 'Non-native element may not respond to keyboard without JavaScript',
        expectedKeys: [],
      };
  }
}

/**
 * Check if CSS contains focus styles for interactive elements
 * @param {string} css - The CSS content
 * @returns {Object} Focus style analysis
 */
function analyzeFocusStyles(css) {
  const focusSelectors = [];

  // Look for :focus, :focus-visible, :focus-within selectors
  const focusRegex = /([^{}]+):focus(?:-visible|-within)?[^{]*\{([^}]+)\}/gi;
  let match;

  while ((match = focusRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    const styles = match[2].trim();

    // Check if the focus style includes visible indicators
    const hasOutline = /outline(?!:\s*none)/i.test(styles);
    const hasBoxShadow = /box-shadow/i.test(styles);
    const hasBorder = /border(?!:\s*none)/i.test(styles);
    const hasBackground = /background/i.test(styles);

    focusSelectors.push({
      selector,
      styles,
      hasVisibleIndicator: hasOutline || hasBoxShadow || hasBorder || hasBackground,
    });
  }

  return {
    hasFocusStyles: focusSelectors.length > 0,
    focusSelectors,
    hasVisibleFocusIndicators: focusSelectors.some(s => s.hasVisibleIndicator),
  };
}

/**
 * Validate keyboard accessibility for an element
 * @param {Object} element - The element data
 * @returns {Object} Comprehensive validation result
 */
function validateKeyboardAccessibility(element) {
  const focusResult = isFocusable(element);
  const keyboardResult = canRespondToKeyboard(element);

  const isValid = focusResult.isFocusable && keyboardResult.canRespond;

  return {
    isValid,
    element,
    focusability: focusResult,
    keyboardResponse: keyboardResult,
    reason: isValid
      ? 'Element is keyboard accessible'
      : `${focusResult.reason}; ${keyboardResult.reason}`,
  };
}

describe('Property 9: Keyboard Accessibility', () => {
  let htmlContent;
  let cssContent;
  let interactiveElements;
  let focusStyleAnalysis;

  beforeAll(() => {
    htmlContent = loadHtmlContent();
    cssContent = loadCssContent();
    interactiveElements = extractInteractiveElements(htmlContent);
    focusStyleAnalysis = analyzeFocusStyles(cssContent);
  });

  /**
   * **Validates: Requirements 8.3**
   *
   * Property: All interactive elements SHALL be focusable via keyboard
   */
  describe('Focusability of interactive elements', () => {
    test('For any link element, the element SHALL be focusable via keyboard', () => {
      const links = interactiveElements.filter(el => el.type === 'link');

      fc.assert(
        fc.property(fc.integer({ min: 0, max: Math.max(0, links.length - 1) }), index => {
          if (links.length === 0) {
            return true;
          }

          const link = links[index];
          const result = isFocusable(link);

          // Property: All links must be focusable
          return result.isFocusable;
        }),
        fcConfig,
      );
    });

    test('For any button element, the element SHALL be focusable via keyboard', () => {
      const buttons = interactiveElements.filter(el => el.type === 'button');

      fc.assert(
        fc.property(fc.integer({ min: 0, max: Math.max(0, buttons.length - 1) }), index => {
          if (buttons.length === 0) {
            return true;
          }

          const button = buttons[index];
          const result = isFocusable(button);

          // Property: All buttons must be focusable
          return result.isFocusable;
        }),
        fcConfig,
      );
    });

    test('For any form input element, the element SHALL be focusable via keyboard', () => {
      const inputs = interactiveElements.filter(
        el => el.type === 'input' || el.type === 'textarea' || el.type === 'select',
      );

      fc.assert(
        fc.property(fc.integer({ min: 0, max: Math.max(0, inputs.length - 1) }), index => {
          if (inputs.length === 0) {
            return true;
          }

          const input = inputs[index];
          const result = isFocusable(input);

          // Property: All form inputs must be focusable
          return result.isFocusable;
        }),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 8.3**
   *
   * Property: Interactive elements SHALL NOT have tabindex="-1" unless intentionally hidden
   */
  describe('Tabindex validation', () => {
    test('For any interactive element with tabindex="-1", the element SHALL be intentionally hidden', () => {
      const elementsWithNegativeTabindex = interactiveElements.filter(
        el => el.attributes.tabindex === '-1',
      );

      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: Math.max(0, elementsWithNegativeTabindex.length - 1) }),
          index => {
            if (elementsWithNegativeTabindex.length === 0) {
              return true;
            }

            const element = elementsWithNegativeTabindex[index];

            // Property: Elements with tabindex="-1" must be intentionally hidden
            return isIntentionallyHidden(element);
          },
        ),
        fcConfig,
      );
    });

    test('All elements with tabindex="-1" SHALL have aria-hidden or hidden attribute', () => {
      const elementsWithNegativeTabindex = interactiveElements.filter(
        el => el.attributes.tabindex === '-1',
      );

      elementsWithNegativeTabindex.forEach(element => {
        const isHidden = isIntentionallyHidden(element);
        expect(isHidden).toBe(true);
      });
    });
  });

  /**
   * **Validates: Requirements 8.3**
   *
   * Property: Interactive elements SHALL respond to keyboard activation
   */
  describe('Keyboard activation response', () => {
    test('For any interactive element, the element SHALL respond to appropriate keyboard keys', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: Math.max(0, interactiveElements.length - 1) }),
          index => {
            if (interactiveElements.length === 0) {
              return true;
            }

            const element = interactiveElements[index];
            const result = canRespondToKeyboard(element);

            // Property: All interactive elements must respond to keyboard
            return result.canRespond;
          },
        ),
        fcConfig,
      );
    });

    test('Links SHALL respond to Enter key activation', () => {
      const links = interactiveElements.filter(
        el => el.type === 'link' && !isIntentionallyHidden(el),
      );

      links.forEach(link => {
        const result = canRespondToKeyboard(link);
        expect(result.canRespond).toBe(true);
        expect(result.expectedKeys).toContain('Enter');
      });
    });

    test('Buttons SHALL respond to Enter and Space key activation', () => {
      const buttons = interactiveElements.filter(
        el => el.type === 'button' && !isIntentionallyHidden(el),
      );

      buttons.forEach(button => {
        const result = canRespondToKeyboard(button);
        expect(result.canRespond).toBe(true);
        expect(result.expectedKeys).toContain('Enter');
        expect(result.expectedKeys).toContain('Space');
      });
    });
  });

  /**
   * **Validates: Requirements 8.3**
   *
   * Property: Elements SHALL have visible focus indicators
   */
  describe('Focus indicator visibility', () => {
    test('CSS SHALL contain focus styles for interactive elements', () => {
      expect(focusStyleAnalysis.hasFocusStyles).toBe(true);
    });

    test('Focus styles SHALL include visible indicators (outline, box-shadow, or border)', () => {
      expect(focusStyleAnalysis.hasVisibleFocusIndicators).toBe(true);
    });

    test('Focus selectors SHALL be logged for verification', () => {
      console.log('\nFocus styles found in CSS:');
      focusStyleAnalysis.focusSelectors.forEach((selector, index) => {
        console.log(`  ${index + 1}. ${selector.selector}:focus`);
        console.log(`     Has visible indicator: ${selector.hasVisibleIndicator}`);
      });
    });
  });

  /**
   * **Validates: Requirements 8.3**
   *
   * Comprehensive keyboard accessibility validation
   */
  describe('Comprehensive keyboard accessibility validation', () => {
    test('For any interactive element, keyboard accessibility validation SHALL pass', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: Math.max(0, interactiveElements.length - 1) }),
          index => {
            if (interactiveElements.length === 0) {
              return true;
            }

            const element = interactiveElements[index];
            const result = validateKeyboardAccessibility(element);

            // Property: Every interactive element must be keyboard accessible
            return result.isValid;
          },
        ),
        fcConfig,
      );
    });

    test('All interactive elements SHALL pass keyboard accessibility validation', () => {
      const results = interactiveElements.map(el => validateKeyboardAccessibility(el));
      const failedElements = results.filter(r => !r.isValid);

      if (failedElements.length > 0) {
        console.log('\nFailed elements:');
        failedElements.forEach(result => {
          console.log(`  - ${result.element.fullTag}`);
          console.log(`    Reason: ${result.reason}`);
        });
      }

      expect(failedElements).toHaveLength(0);
    });
  });

  /**
   * **Validates: Requirements 8.3**
   *
   * Element presence verification
   */
  describe('Interactive element presence verification', () => {
    test('Landing page SHALL contain interactive elements', () => {
      expect(interactiveElements.length).toBeGreaterThan(0);
    });

    test('Landing page SHALL contain link elements', () => {
      const links = interactiveElements.filter(el => el.type === 'link');
      expect(links.length).toBeGreaterThan(0);
    });

    test('Landing page SHALL contain button elements', () => {
      const buttons = interactiveElements.filter(el => el.type === 'button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('Landing page SHALL contain form input elements', () => {
      const inputs = interactiveElements.filter(
        el => el.type === 'input' || el.type === 'textarea',
      );
      expect(inputs.length).toBeGreaterThan(0);
    });

    test('All detected interactive elements SHALL be logged for verification', () => {
      console.log(`\nFound ${interactiveElements.length} interactive elements:`);

      const byType = {};
      interactiveElements.forEach(el => {
        byType[el.type] = (byType[el.type] || 0) + 1;
      });

      Object.entries(byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

      console.log('\nDetailed element list:');
      interactiveElements.forEach((el, index) => {
        const isHidden = isIntentionallyHidden(el);
        const tabindex = el.attributes.tabindex || 'default';
        console.log(`  ${index + 1}. [${el.type}] tabindex=${tabindex} hidden=${isHidden}`);
      });
    });
  });

  /**
   * **Validates: Requirements 8.3**
   *
   * Property-based tests for focusability logic
   */
  describe('Focusability logic properties', () => {
    /**
     * Generate valid tabindex values
     */
    function validTabindexArbitrary() {
      return fc.integer({ min: 0, max: 100 }).map(n => n.toString());
    }

    /**
     * Generate invalid tabindex values (negative)
     */
    function negativeTabindexArbitrary() {
      return fc.integer({ min: -100, max: -1 }).map(n => n.toString());
    }

    test('For any element with tabindex >= 0, isFocusable SHALL return true', () => {
      fc.assert(
        fc.property(
          validTabindexArbitrary(),
          fc.constantFrom('a', 'button', 'input', 'div', 'span'),
          (tabindex, tagName) => {
            const element = {
              type: tagName === 'a' ? 'link' : tagName,
              tagName,
              attributes: {
                tabindex,
                href: tagName === 'a' ? '#' : undefined,
              },
            };

            const result = isFocusable(element);
            return result.isFocusable === true;
          },
        ),
        fcConfig,
      );
    });

    test('For any non-native element with tabindex < 0 and not hidden, isFocusable SHALL return false', () => {
      fc.assert(
        fc.property(
          negativeTabindexArbitrary(),
          fc.constantFrom('div', 'span', 'section'),
          (tabindex, tagName) => {
            const element = {
              type: 'custom',
              tagName,
              attributes: {
                tabindex,
              },
            };

            const result = isFocusable(element);
            // Non-native elements with negative tabindex should not be focusable
            return result.isFocusable === false;
          },
        ),
        fcConfig,
      );
    });

    test('For any native interactive element with tabindex < 0 and not hidden, isFocusable SHALL return false (removed from tab order)', () => {
      fc.assert(
        fc.property(
          negativeTabindexArbitrary(),
          fc.constantFrom('a', 'button', 'input'),
          (tabindex, tagName) => {
            const element = {
              type: tagName === 'a' ? 'link' : tagName,
              tagName,
              attributes: {
                tabindex,
                href: tagName === 'a' ? '#' : undefined,
              },
            };

            const result = isFocusable(element);
            // Native elements with negative tabindex are removed from tab order
            // Our function correctly identifies them as not focusable via keyboard navigation
            return result.isFocusable === false;
          },
        ),
        fcConfig,
      );
    });

    test('For any element with aria-hidden="true", isIntentionallyHidden SHALL return true', () => {
      fc.assert(
        fc.property(fc.constantFrom('a', 'button', 'input', 'div'), tagName => {
          const element = {
            type: tagName === 'a' ? 'link' : tagName,
            tagName,
            attributes: { 'aria-hidden': 'true' },
          };

          return isIntentionallyHidden(element) === true;
        }),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 8.3**
   *
   * Specific element validation
   */
  describe('Specific element validation', () => {
    test('Navigation links SHALL be keyboard accessible', () => {
      const navLinks = interactiveElements.filter(
        el => el.type === 'link' && el.attributes.class && el.attributes.class.includes('nav'),
      );

      navLinks.forEach(link => {
        const result = validateKeyboardAccessibility(link);
        expect(result.isValid).toBe(true);
      });
    });

    test('CTA buttons SHALL be keyboard accessible', () => {
      const ctaLinks = interactiveElements.filter(
        el => el.type === 'link' && el.attributes.class && el.attributes.class.includes('cta'),
      );

      ctaLinks.forEach(link => {
        const result = validateKeyboardAccessibility(link);
        expect(result.isValid).toBe(true);
      });
    });

    test('Form submit button SHALL be keyboard accessible', () => {
      const submitButtons = interactiveElements.filter(
        el => el.type === 'button' && el.attributes.type === 'submit',
      );

      submitButtons.forEach(button => {
        const result = validateKeyboardAccessibility(button);
        expect(result.isValid).toBe(true);
      });
    });

    test('Contact form inputs SHALL be keyboard accessible', () => {
      const formInputs = interactiveElements.filter(
        el => (el.type === 'input' || el.type === 'textarea') && el.attributes.name,
      );

      formInputs.forEach(input => {
        const result = validateKeyboardAccessibility(input);
        expect(result.isValid).toBe(true);
      });
    });

    test('Social links SHALL be keyboard accessible', () => {
      const socialLinks = interactiveElements.filter(
        el => el.type === 'link' && el.attributes.class && el.attributes.class.includes('social'),
      );

      socialLinks.forEach(link => {
        const result = validateKeyboardAccessibility(link);
        expect(result.isValid).toBe(true);
      });
    });
  });
});
