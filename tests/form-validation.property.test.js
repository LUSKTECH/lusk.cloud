/**
 * Property-Based Tests for Form Validation Correctness
 * Lusk.cloud Landing Page
 *
 * **Validates: Requirements 5.3, 5.4, 5.5**
 *
 * Property 5: Form Validation Correctness
 * For any form submission attempt, the Form_Validator SHALL accept the submission
 * if and only if all required fields contain valid data according to their validation rules,
 * and SHALL display appropriate error messages for each invalid field when validation fails.
 *
 * Validation Rules:
 * - Name: required, minLength=2, maxLength=100
 * - Email: required, valid email format (pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
 * - Message: required, minLength=10, maxLength=1000
 */

const fc = require('fast-check');

// fast-check configuration as specified in design document
const fcConfig = {
  numRuns: 100,
  verbose: true,
};

// Validation rules matching form-validator.js
const validationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    errorMessage: 'Please enter your name (2-100 characters)',
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    errorMessage: 'Please enter a valid email address',
  },
  message: {
    required: true,
    minLength: 10,
    maxLength: 1000,
    errorMessage: 'Please enter a message (10-1000 characters)',
  },
};

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
 * Helper to generate string from character set (fast-check v4 compatible)
 * @param {string} chars - Characters to use
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {fc.Arbitrary<string>}
 */
function stringFromChars(chars, minLength, maxLength) {
  return fc
    .array(fc.constantFrom(...chars.split('')), { minLength, maxLength })
    .map(arr => arr.join(''));
}

/**
 * Generates a valid name string (2-100 characters, non-whitespace-only)
 * @returns {fc.Arbitrary<string>}
 */
function validNameArbitrary() {
  return fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2);
}

/**
 * Generates an invalid name string (empty, whitespace-only, or wrong length)
 * @returns {fc.Arbitrary<string>}
 */
function invalidNameArbitrary() {
  return fc.oneof(
    // Empty string
    fc.constant(''),
    // Whitespace only
    stringFromChars(' \t\n', 1, 10),
    // Too short (1 character after trim) - generate single non-whitespace char
    stringFromChars('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 1, 1),
    // Too long (101+ non-whitespace characters)
    stringFromChars('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 101, 120),
  );
}

/**
 * Generates a valid email string
 * @returns {fc.Arbitrary<string>}
 */
function validEmailArbitrary() {
  // Generate valid email components
  const localPart = stringFromChars('abcdefghijklmnopqrstuvwxyz0123456789._+-', 1, 30).filter(
    s => s.length > 0 && !s.includes(' '),
  );

  const domainPart = stringFromChars('abcdefghijklmnopqrstuvwxyz0123456789-', 1, 20).filter(
    s => s.length > 0 && !s.startsWith('-') && !s.endsWith('-'),
  );

  const tld = fc.constantFrom('com', 'org', 'net', 'io', 'co', 'edu', 'gov');

  return fc
    .tuple(localPart, domainPart, tld)
    .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);
}

/**
 * Generates an invalid email string
 * @returns {fc.Arbitrary<string>}
 */
function invalidEmailArbitrary() {
  return fc.oneof(
    // Empty string
    fc.constant(''),
    // Whitespace only
    stringFromChars(' \t', 1, 5),
    // Missing @ symbol
    fc.string({ minLength: 5, maxLength: 20 }).filter(s => !s.includes('@') && s.trim().length > 0),
    // Missing domain (ends with @)
    fc
      .string({ minLength: 1, maxLength: 10 })
      .filter(s => s.trim().length > 0)
      .map(s => `${s.trim()}@`),
    // Missing local part (starts with @)
    fc
      .string({ minLength: 1, maxLength: 10 })
      .filter(s => s.trim().length > 0)
      .map(s => `@${s.trim()}.com`),
    // Missing TLD (no dot after @)
    fc
      .tuple(
        fc
          .string({ minLength: 1, maxLength: 10 })
          .filter(s => s.trim().length > 0 && !s.includes('@')),
        fc
          .string({ minLength: 1, maxLength: 10 })
          .filter(s => s.trim().length > 0 && !s.includes('.') && !s.includes('@')),
      )
      .map(([local, domain]) => `${local.trim()}@${domain.trim()}`),
    // Contains spaces
    fc.constant('test @example.com'),
    fc.constant('test@ example.com'),
    fc.constant('test @ example.com'),
  );
}

/**
 * Generates a valid message string (10-1000 characters, non-whitespace-only)
 * @returns {fc.Arbitrary<string>}
 */
function validMessageArbitrary() {
  return fc.string({ minLength: 10, maxLength: 1000 }).filter(s => s.trim().length >= 10);
}

/**
 * Generates an invalid message string (empty, whitespace-only, or wrong length)
 * @returns {fc.Arbitrary<string>}
 */
function invalidMessageArbitrary() {
  return fc.oneof(
    // Empty string
    fc.constant(''),
    // Whitespace only
    stringFromChars(' \t\n', 1, 15),
    // Too short (1-9 non-whitespace characters)
    stringFromChars('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 1, 9),
    // Too long (1001+ non-whitespace characters)
    stringFromChars('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 1001, 1050),
  );
}

/**
 * Generates valid form data (all fields valid)
 * @returns {fc.Arbitrary<Object>}
 */
function validFormDataArbitrary() {
  return fc.record({
    name: validNameArbitrary(),
    email: validEmailArbitrary(),
    message: validMessageArbitrary(),
  });
}

/**
 * Generates form data with at least one invalid field
 * @returns {fc.Arbitrary<Object>}
 */
function invalidFormDataArbitrary() {
  // Generate form data where at least one field is invalid
  return fc.oneof(
    // Invalid name only
    fc.record({
      name: invalidNameArbitrary(),
      email: validEmailArbitrary(),
      message: validMessageArbitrary(),
    }),
    // Invalid email only
    fc.record({
      name: validNameArbitrary(),
      email: invalidEmailArbitrary(),
      message: validMessageArbitrary(),
    }),
    // Invalid message only
    fc.record({
      name: validNameArbitrary(),
      email: validEmailArbitrary(),
      message: invalidMessageArbitrary(),
    }),
    // All invalid
    fc.record({
      name: invalidNameArbitrary(),
      email: invalidEmailArbitrary(),
      message: invalidMessageArbitrary(),
    }),
    // Two invalid fields
    fc.record({
      name: invalidNameArbitrary(),
      email: invalidEmailArbitrary(),
      message: validMessageArbitrary(),
    }),
    fc.record({
      name: invalidNameArbitrary(),
      email: validEmailArbitrary(),
      message: invalidMessageArbitrary(),
    }),
    fc.record({
      name: validNameArbitrary(),
      email: invalidEmailArbitrary(),
      message: invalidMessageArbitrary(),
    }),
  );
}

/**
 * Checks if a name value is valid according to validation rules
 * @param {string} name - The name to validate
 * @returns {boolean}
 */
function isValidName(name) {
  if (typeof name !== 'string') {
    return false;
  }
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

/**
 * Checks if an email value is valid according to validation rules
 * @param {string} email - The email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (typeof email !== 'string') {
    return false;
  }
  const trimmed = email.trim();
  if (trimmed === '') {
    return false;
  }
  return validationRules.email.pattern.test(trimmed);
}

/**
 * Checks if a message value is valid according to validation rules
 * @param {string} message - The message to validate
 * @returns {boolean}
 */
function isValidMessage(message) {
  if (typeof message !== 'string') {
    return false;
  }
  const trimmed = message.trim();
  return trimmed.length >= 10 && trimmed.length <= 1000;
}

/**
 * Checks if all form data is valid
 * @param {Object} formData - The form data to validate
 * @returns {boolean}
 */
function isAllFieldsValid(formData) {
  return (
    isValidName(formData.name) && isValidEmail(formData.email) && isValidMessage(formData.message)
  );
}

describe('Property 5: Form Validation Correctness', () => {
  /**
   * **Validates: Requirements 5.3**
   *
   * Property: Form SHALL accept submission if and only if all required fields
   * contain valid data according to their validation rules.
   */
  describe('Form acceptance with valid data', () => {
    beforeEach(() => {
      loadFormValidator();
    });

    test('For any valid form data, validateForm SHALL return isValid=true', () => {
      fc.assert(
        fc.property(validFormDataArbitrary(), formData => {
          const result = window.FormValidator.validateForm(formData);

          // Property: Valid form data must be accepted
          return result.isValid === true;
        }),
        fcConfig,
      );
    });

    test('For any valid form data, validateForm SHALL return empty errors object', () => {
      fc.assert(
        fc.property(validFormDataArbitrary(), formData => {
          const result = window.FormValidator.validateForm(formData);

          // Property: Valid form data must have no errors
          return Object.keys(result.errors).length === 0;
        }),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 5.4**
   *
   * Property: Form SHALL reject submission if any field is invalid.
   */
  describe('Form rejection with invalid data', () => {
    beforeEach(() => {
      loadFormValidator();
    });

    test('For any form data with at least one invalid field, validateForm SHALL return isValid=false', () => {
      fc.assert(
        fc.property(invalidFormDataArbitrary(), formData => {
          const result = window.FormValidator.validateForm(formData);

          // Property: Invalid form data must be rejected
          return result.isValid === false;
        }),
        fcConfig,
      );
    });

    test('For any form data with invalid name, validateForm SHALL include name error', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: invalidNameArbitrary(),
            email: validEmailArbitrary(),
            message: validMessageArbitrary(),
          }),
          formData => {
            const result = window.FormValidator.validateForm(formData);

            // Property: Invalid name must produce name error
            return result.errors.name !== undefined;
          },
        ),
        fcConfig,
      );
    });

    test('For any form data with invalid email, validateForm SHALL include email error', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: validNameArbitrary(),
            email: invalidEmailArbitrary(),
            message: validMessageArbitrary(),
          }),
          formData => {
            const result = window.FormValidator.validateForm(formData);

            // Property: Invalid email must produce email error
            return result.errors.email !== undefined;
          },
        ),
        fcConfig,
      );
    });

    test('For any form data with invalid message, validateForm SHALL include message error', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: validNameArbitrary(),
            email: validEmailArbitrary(),
            message: invalidMessageArbitrary(),
          }),
          formData => {
            const result = window.FormValidator.validateForm(formData);

            // Property: Invalid message must produce message error
            return result.errors.message !== undefined;
          },
        ),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 5.4, 5.5**
   *
   * Property: Form SHALL display appropriate error messages for each invalid field.
   */
  describe('Error message correctness', () => {
    beforeEach(() => {
      loadFormValidator();
    });

    test('For any invalid name, error message SHALL match expected message', () => {
      fc.assert(
        fc.property(invalidNameArbitrary(), name => {
          const result = window.FormValidator.validateField('name', name);

          // Property: Invalid name must have correct error message
          return !result.isValid && result.errorMessage === validationRules.name.errorMessage;
        }),
        fcConfig,
      );
    });

    test('For any invalid email, error message SHALL match expected message', () => {
      fc.assert(
        fc.property(invalidEmailArbitrary(), email => {
          const result = window.FormValidator.validateField('email', email);

          // Property: Invalid email must have correct error message
          return !result.isValid && result.errorMessage === validationRules.email.errorMessage;
        }),
        fcConfig,
      );
    });

    test('For any invalid message, error message SHALL match expected message', () => {
      fc.assert(
        fc.property(invalidMessageArbitrary(), message => {
          const result = window.FormValidator.validateField('message', message);

          // Property: Invalid message must have correct error message
          return !result.isValid && result.errorMessage === validationRules.message.errorMessage;
        }),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 5.3, 5.4, 5.5**
   *
   * Property: Validation is bidirectional - valid iff all fields valid.
   */
  describe('Validation bidirectionality', () => {
    beforeEach(() => {
      loadFormValidator();
    });

    test('For any form data, isValid=true iff all individual fields are valid', () => {
      fc.assert(
        fc.property(fc.oneof(validFormDataArbitrary(), invalidFormDataArbitrary()), formData => {
          const result = window.FormValidator.validateForm(formData);
          const allFieldsValid = isAllFieldsValid(formData);

          // Property: Form validity must match individual field validity
          return result.isValid === allFieldsValid;
        }),
        fcConfig,
      );
    });

    test('For any form data, number of errors SHALL equal number of invalid fields', () => {
      fc.assert(
        fc.property(fc.oneof(validFormDataArbitrary(), invalidFormDataArbitrary()), formData => {
          const result = window.FormValidator.validateForm(formData);

          let expectedErrorCount = 0;
          if (!isValidName(formData.name)) {
            expectedErrorCount++;
          }
          if (!isValidEmail(formData.email)) {
            expectedErrorCount++;
          }
          if (!isValidMessage(formData.message)) {
            expectedErrorCount++;
          }

          // Property: Error count must match invalid field count
          return Object.keys(result.errors).length === expectedErrorCount;
        }),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 5.5**
   *
   * Property: Empty required fields SHALL be rejected.
   */
  describe('Required field validation', () => {
    beforeEach(() => {
      loadFormValidator();
    });

    test('Empty name field SHALL be rejected', () => {
      fc.assert(
        fc.property(fc.constantFrom('', '   ', '\t', '\n', '  \t  '), emptyName => {
          const result = window.FormValidator.validateField('name', emptyName);

          // Property: Empty name must be rejected
          return result.isValid === false;
        }),
        fcConfig,
      );
    });

    test('Empty email field SHALL be rejected', () => {
      fc.assert(
        fc.property(fc.constantFrom('', '   ', '\t', '\n', '  \t  '), emptyEmail => {
          const result = window.FormValidator.validateField('email', emptyEmail);

          // Property: Empty email must be rejected
          return result.isValid === false;
        }),
        fcConfig,
      );
    });

    test('Empty message field SHALL be rejected', () => {
      fc.assert(
        fc.property(fc.constantFrom('', '   ', '\t', '\n', '  \t  '), emptyMessage => {
          const result = window.FormValidator.validateField('message', emptyMessage);

          // Property: Empty message must be rejected
          return result.isValid === false;
        }),
        fcConfig,
      );
    });

    test('Form with all empty fields SHALL be rejected with errors for all fields', () => {
      const emptyFormData = { name: '', email: '', message: '' };
      const result = window.FormValidator.validateForm(emptyFormData);

      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBeDefined();
      expect(result.errors.message).toBeDefined();
    });
  });

  /**
   * **Validates: Requirements 5.3, 5.4, 5.5**
   *
   * Property: Validation is deterministic - same input always produces same result.
   */
  describe('Validation determinism', () => {
    beforeEach(() => {
      loadFormValidator();
    });

    test('For any form data, validation result SHALL be deterministic', () => {
      fc.assert(
        fc.property(fc.oneof(validFormDataArbitrary(), invalidFormDataArbitrary()), formData => {
          const result1 = window.FormValidator.validateForm(formData);
          const result2 = window.FormValidator.validateForm(formData);

          // Property: Same input must produce same output
          return (
            result1.isValid === result2.isValid &&
            JSON.stringify(result1.errors) === JSON.stringify(result2.errors)
          );
        }),
        fcConfig,
      );
    });

    test('For any field value, field validation result SHALL be deterministic', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('name', 'email', 'message'),
          fc.string({ minLength: 0, maxLength: 200 }),
          (fieldName, value) => {
            const result1 = window.FormValidator.validateField(fieldName, value);
            const result2 = window.FormValidator.validateField(fieldName, value);

            // Property: Same input must produce same output
            return (
              result1.isValid === result2.isValid && result1.errorMessage === result2.errorMessage
            );
          },
        ),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 5.3, 5.4, 5.5**
   *
   * Edge cases and boundary conditions
   */
  describe('Boundary conditions', () => {
    beforeEach(() => {
      loadFormValidator();
    });

    test('Name at minimum length (2 chars) SHALL be valid', () => {
      const result = window.FormValidator.validateField('name', 'Jo');
      expect(result.isValid).toBe(true);
    });

    test('Name at maximum length (100 chars) SHALL be valid', () => {
      const result = window.FormValidator.validateField('name', 'A'.repeat(100));
      expect(result.isValid).toBe(true);
    });

    test('Name below minimum length (1 char) SHALL be invalid', () => {
      const result = window.FormValidator.validateField('name', 'J');
      expect(result.isValid).toBe(false);
    });

    test('Name above maximum length (101 chars) SHALL be invalid', () => {
      const result = window.FormValidator.validateField('name', 'A'.repeat(101));
      expect(result.isValid).toBe(false);
    });

    test('Message at minimum length (10 chars) SHALL be valid', () => {
      const result = window.FormValidator.validateField('message', 'A'.repeat(10));
      expect(result.isValid).toBe(true);
    });

    test('Message at maximum length (1000 chars) SHALL be valid', () => {
      const result = window.FormValidator.validateField('message', 'A'.repeat(1000));
      expect(result.isValid).toBe(true);
    });

    test('Message below minimum length (9 chars) SHALL be invalid', () => {
      const result = window.FormValidator.validateField('message', 'A'.repeat(9));
      expect(result.isValid).toBe(false);
    });

    test('Message above maximum length (1001 chars) SHALL be invalid', () => {
      const result = window.FormValidator.validateField('message', 'A'.repeat(1001));
      expect(result.isValid).toBe(false);
    });
  });

  /**
   * **Validates: Requirements 5.3, 5.4, 5.5**
   *
   * Property: Whitespace handling is consistent.
   */
  describe('Whitespace handling', () => {
    beforeEach(() => {
      loadFormValidator();
    });

    test('For any valid name with leading/trailing whitespace, validation SHALL pass', () => {
      fc.assert(
        fc.property(
          validNameArbitrary(),
          stringFromChars(' \t', 0, 5),
          stringFromChars(' \t', 0, 5),
          (name, leadingWs, trailingWs) => {
            const paddedName = leadingWs + name + trailingWs;
            const result = window.FormValidator.validateField('name', paddedName);

            // Property: Whitespace padding should not affect valid names
            return result.isValid === true;
          },
        ),
        fcConfig,
      );
    });

    test('For any valid email with leading/trailing whitespace, validation SHALL pass', () => {
      fc.assert(
        fc.property(
          validEmailArbitrary(),
          stringFromChars(' \t', 0, 5),
          stringFromChars(' \t', 0, 5),
          (email, leadingWs, trailingWs) => {
            const paddedEmail = leadingWs + email + trailingWs;
            const result = window.FormValidator.validateField('email', paddedEmail);

            // Property: Whitespace padding should not affect valid emails
            return result.isValid === true;
          },
        ),
        fcConfig,
      );
    });

    test('For any valid message with leading/trailing whitespace, validation SHALL pass', () => {
      fc.assert(
        fc.property(
          validMessageArbitrary(),
          stringFromChars(' \t', 0, 5),
          stringFromChars(' \t', 0, 5),
          (message, leadingWs, trailingWs) => {
            const paddedMessage = leadingWs + message + trailingWs;
            const result = window.FormValidator.validateField('message', paddedMessage);

            // Property: Whitespace padding should not affect valid messages
            return result.isValid === true;
          },
        ),
        fcConfig,
      );
    });
  });
});
