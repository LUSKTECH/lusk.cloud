/**
 * Form Validator Module
 * Handles contact form validation and submission
 * Requirements: 5.3, 5.4, 5.5, 5.6
 */

(function () {
  'use strict';

  // Validation rules configuration
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

  /**
   * Validates an email address using regex pattern
   * @param {string} email - The email address to validate
   * @returns {boolean} - True if valid, false otherwise
   * Validates: Requirement 5.6
   */
  function validateEmail(email) {
    if (typeof email !== 'string') {
      return false;
    }
    const trimmedEmail = email.trim();
    if (trimmedEmail === '') {
      return false;
    }
    return validationRules.email.pattern.test(trimmedEmail);
  }

  /**
   * Validates a single form field
   * @param {string} fieldName - The name of the field to validate
   * @param {string} value - The value to validate
   * @returns {Object} - Validation result with isValid and errorMessage
   * Validates: Requirements 5.4, 5.5
   */
  function validateField(fieldName, value) {
    const rules = validationRules[fieldName];

    if (!rules) {
      return { isValid: true, errorMessage: '' };
    }

    const trimmedValue = typeof value === 'string' ? value.trim() : '';

    // Check required constraint (Requirement 5.5)
    if (rules.required && trimmedValue === '') {
      return {
        isValid: false,
        errorMessage: rules.errorMessage,
      };
    }

    // If not required and empty, it's valid
    if (!rules.required && trimmedValue === '') {
      return { isValid: true, errorMessage: '' };
    }

    // Check email pattern (Requirement 5.6)
    if (fieldName === 'email' && !validateEmail(trimmedValue)) {
      return {
        isValid: false,
        errorMessage: rules.errorMessage,
      };
    }

    // Check minimum length constraint
    if (rules.minLength && trimmedValue.length < rules.minLength) {
      return {
        isValid: false,
        errorMessage: rules.errorMessage,
      };
    }

    // Check maximum length constraint
    if (rules.maxLength && trimmedValue.length > rules.maxLength) {
      return {
        isValid: false,
        errorMessage: rules.errorMessage,
      };
    }

    return { isValid: true, errorMessage: '' };
  }

  /**
   * Validates all form fields
   * @param {Object} formData - Object containing field names and values
   * @returns {Object} - Object with isValid boolean and errors object
   * Validates: Requirements 5.3, 5.4, 5.5
   */
  function validateForm(formData) {
    const errors = {};
    let isValid = true;

    for (const fieldName in validationRules) {
      const value = formData[fieldName] || '';
      const result = validateField(fieldName, value);

      if (!result.isValid) {
        isValid = false;
        errors[fieldName] = result.errorMessage;
      }
    }

    return { isValid, errors };
  }

  /**
   * Displays error message for a field
   * @param {HTMLElement} input - The input element
   * @param {string} message - The error message to display
   */
  function showFieldError(input, message) {
    const errorElement = document.getElementById(`${input.name}-error`);

    input.classList.add('error');
    input.setAttribute('aria-invalid', 'true');

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('visible');
    }
  }

  /**
   * Clears error message for a field
   * @param {HTMLElement} input - The input element
   */
  function clearFieldError(input) {
    const errorElement = document.getElementById(`${input.name}-error`);

    input.classList.remove('error');
    input.setAttribute('aria-invalid', 'false');

    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('visible');
    }
  }

  /**
   * Updates the character counter for the message field
   * @param {HTMLTextAreaElement} textarea - The textarea element
   */
  function updateCharacterCounter(textarea) {
    const counter = document.getElementById('message-counter');
    if (counter && textarea) {
      const currentLength = textarea.value.length;
      const maxLength = validationRules.message.maxLength;
      counter.textContent = `${currentLength}/${maxLength}`;

      // Add warning class if approaching limit
      if (currentLength > maxLength * 0.9) {
        counter.classList.add('warning');
      } else {
        counter.classList.remove('warning');
      }

      // Add error class if over limit
      if (currentLength > maxLength) {
        counter.classList.add('error');
      } else {
        counter.classList.remove('error');
      }
    }
  }

  /**
   * Shows the success message and hides the form
   * Validates: Requirement 5.3
   */
  function showSuccessMessage() {
    const form = document.getElementById('contact-form');
    const successMessage = document.getElementById('form-success');

    if (form) {
      form.style.display = 'none';
    }

    if (successMessage) {
      successMessage.hidden = false;
      successMessage.focus();
    }
  }

  /**
   * Shows the error message for submission failures
   */
  function showSubmissionError() {
    const errorMessage = document.getElementById('form-error');

    if (errorMessage) {
      errorMessage.hidden = false;
    }
  }

  /**
   * Hides the submission error message
   */
  function hideSubmissionError() {
    const errorMessage = document.getElementById('form-error');

    if (errorMessage) {
      errorMessage.hidden = true;
    }
  }

  /**
   * Sets the loading state on the submit button
   * @param {boolean} isLoading - Whether to show loading state
   */
  function setLoadingState(isLoading) {
    const submitButton = document.getElementById('contact-submit');

    if (submitButton) {
      if (isLoading) {
        submitButton.classList.add('loading');
        submitButton.disabled = true;
        submitButton.setAttribute('aria-busy', 'true');
      } else {
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
        submitButton.setAttribute('aria-busy', 'false');
      }
    }
  }

  /**
   * Handles form submission
   * @param {Event} event - The submit event
   * Validates: Requirements 5.3, 5.4, 5.5
   */
  async function handleFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = {
      name: form.elements.name.value,
      email: form.elements.email.value,
      message: form.elements.message.value,
    };

    // Hide any previous submission errors
    hideSubmissionError();

    // Validate all fields
    const validation = validateForm(formData);

    // Clear all previous errors first
    const inputs = form.querySelectorAll('.form-input');
    inputs.forEach(input => clearFieldError(input));

    // If validation fails, show errors (Requirement 5.4)
    if (!validation.isValid) {
      let firstInvalidField = null;

      for (const fieldName in validation.errors) {
        const input = form.elements[fieldName];
        if (input) {
          showFieldError(input, validation.errors[fieldName]);
          if (!firstInvalidField) {
            firstInvalidField = input;
          }
        }
      }

      // Focus on first invalid field (Requirement 5.5)
      if (firstInvalidField) {
        firstInvalidField.focus();
      }

      return;
    }

    // Show loading state
    setLoadingState(true);

    try {
      // Submit to Netlify Forms
      await submitForm(formData, form);

      // Show success message (Requirement 5.3)
      showSuccessMessage();
    } catch {
      // Show submission error
      showSubmissionError();
    } finally {
      setLoadingState(false);
    }
  }

  /**
   * Submits the form data to Netlify Forms
   * @param {Object} formData - The form data to submit
   * @param {HTMLFormElement} form - The form element
   * @returns {Promise} - Resolves on success, rejects on failure
   */
  function submitForm(formData, form) {
    const body = new URLSearchParams({
      'form-name': form.getAttribute('name') || 'contact',
      ...formData,
    }).toString();

    return fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    }).then(response => {
      if (!response.ok) {
        throw new Error(`Form submission failed: ${response.status}`);
      }
      return { success: true, message: 'Form submitted successfully' };
    });
  }

  /**
   * Handles real-time validation on blur
   * @param {Event} event - The blur event
   */
  function handleFieldBlur(event) {
    const input = event.target;
    const fieldName = input.name;
    const value = input.value;

    const result = validateField(fieldName, value);

    if (!result.isValid) {
      showFieldError(input, result.errorMessage);
    } else {
      clearFieldError(input);
    }
  }

  /**
   * Handles real-time validation on input
   * @param {Event} event - The input event
   */
  function handleFieldInput(event) {
    const input = event.target;
    const fieldName = input.name;

    // Update character counter for message field
    if (fieldName === 'message') {
      updateCharacterCounter(input);
    }

    // If field has error class, validate on input to provide immediate feedback
    if (input.classList.contains('error')) {
      const result = validateField(fieldName, input.value);
      if (result.isValid) {
        clearFieldError(input);
      }
    }
  }

  /**
   * Initializes the contact form validation
   */
  function initContactForm() {
    const form = document.getElementById('contact-form');

    if (!form) {
      return;
    }

    // Attach form submission handler
    form.addEventListener('submit', handleFormSubmit);

    // Attach blur event listeners for real-time validation
    const inputs = form.querySelectorAll('.form-input');
    inputs.forEach(input => {
      input.addEventListener('blur', handleFieldBlur);
      input.addEventListener('input', handleFieldInput);
    });

    // Initialize character counter for message field
    const messageField = form.elements.message;
    if (messageField) {
      updateCharacterCounter(messageField);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForm);
  } else {
    initContactForm();
  }

  // Export functions for testing
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      validateField,
      validateEmail,
      validateForm,
      validationRules,
    };
  }

  // Also expose to window for browser testing
  if (typeof window !== 'undefined') {
    window.FormValidator = {
      validateField,
      validateEmail,
      validateForm,
      validationRules,
    };
  }
})();
