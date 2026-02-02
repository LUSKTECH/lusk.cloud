/**
 * Unit Tests for Form Validator Module
 * Lusk.cloud Landing Page
 *
 * Tests the form validation functionality
 * Validates: Requirements 5.3, 5.4, 5.5, 5.6
 */

beforeEach(() => {
  // Reset DOM
  document.body.innerHTML = '';

  // Clear module cache and window object
  delete window.FormValidator;
  jest.resetModules();
});

afterEach(() => {
  jest.clearAllMocks();
});

// Helper to load the module with proper DOM setup
function loadModuleWithDOM(html = '<div></div>') {
  document.body.innerHTML = html;
  require('../js/form-validator.js');
}

// Helper to create a full contact form DOM
function createContactFormDOM() {
  return `
        <form id="contact-form" novalidate>
            <div class="form-group">
                <label for="contact-name">Your Name</label>
                <input type="text" id="contact-name" name="name" class="form-input" required>
                <span id="name-error" class="form-error"></span>
            </div>
            <div class="form-group">
                <label for="contact-email">Email Address</label>
                <input type="email" id="contact-email" name="email" class="form-input" required>
                <span id="email-error" class="form-error"></span>
            </div>
            <div class="form-group">
                <label for="contact-message">Your Message</label>
                <textarea id="contact-message" name="message" class="form-input form-textarea" required></textarea>
                <span id="message-error" class="form-error"></span>
                <span id="message-counter" class="form-counter">0/1000</span>
            </div>
            <button type="submit" id="contact-submit">Send Message</button>
        </form>
        <div id="form-success" hidden></div>
        <div id="form-error" hidden></div>
    `;
}

describe('Form Validator Module', () => {
  describe('Module Loading', () => {
    test('should expose FormValidator on window after loading', () => {
      loadModuleWithDOM(createContactFormDOM());

      expect(window.FormValidator).toBeDefined();
      expect(typeof window.FormValidator.validateField).toBe('function');
      expect(typeof window.FormValidator.validateEmail).toBe('function');
      expect(typeof window.FormValidator.validateForm).toBe('function');
    });

    test('should expose validation rules', () => {
      loadModuleWithDOM(createContactFormDOM());

      expect(window.FormValidator.validationRules).toBeDefined();
      expect(window.FormValidator.validationRules.name).toBeDefined();
      expect(window.FormValidator.validationRules.email).toBeDefined();
      expect(window.FormValidator.validationRules.message).toBeDefined();
    });
  });

  describe('validateEmail()', () => {
    beforeEach(() => {
      loadModuleWithDOM(createContactFormDOM());
    });

    // Valid email formats - Requirement 5.6
    test('should accept valid email with standard format', () => {
      expect(window.FormValidator.validateEmail('test@example.com')).toBe(true);
    });

    test('should accept valid email with subdomain', () => {
      expect(window.FormValidator.validateEmail('user@mail.example.com')).toBe(true);
    });

    test('should accept valid email with plus sign', () => {
      expect(window.FormValidator.validateEmail('user+tag@example.com')).toBe(true);
    });

    test('should accept valid email with dots in local part', () => {
      expect(window.FormValidator.validateEmail('first.last@example.com')).toBe(true);
    });

    test('should accept valid email with numbers', () => {
      expect(window.FormValidator.validateEmail('user123@example123.com')).toBe(true);
    });

    test('should accept valid email with hyphen in domain', () => {
      expect(window.FormValidator.validateEmail('user@my-domain.com')).toBe(true);
    });

    // Invalid email formats - Requirement 5.6
    test('should reject email without @ symbol', () => {
      expect(window.FormValidator.validateEmail('testexample.com')).toBe(false);
    });

    test('should reject email without domain', () => {
      expect(window.FormValidator.validateEmail('test@')).toBe(false);
    });

    test('should reject email without local part', () => {
      expect(window.FormValidator.validateEmail('@example.com')).toBe(false);
    });

    test('should reject email without TLD', () => {
      expect(window.FormValidator.validateEmail('test@example')).toBe(false);
    });

    test('should reject email with spaces', () => {
      expect(window.FormValidator.validateEmail('test @example.com')).toBe(false);
    });

    test('should reject email with multiple @ symbols', () => {
      expect(window.FormValidator.validateEmail('test@@example.com')).toBe(false);
    });

    test('should reject empty string', () => {
      expect(window.FormValidator.validateEmail('')).toBe(false);
    });

    test('should reject whitespace only', () => {
      expect(window.FormValidator.validateEmail('   ')).toBe(false);
    });

    test('should reject non-string input', () => {
      expect(window.FormValidator.validateEmail(null)).toBe(false);
      expect(window.FormValidator.validateEmail(undefined)).toBe(false);
      expect(window.FormValidator.validateEmail(123)).toBe(false);
    });

    test('should trim whitespace before validation', () => {
      expect(window.FormValidator.validateEmail('  test@example.com  ')).toBe(true);
    });
  });

  describe('validateField()', () => {
    beforeEach(() => {
      loadModuleWithDOM(createContactFormDOM());
    });

    // Name field validation - Requirement 5.5
    describe('name field', () => {
      test('should accept valid name with minimum length (2 chars)', () => {
        const result = window.FormValidator.validateField('name', 'Jo');
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBe('');
      });

      test('should accept valid name with maximum length (100 chars)', () => {
        const longName = 'A'.repeat(100);
        const result = window.FormValidator.validateField('name', longName);
        expect(result.isValid).toBe(true);
      });

      test('should reject empty name', () => {
        const result = window.FormValidator.validateField('name', '');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Please enter your name (2-100 characters)');
      });

      test('should reject name with only whitespace', () => {
        const result = window.FormValidator.validateField('name', '   ');
        expect(result.isValid).toBe(false);
      });

      test('should reject name too short (1 char)', () => {
        const result = window.FormValidator.validateField('name', 'J');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Please enter your name (2-100 characters)');
      });

      test('should reject name too long (101 chars)', () => {
        const longName = 'A'.repeat(101);
        const result = window.FormValidator.validateField('name', longName);
        expect(result.isValid).toBe(false);
      });

      test('should trim whitespace before validation', () => {
        const result = window.FormValidator.validateField('name', '  John  ');
        expect(result.isValid).toBe(true);
      });
    });

    // Email field validation - Requirement 5.6
    describe('email field', () => {
      test('should accept valid email', () => {
        const result = window.FormValidator.validateField('email', 'test@example.com');
        expect(result.isValid).toBe(true);
      });

      test('should reject empty email', () => {
        const result = window.FormValidator.validateField('email', '');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Please enter a valid email address');
      });

      test('should reject invalid email format', () => {
        const result = window.FormValidator.validateField('email', 'invalid-email');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Please enter a valid email address');
      });
    });

    // Message field validation - Requirement 5.5
    describe('message field', () => {
      test('should accept valid message with minimum length (10 chars)', () => {
        const result = window.FormValidator.validateField('message', 'Hello test');
        expect(result.isValid).toBe(true);
      });

      test('should accept valid message with maximum length (1000 chars)', () => {
        const longMessage = 'A'.repeat(1000);
        const result = window.FormValidator.validateField('message', longMessage);
        expect(result.isValid).toBe(true);
      });

      test('should reject empty message', () => {
        const result = window.FormValidator.validateField('message', '');
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Please enter a message (10-1000 characters)');
      });

      test('should reject message too short (9 chars)', () => {
        const result = window.FormValidator.validateField('message', 'Too short');
        expect(result.isValid).toBe(false);
      });

      test('should reject message too long (1001 chars)', () => {
        const longMessage = 'A'.repeat(1001);
        const result = window.FormValidator.validateField('message', longMessage);
        expect(result.isValid).toBe(false);
      });
    });

    // Unknown field
    describe('unknown field', () => {
      test('should return valid for unknown field names', () => {
        const result = window.FormValidator.validateField('unknown', 'any value');
        expect(result.isValid).toBe(true);
      });
    });

    // Non-required field (edge case - not used in current form but validates the code path)
    describe('non-required field', () => {
      test('should return valid for non-required empty field', () => {
        // Temporarily add a non-required field to validation rules
        window.FormValidator.validationRules.optional = {
          required: false,
          minLength: 2,
          maxLength: 100,
          errorMessage: 'Optional field error',
        };

        const result = window.FormValidator.validateField('optional', '');
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBe('');

        // Clean up
        delete window.FormValidator.validationRules.optional;
      });
    });
  });

  describe('validateForm()', () => {
    beforeEach(() => {
      loadModuleWithDOM(createContactFormDOM());
    });

    // Requirement 5.3 - Valid submission
    test('should accept form with all valid fields', () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a valid message with enough characters.',
      };

      const result = window.FormValidator.validateForm(formData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    // Requirement 5.4 - Invalid submission shows errors
    test('should reject form with all invalid fields', () => {
      const formData = {
        name: '',
        email: 'invalid',
        message: 'short',
      };

      const result = window.FormValidator.validateForm(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBeDefined();
      expect(result.errors.message).toBeDefined();
    });

    test('should reject form with one invalid field', () => {
      const formData = {
        name: 'John Doe',
        email: 'invalid-email',
        message: 'This is a valid message with enough characters.',
      };

      const result = window.FormValidator.validateForm(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBeDefined();
      expect(result.errors.name).toBeUndefined();
      expect(result.errors.message).toBeUndefined();
    });

    // Requirement 5.5 - Empty required fields
    test('should reject form with empty required fields', () => {
      const formData = {
        name: '',
        email: '',
        message: '',
      };

      const result = window.FormValidator.validateForm(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('Please enter your name (2-100 characters)');
      expect(result.errors.email).toBe('Please enter a valid email address');
      expect(result.errors.message).toBe('Please enter a message (10-1000 characters)');
    });

    test('should handle missing fields in formData', () => {
      const formData = {};

      const result = window.FormValidator.validateForm(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBeDefined();
      expect(result.errors.message).toBeDefined();
    });
  });

  describe('Form Submission Handler', () => {
    beforeEach(() => {
      loadModuleWithDOM(createContactFormDOM());
    });

    test('should prevent default form submission', () => {
      const form = document.getElementById('contact-form');
      const event = new Event('submit', { bubbles: true, cancelable: true });

      let defaultPrevented = false;
      const originalPreventDefault = event.preventDefault.bind(event);
      event.preventDefault = function() {
        defaultPrevented = true;
        originalPreventDefault();
      };

      form.dispatchEvent(event);

      expect(defaultPrevented).toBe(true);
    });

    test('should add error class to invalid fields', () => {
      const form = document.getElementById('contact-form');
      const nameInput = form.elements.name;

      // Submit with empty fields
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);

      expect(nameInput.classList.contains('error')).toBe(true);
    });

    test('should display error messages for invalid fields', () => {
      const form = document.getElementById('contact-form');

      // Submit with empty fields
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);

      const nameError = document.getElementById('name-error');
      expect(nameError.textContent).toBe('Please enter your name (2-100 characters)');
    });

    test('should set aria-invalid attribute on invalid fields', () => {
      const form = document.getElementById('contact-form');
      const nameInput = form.elements.name;

      // Submit with empty fields
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);

      expect(nameInput.getAttribute('aria-invalid')).toBe('true');
    });

    test('should focus on first invalid field', () => {
      const form = document.getElementById('contact-form');
      const nameInput = form.elements.name;

      // Mock focus
      nameInput.focus = jest.fn();

      // Submit with empty fields
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);

      expect(nameInput.focus).toHaveBeenCalled();
    });

    test('should clear error when field becomes valid', () => {
      const form = document.getElementById('contact-form');
      const nameInput = form.elements.name;

      // First, trigger an error
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(nameInput.classList.contains('error')).toBe(true);

      // Now enter valid data and trigger input event
      nameInput.value = 'John Doe';
      const inputEvent = new Event('input', { bubbles: true });
      nameInput.dispatchEvent(inputEvent);

      expect(nameInput.classList.contains('error')).toBe(false);
    });
  });

  describe('Real-time Validation', () => {
    beforeEach(() => {
      loadModuleWithDOM(createContactFormDOM());
    });

    test('should validate field on blur', () => {
      const form = document.getElementById('contact-form');
      const nameInput = form.elements.name;

      // Leave field empty and blur
      const blurEvent = new Event('blur', { bubbles: true });
      nameInput.dispatchEvent(blurEvent);

      expect(nameInput.classList.contains('error')).toBe(true);
    });

    test('should clear error on blur when field is valid', () => {
      const form = document.getElementById('contact-form');
      const nameInput = form.elements.name;

      // First add error class
      nameInput.classList.add('error');

      // Enter valid data and blur
      nameInput.value = 'John Doe';
      const blurEvent = new Event('blur', { bubbles: true });
      nameInput.dispatchEvent(blurEvent);

      expect(nameInput.classList.contains('error')).toBe(false);
    });
  });

  describe('Character Counter', () => {
    beforeEach(() => {
      loadModuleWithDOM(createContactFormDOM());
    });

    test('should update character counter on input', () => {
      const form = document.getElementById('contact-form');
      const messageInput = form.elements.message;
      const counter = document.getElementById('message-counter');

      messageInput.value = 'Hello World';
      const inputEvent = new Event('input', { bubbles: true });
      messageInput.dispatchEvent(inputEvent);

      expect(counter.textContent).toBe('11/1000');
    });

    test('should add warning class when approaching limit', () => {
      const form = document.getElementById('contact-form');
      const messageInput = form.elements.message;
      const counter = document.getElementById('message-counter');

      // Set value to 91% of max (910 chars)
      messageInput.value = 'A'.repeat(910);
      const inputEvent = new Event('input', { bubbles: true });
      messageInput.dispatchEvent(inputEvent);

      expect(counter.classList.contains('warning')).toBe(true);
    });

    test('should add error class when over limit', () => {
      const form = document.getElementById('contact-form');
      const messageInput = form.elements.message;
      const counter = document.getElementById('message-counter');

      // Set value over max (1001 chars)
      messageInput.value = 'A'.repeat(1001);
      const inputEvent = new Event('input', { bubbles: true });
      messageInput.dispatchEvent(inputEvent);

      expect(counter.classList.contains('error')).toBe(true);
    });
  });

  describe('Success Message', () => {
    beforeEach(() => {
      loadModuleWithDOM(createContactFormDOM());
      // Mock fetch for Netlify form submission
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
        }),
      );
    });

    afterEach(() => {
      delete global.fetch;
    });

    test('should show success message on valid submission', async () => {
      const form = document.getElementById('contact-form');
      form.setAttribute('name', 'contact');
      const successMessage = document.getElementById('form-success');

      // Fill in valid data
      form.elements.name.value = 'John Doe';
      form.elements.email.value = 'john@example.com';
      form.elements.message.value = 'This is a valid message with enough characters.';

      // Submit form
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);

      // Wait for promises to resolve
      await Promise.resolve();
      await Promise.resolve();

      expect(successMessage.hidden).toBe(false);
    });

    test('should hide form on successful submission', async () => {
      const form = document.getElementById('contact-form');
      form.setAttribute('name', 'contact');

      // Fill in valid data
      form.elements.name.value = 'John Doe';
      form.elements.email.value = 'john@example.com';
      form.elements.message.value = 'This is a valid message with enough characters.';

      // Submit form
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);

      // Wait for promises to resolve
      await Promise.resolve();
      await Promise.resolve();

      expect(form.style.display).toBe('none');
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      loadModuleWithDOM(createContactFormDOM());
      // Mock fetch for Netlify form submission
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
        }),
      );
    });

    afterEach(() => {
      delete global.fetch;
    });

    test('should show loading state during submission', () => {
      const form = document.getElementById('contact-form');
      form.setAttribute('name', 'contact');
      const submitButton = document.getElementById('contact-submit');

      // Fill in valid data
      form.elements.name.value = 'John Doe';
      form.elements.email.value = 'john@example.com';
      form.elements.message.value = 'This is a valid message with enough characters.';

      // Submit form
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);

      // Check loading state is active
      expect(submitButton.classList.contains('loading')).toBe(true);
      expect(submitButton.disabled).toBe(true);
    });

    test('should remove loading state after submission completes', async () => {
      const form = document.getElementById('contact-form');
      form.setAttribute('name', 'contact');
      const submitButton = document.getElementById('contact-submit');

      // Fill in valid data
      form.elements.name.value = 'John Doe';
      form.elements.email.value = 'john@example.com';
      form.elements.message.value = 'This is a valid message with enough characters.';

      // Submit form
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);

      // Wait for promises to resolve
      await Promise.resolve();
      await Promise.resolve();

      expect(submitButton.classList.contains('loading')).toBe(false);
      expect(submitButton.disabled).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle form not present in DOM', () => {
      // Load module without form
      loadModuleWithDOM('<div>No form here</div>');

      // Should not throw
      expect(window.FormValidator).toBeDefined();
    });

    test('should handle missing error elements gracefully', () => {
      document.body.innerHTML = `
                <form id="contact-form" novalidate>
                    <input type="text" name="name" class="form-input">
                    <input type="email" name="email" class="form-input">
                    <textarea name="message" class="form-input"></textarea>
                    <button type="submit">Submit</button>
                </form>
            `;

      require('../js/form-validator.js');

      const form = document.getElementById('contact-form');
      const event = new Event('submit', { bubbles: true, cancelable: true });

      // Should not throw even without error elements
      expect(() => {
        form.dispatchEvent(event);
      }).not.toThrow();
    });
  });
});

describe('Additional Coverage Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete window.FormValidator;
    jest.resetModules();
  });

  afterEach(() => {
    delete global.fetch;
  });

  describe('Submission Error Handling', () => {
    test('should show submission error when form submission fails', async () => {
      // Create DOM with form
      document.body.innerHTML = `
        <form id="contact-form" name="contact" novalidate>
          <input type="text" name="name" class="form-input" value="John Doe">
          <input type="email" name="email" class="form-input" value="john@example.com">
          <textarea name="message" class="form-input">This is a valid message with enough characters.</textarea>
          <button type="submit" id="contact-submit">Submit</button>
        </form>
        <div id="form-success" hidden></div>
        <div id="form-error" hidden></div>
      `;

      // Mock fetch to reject
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        }),
      );

      require('../js/form-validator.js');

      const form = document.getElementById('contact-form');
      const errorMessage = document.getElementById('form-error');

      // Submit form
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);

      // Wait for promises to resolve
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(errorMessage.hidden).toBe(false);
    });
  });

  describe('DOMContentLoaded initialization', () => {
    test('should initialize on DOMContentLoaded when document is loading', () => {
      document.body.innerHTML = `
        <form id="contact-form" novalidate>
          <input type="text" name="name" class="form-input">
          <input type="email" name="email" class="form-input">
          <textarea name="message" class="form-input"></textarea>
          <button type="submit">Submit</button>
        </form>
      `;

      // Mock document.readyState as 'loading'
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        configurable: true,
      });

      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      require('../js/form-validator.js');

      expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));

      // Restore
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        configurable: true,
      });
      addEventListenerSpy.mockRestore();
    });
  });

  describe('Missing form elements', () => {
    test('should handle missing success message element', async () => {
      document.body.innerHTML = `
        <form id="contact-form" name="contact" novalidate>
          <input type="text" name="name" class="form-input" value="John Doe">
          <input type="email" name="email" class="form-input" value="john@example.com">
          <textarea name="message" class="form-input">This is a valid message with enough characters.</textarea>
          <button type="submit" id="contact-submit">Submit</button>
        </form>
      `;

      // Mock fetch
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
        }),
      );

      require('../js/form-validator.js');

      const form = document.getElementById('contact-form');
      const event = new Event('submit', { bubbles: true, cancelable: true });

      expect(() => {
        form.dispatchEvent(event);
      }).not.toThrow();

      await Promise.resolve();
      await Promise.resolve();
    });

    test('should handle missing submit button', () => {
      document.body.innerHTML = `
        <form id="contact-form" novalidate>
          <input type="text" name="name" class="form-input">
          <input type="email" name="email" class="form-input">
          <textarea name="message" class="form-input"></textarea>
        </form>
      `;

      require('../js/form-validator.js');

      const form = document.getElementById('contact-form');
      const event = new Event('submit', { bubbles: true, cancelable: true });

      expect(() => {
        form.dispatchEvent(event);
      }).not.toThrow();
    });

    test('should handle missing character counter', () => {
      document.body.innerHTML = `
        <form id="contact-form" novalidate>
          <input type="text" name="name" class="form-input">
          <input type="email" name="email" class="form-input">
          <textarea name="message" class="form-input">Test message</textarea>
          <button type="submit">Submit</button>
        </form>
      `;

      require('../js/form-validator.js');

      const form = document.getElementById('contact-form');
      const messageInput = form.elements.message;

      expect(() => {
        messageInput.dispatchEvent(new Event('input', { bubbles: true }));
      }).not.toThrow();
    });
  });
});
