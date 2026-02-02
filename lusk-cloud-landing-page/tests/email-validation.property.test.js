/**
 * Property-Based Tests for Email Format Validation
 * Lusk.cloud Landing Page
 *
 * **Validates: Requirements 5.6**
 *
 * Property 6: Email Format Validation
 * For any string input to the email field, the Form_Validator SHALL return valid only if
 * the string matches the pattern of a valid email address (contains exactly one @ symbol,
 * has characters before and after @, and has a domain with at least one dot).
 *
 * Email validation regex pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 */

const fc = require('fast-check');

// fast-check configuration as specified in design document
const fcConfig = {
  numRuns: 100,
  verbose: true,
};

// Email validation pattern from form-validator.js
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Load the form validator module
beforeEach(() => {
  document.body.innerHTML = '';
  delete window.FormValidator;
  jest.resetModules();
});

afterEach(() => {
  jest.clearAllMocks();
});

/**
 * Helper to load the form validator module
 */
function loadFormValidator() {
  document.body.innerHTML = `
    <form id="contact-form" novalidate>
      <input type="text" name="name" class="form-input">
      <span id="name-error" class="form-error"></span>
      <input type="email" name="email" class="form-input">
      <span id="email-error" class="form-error"></span>
      <textarea name="message" class="form-input"></textarea>
      <span id="message-error" class="form-error"></span>
      <span id="message-counter" class="form-counter">0/1000</span>
      <button type="submit" id="contact-submit">Submit</button>
    </form>
    <div id="form-success" hidden></div>
    <div id="form-error" hidden></div>
  `;
  require('../js/form-validator.js');
}

/**
 * Reference implementation for email validation
 * Used to verify the Form_Validator behavior matches expected pattern
 * @param {string} email - The email to validate
 * @returns {boolean}
 */
function isValidEmailReference(email) {
  if (typeof email !== 'string') {
    return false;
  }
  const trimmed = email.trim();
  if (trimmed === '') {
    return false;
  }
  return EMAIL_PATTERN.test(trimmed);
}

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
 * Generates a valid email string following the pattern: local@domain.tld
 * - Contains exactly one @ symbol
 * - Has characters before @ (local part)
 * - Has characters after @ with at least one dot (domain.tld)
 * @returns {fc.Arbitrary<string>}
 */
function validEmailArbitrary() {
  // Characters allowed in local part (no spaces or @)
  const localPartChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._+-';

  // Characters allowed in domain part (no spaces or @)
  const domainChars = 'abcdefghijklmnopqrstuvwxyz0123456789-';

  // Common TLDs
  const tlds = ['com', 'org', 'net', 'io', 'co', 'edu', 'gov', 'info', 'biz'];

  const localPart = stringFromChars(localPartChars, 1, 30)
    .filter(s => s.length > 0);

  const domainPart = stringFromChars(domainChars, 1, 20)
    .filter(s => s.length > 0 && !s.startsWith('-') && !s.endsWith('-'));

  const tld = fc.constantFrom(...tlds);

  return fc.tuple(localPart, domainPart, tld)
    .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);
}

/**
 * Generates an email string missing the @ symbol
 * @returns {fc.Arbitrary<string>}
 */
function emailMissingAtArbitrary() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789.';
  return stringFromChars(chars, 5, 30)
    .filter(s => !s.includes('@') && s.trim().length > 0);
}

/**
 * Generates an email string with multiple @ symbols
 * @returns {fc.Arbitrary<string>}
 */
function emailMultipleAtArbitrary() {
  return fc.tuple(
    fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0 && !s.includes('@')),
    fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0 && !s.includes('@')),
    fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0 && !s.includes('@')),
  ).map(([a, b, c]) => `${a.trim()}@${b.trim()}@${c.trim()}`);
}

/**
 * Generates an email string missing the local part (starts with @)
 * @returns {fc.Arbitrary<string>}
 */
function emailMissingLocalPartArbitrary() {
  const domainChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return fc.tuple(
    stringFromChars(domainChars, 1, 10),
    fc.constantFrom('com', 'org', 'net'),
  ).map(([domain, tld]) => `@${domain}.${tld}`);
}

/**
 * Generates an email string missing the domain (ends with @)
 * @returns {fc.Arbitrary<string>}
 */
function emailMissingDomainArbitrary() {
  const localChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return stringFromChars(localChars, 1, 15)
    .map(local => `${local}@`);
}

/**
 * Generates an email string missing the TLD (no dot after @)
 * @returns {fc.Arbitrary<string>}
 */
function emailMissingTldArbitrary() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return fc.tuple(
    stringFromChars(chars, 1, 10),
    stringFromChars(chars, 1, 10),
  ).map(([local, domain]) => `${local}@${domain}`);
}

/**
 * Generates an email string with spaces
 * @returns {fc.Arbitrary<string>}
 */
function emailWithSpacesArbitrary() {
  return fc.oneof(
    // Space in local part
    fc.constant('test user@example.com'),
    fc.constant('test\tuser@example.com'),
    // Space in domain
    fc.constant('test@exam ple.com'),
    fc.constant('test@example .com'),
    // Space around @
    fc.constant('test @example.com'),
    fc.constant('test@ example.com'),
    fc.constant('test @ example.com'),
  );
}

/**
 * Generates empty or whitespace-only strings
 * @returns {fc.Arbitrary<string>}
 */
function emptyOrWhitespaceArbitrary() {
  return fc.oneof(
    fc.constant(''),
    stringFromChars(' \t\n', 1, 10),
  );
}

/**
 * Generates a minimum valid email (shortest possible valid format)
 * @returns {fc.Arbitrary<string>}
 */
function minimumValidEmailArbitrary() {
  // Minimum valid: a@b.c (5 characters)
  const singleChar = fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split(''));
  return fc.tuple(singleChar, singleChar, singleChar)
    .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);
}

describe('Property 6: Email Format Validation', () => {
  /**
   * **Validates: Requirements 5.6**
   *
   * Property: Valid emails SHALL be accepted
   * Valid email format: contains exactly one @ symbol, has characters before and after @,
   * and has a domain with at least one dot.
   */
  describe('Valid email acceptance', () => {
    beforeEach(() => {
      loadFormValidator();
    });

    test('For any valid email (local@domain.tld format), validateEmail SHALL return true', () => {
      fc.assert(
        fc.property(
          validEmailArbitrary(),
          (email) => {
            const result = window.FormValidator.validateEmail(email);

            // Property: Valid email format must be accepted
            return result === true;
          },
        ),
        fcConfig,
      );
    });

    test('For any minimum valid email (a@b.c format), validateEmail SHALL return true', () => {
      fc.assert(
        fc.property(
          minimumValidEmailArbitrary(),
          (email) => {
            const result = window.FormValidator.validateEmail(email);

            // Property: Minimum valid email must be accepted
            return result === true;
          },
        ),
        fcConfig,
      );
    });

    test('For any valid email with leading/trailing whitespace, validateEmail SHALL return true', () => {
      fc.assert(
        fc.property(
          validEmailArbitrary(),
          stringFromChars(' \t', 0, 3),
          stringFromChars(' \t', 0, 3),
          (email, leadingWs, trailingWs) => {
            const paddedEmail = leadingWs + email + trailingWs;
            const result = window.FormValidator.validateEmail(paddedEmail);

            // Property: Whitespace padding should not affect valid emails
            return result === true;
          },
        ),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 5.6**
   *
   * Property: Invalid emails SHALL be rejected
   */
  describe('Invalid email rejection - Missing @ symbol', () => {
    beforeEach(() => {
      loadFormValidator();
    });

    test('For any string without @ symbol, validateEmail SHALL return false', () => {
      fc.assert(
        fc.property(
          emailMissingAtArbitrary(),
          (email) => {
            const result = window.FormValidator.validateEmail(email);

            // Property: Email without @ must be rejected
            return result === false;
          },
        ),
        fcConfig,
      );
    });
  });

  describe('Invalid email rejection - Multiple @ symbols', () => {
    beforeEach(() => {
      loadFormValidator();
    });

    test('For any string with multiple @ symbols, validateEmail SHALL return false', () => {
      fc.assert(
        fc.property(
          emailMultipleAtArbitrary(),
          (email) => {
            const result = window.FormValidator.validateEmail(email);

            // Property: Email with multiple @ must be rejected
            return result === false;
          },
        ),
        fcConfig,
      );
    });
  });

  describe('Invalid email rejection - Missing local part', () => {
    beforeEach(() => {
      loadFormValidator();
    });

    test('For any email starting with @ (missing local part), validateEmail SHALL return false', () => {
      fc.assert(
        fc.property(
          emailMissingLocalPartArbitrary(),
          (email) => {
            const result = window.FormValidator.validateEmail(email);

            // Property: Email without local part must be rejected
            return result === false;
          },
        ),
        fcConfig,
      );
    });
  });

  describe('Invalid email rejection - Missing domain', () => {
    beforeEach(() => {
      loadFormValidator();
    });

    test('For any email ending with @ (missing domain), validateEmail SHALL return false', () => {
      fc.assert(
        fc.property(
          emailMissingDomainArbitrary(),
          (email) => {
            const result = window.FormValidator.validateEmail(email);

            // Property: Email without domain must be rejected
            return result === false;
          },
        ),
        fcConfig,
      );
    });
  });

  describe('Invalid email rejection - Missing TLD (no dot after @)', () => {
    beforeEach(() => {
      loadFormValidator();
    });

    test('For any email without dot in domain (missing TLD), validateEmail SHALL return false', () => {
      fc.assert(
        fc.property(
          emailMissingTldArbitrary(),
          (email) => {
            const result = window.FormValidator.validateEmail(email);

            // Property: Email without TLD (no dot) must be rejected
            return result === false;
          },
        ),
        fcConfig,
      );
    });
  });

  describe('Invalid email rejection - Spaces in email', () => {
    beforeEach(() => {
      loadFormValidator();
    });

    test('For any email containing spaces, validateEmail SHALL return false', () => {
      fc.assert(
        fc.property(
          emailWithSpacesArbitrary(),
          (email) => {
            const result = window.FormValidator.validateEmail(email);

            // Property: Email with internal spaces must be rejected
            return result === false;
          },
        ),
        fcConfig,
      );
    });
  });

  describe('Invalid email rejection - Empty or whitespace-only', () => {
    beforeEach(() => {
      loadFormValidator();
    });

    test('For any empty or whitespace-only string, validateEmail SHALL return false', () => {
      fc.assert(
        fc.property(
          emptyOrWhitespaceArbitrary(),
          (email) => {
            const result = window.FormValidator.validateEmail(email);

            // Property: Empty or whitespace-only must be rejected
            return result === false;
          },
        ),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 5.6**
   *
   * Property: validateEmail result SHALL match the email pattern
   */
  describe('Pattern matching consistency', () => {
    beforeEach(() => {
      loadFormValidator();
    });

    test('For any string, validateEmail result SHALL match reference implementation', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            validEmailArbitrary(),
            emailMissingAtArbitrary(),
            emailMultipleAtArbitrary(),
            emailMissingLocalPartArbitrary(),
            emailMissingDomainArbitrary(),
            emailMissingTldArbitrary(),
            emptyOrWhitespaceArbitrary(),
            fc.string({ minLength: 0, maxLength: 50 }),
          ),
          (email) => {
            const validatorResult = window.FormValidator.validateEmail(email);
            const referenceResult = isValidEmailReference(email);

            // Property: Validator must match reference implementation
            return validatorResult === referenceResult;
          },
        ),
        fcConfig,
      );
    });

    test('For any arbitrary string, validateEmail SHALL be consistent with pattern', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          (email) => {
            const validatorResult = window.FormValidator.validateEmail(email);
            const referenceResult = isValidEmailReference(email);

            // Property: Validator must match pattern-based validation
            return validatorResult === referenceResult;
          },
        ),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 5.6**
   *
   * Property: Validation is deterministic
   */
  describe('Validation determinism', () => {
    beforeEach(() => {
      loadFormValidator();
    });

    test('For any email string, validateEmail result SHALL be deterministic', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          (email) => {
            const result1 = window.FormValidator.validateEmail(email);
            const result2 = window.FormValidator.validateEmail(email);

            // Property: Same input must produce same output
            return result1 === result2;
          },
        ),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 5.6**
   *
   * Edge cases and specific examples
   */
  describe('Edge cases', () => {
    beforeEach(() => {
      loadFormValidator();
    });

    test('Minimum valid email (a@b.c) SHALL be accepted', () => {
      const result = window.FormValidator.validateEmail('a@b.c');
      expect(result).toBe(true);
    });

    test('Standard email format SHALL be accepted', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'user+tag@example.net',
        'user-name@sub.domain.com',
        'user_name@example.io',
        '123@456.789',
      ];

      validEmails.forEach(email => {
        expect(window.FormValidator.validateEmail(email)).toBe(true);
      });
    });

    test('Invalid email formats SHALL be rejected', () => {
      const invalidEmails = [
        '',                      // Empty
        '   ',                   // Whitespace only
        'plaintext',             // No @ symbol
        '@domain.com',           // Missing local part
        'user@',                 // Missing domain
        'user@domain',           // Missing TLD (no dot)
        'user@@domain.com',      // Multiple @
        'user@domain@other.com', // Multiple @
        'user @domain.com',      // Space before @
        'user@ domain.com',      // Space after @
        'us er@domain.com',      // Space in local part
        'user@dom ain.com',       // Space in domain
      ];

      invalidEmails.forEach(email => {
        expect(window.FormValidator.validateEmail(email)).toBe(false);
      });
    });

    test('Non-string inputs SHALL return false', () => {
      expect(window.FormValidator.validateEmail(null)).toBe(false);
      expect(window.FormValidator.validateEmail(undefined)).toBe(false);
      expect(window.FormValidator.validateEmail(123)).toBe(false);
      expect(window.FormValidator.validateEmail({})).toBe(false);
      expect(window.FormValidator.validateEmail([])).toBe(false);
    });

    test('Email with special characters in local part SHALL be accepted', () => {
      const specialEmails = [
        'user.name@example.com',
        'user+tag@example.com',
        'user-name@example.com',
        'user_name@example.com',
      ];

      specialEmails.forEach(email => {
        expect(window.FormValidator.validateEmail(email)).toBe(true);
      });
    });

    test('Email with subdomain SHALL be accepted', () => {
      const subdomainEmails = [
        'user@mail.example.com',
        'user@sub.domain.org',
        'user@a.b.c.d.com',
      ];

      subdomainEmails.forEach(email => {
        expect(window.FormValidator.validateEmail(email)).toBe(true);
      });
    });
  });
});
