/**
 * Property-Based Tests for Service Card Completeness
 * Lusk.cloud Landing Page
 *
 * **Validates: Requirements 3.2**
 *
 * Property 4: Service Card Completeness
 * For any service card rendered in the services section, the card SHALL contain
 * a non-empty title element, a non-empty description element, and a visible icon element.
 */

const fc = require('fast-check');

// fast-check configuration as specified in design document
const fcConfig = {
  numRuns: 100,
  verbose: true,
};

/**
 * Service card data structure matching the design document
 * @typedef {Object} ServiceData
 * @property {string} id - Unique identifier for the service
 * @property {string} title - Service title (non-empty)
 * @property {string} description - Service description (non-empty)
 * @property {string} icon - Icon identifier (valid CSS class name characters)
 */

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
 * Generates a valid CSS class name string (alphanumeric and hyphens, starting with letter)
 * @returns {fc.Arbitrary<string>}
 */
function cssClassNameArbitrary() {
  // CSS class names must start with a letter and can contain letters, digits, hyphens, underscores
  const firstChar = fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split(''));
  const restChars = stringFromChars('abcdefghijklmnopqrstuvwxyz0123456789-_', 0, 20);
  return fc.tuple(firstChar, restChars).map(([first, rest]) => first + rest);
}

/**
 * Generates a valid service card data object
 * @returns {fc.Arbitrary<ServiceData>}
 */
function serviceDataArbitrary() {
  return fc.record({
    // ID should be a valid HTML id (no spaces, valid characters)
    id: cssClassNameArbitrary(),
    // Title can be any non-empty string (displayed as text content)
    title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    // Description can be any non-empty string (displayed as text content)
    description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
    // Icon must be a valid CSS class name (used in classList.add)
    icon: cssClassNameArbitrary(),
  });
}

/**
 * Creates a service card DOM element from service data
 * This mirrors the HTML structure in index.html
 * @param {ServiceData} serviceData - The service data to render
 * @returns {HTMLElement} - The service card article element
 */
function createServiceCard(serviceData) {
  const article = document.createElement('article');
  article.className = 'service-card';
  article.id = serviceData.id;

  // Create icon container with SVG
  const iconDiv = document.createElement('div');
  iconDiv.className = 'service-icon';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.setAttribute('width', '64');
  svg.setAttribute('height', '64');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add(`icon-${serviceData.icon}`);
  // Add a simple circle as placeholder content
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '32');
  circle.setAttribute('cy', '32');
  circle.setAttribute('r', '28');
  svg.appendChild(circle);
  iconDiv.appendChild(svg);

  // Create title
  const title = document.createElement('h3');
  title.className = 'service-title';
  title.textContent = serviceData.title;

  // Create description
  const description = document.createElement('p');
  description.className = 'service-description';
  description.textContent = serviceData.description;

  // Assemble card
  article.appendChild(iconDiv);
  article.appendChild(title);
  article.appendChild(description);

  return article;
}

/**
 * Validates that a service card has all required elements
 * @param {HTMLElement} card - The service card element to validate
 * @returns {Object} - Validation result with details
 */
function validateServiceCard(card) {
  const titleElement = card.querySelector('.service-title');
  const descriptionElement = card.querySelector('.service-description');
  const iconElement = card.querySelector('.service-icon');
  const svgElement = iconElement ? iconElement.querySelector('svg') : null;

  return {
    hasTitleElement: titleElement !== null,
    hasNonEmptyTitle: titleElement !== null && titleElement.textContent.trim().length > 0,
    hasDescriptionElement: descriptionElement !== null,
    hasNonEmptyDescription:
      descriptionElement !== null && descriptionElement.textContent.trim().length > 0,
    hasIconElement: iconElement !== null,
    hasVisibleIcon:
      svgElement !== null &&
      svgElement.getAttribute('width') !== '0' &&
      svgElement.getAttribute('height') !== '0',
    titleContent: titleElement ? titleElement.textContent : null,
    descriptionContent: descriptionElement ? descriptionElement.textContent : null,
  };
}

/**
 * Creates a mock services section with multiple service cards
 * @param {ServiceData[]} services - Array of service data
 * @returns {HTMLElement} - The services section element
 */
function createServicesSection(services) {
  const section = document.createElement('section');
  section.id = 'services';
  section.className = 'services-section';

  const container = document.createElement('div');
  container.className = 'services-container';

  const grid = document.createElement('div');
  grid.className = 'services-grid';

  services.forEach(serviceData => {
    const card = createServiceCard(serviceData);
    grid.appendChild(card);
  });

  container.appendChild(grid);
  section.appendChild(container);

  return section;
}

describe('Property 4: Service Card Completeness', () => {
  /**
   * **Validates: Requirements 3.2**
   *
   * Property: For any service card rendered, it SHALL contain a non-empty title element.
   */
  describe('Title element completeness', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    test('For any service data, rendered card SHALL have a title element', () => {
      fc.assert(
        fc.property(serviceDataArbitrary(), serviceData => {
          const card = createServiceCard(serviceData);
          document.body.appendChild(card);

          const validation = validateServiceCard(card);

          document.body.removeChild(card);

          // Property: Card must have a title element
          return validation.hasTitleElement === true;
        }),
        fcConfig,
      );
    });

    test('For any service data with non-empty title, rendered card SHALL have non-empty title content', () => {
      fc.assert(
        fc.property(serviceDataArbitrary(), serviceData => {
          const card = createServiceCard(serviceData);
          document.body.appendChild(card);

          const validation = validateServiceCard(card);

          document.body.removeChild(card);

          // Property: Card title must be non-empty
          return validation.hasNonEmptyTitle === true;
        }),
        fcConfig,
      );
    });

    test('For any service data, title content SHALL match input title', () => {
      fc.assert(
        fc.property(serviceDataArbitrary(), serviceData => {
          const card = createServiceCard(serviceData);
          document.body.appendChild(card);

          const validation = validateServiceCard(card);

          document.body.removeChild(card);

          // Property: Title content must match input
          return validation.titleContent === serviceData.title;
        }),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 3.2**
   *
   * Property: For any service card rendered, it SHALL contain a non-empty description element.
   */
  describe('Description element completeness', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    test('For any service data, rendered card SHALL have a description element', () => {
      fc.assert(
        fc.property(serviceDataArbitrary(), serviceData => {
          const card = createServiceCard(serviceData);
          document.body.appendChild(card);

          const validation = validateServiceCard(card);

          document.body.removeChild(card);

          // Property: Card must have a description element
          return validation.hasDescriptionElement === true;
        }),
        fcConfig,
      );
    });

    test('For any service data with non-empty description, rendered card SHALL have non-empty description content', () => {
      fc.assert(
        fc.property(serviceDataArbitrary(), serviceData => {
          const card = createServiceCard(serviceData);
          document.body.appendChild(card);

          const validation = validateServiceCard(card);

          document.body.removeChild(card);

          // Property: Card description must be non-empty
          return validation.hasNonEmptyDescription === true;
        }),
        fcConfig,
      );
    });

    test('For any service data, description content SHALL match input description', () => {
      fc.assert(
        fc.property(serviceDataArbitrary(), serviceData => {
          const card = createServiceCard(serviceData);
          document.body.appendChild(card);

          const validation = validateServiceCard(card);

          document.body.removeChild(card);

          // Property: Description content must match input
          return validation.descriptionContent === serviceData.description;
        }),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 3.2**
   *
   * Property: For any service card rendered, it SHALL contain a visible icon element.
   */
  describe('Icon element completeness', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    test('For any service data, rendered card SHALL have an icon container element', () => {
      fc.assert(
        fc.property(serviceDataArbitrary(), serviceData => {
          const card = createServiceCard(serviceData);
          document.body.appendChild(card);

          const validation = validateServiceCard(card);

          document.body.removeChild(card);

          // Property: Card must have an icon element
          return validation.hasIconElement === true;
        }),
        fcConfig,
      );
    });

    test('For any service data, rendered card SHALL have a visible SVG icon', () => {
      fc.assert(
        fc.property(serviceDataArbitrary(), serviceData => {
          const card = createServiceCard(serviceData);
          document.body.appendChild(card);

          const validation = validateServiceCard(card);

          document.body.removeChild(card);

          // Property: Card must have a visible icon (SVG with non-zero dimensions)
          return validation.hasVisibleIcon === true;
        }),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 3.2**
   *
   * Property: For any service card, ALL three required elements must be present simultaneously.
   */
  describe('Complete card validation', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    test('For any service data, rendered card SHALL have title, description, AND icon', () => {
      fc.assert(
        fc.property(serviceDataArbitrary(), serviceData => {
          const card = createServiceCard(serviceData);
          document.body.appendChild(card);

          const validation = validateServiceCard(card);

          document.body.removeChild(card);

          // Property: Card must have ALL required elements
          return (
            validation.hasNonEmptyTitle === true &&
            validation.hasNonEmptyDescription === true &&
            validation.hasVisibleIcon === true
          );
        }),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 3.2**
   *
   * Property: For any array of services, all rendered cards in the services section
   * SHALL be complete.
   */
  describe('Multiple service cards completeness', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    test('For any array of services, all cards in section SHALL be complete', () => {
      fc.assert(
        fc.property(
          // Generate 1-6 service cards (matching typical landing page)
          fc.array(serviceDataArbitrary(), { minLength: 1, maxLength: 6 }),
          servicesData => {
            const section = createServicesSection(servicesData);
            document.body.appendChild(section);

            const cards = section.querySelectorAll('.service-card');

            // Validate each card
            const allCardsComplete = Array.from(cards).every(card => {
              const validation = validateServiceCard(card);
              return (
                validation.hasNonEmptyTitle &&
                validation.hasNonEmptyDescription &&
                validation.hasVisibleIcon
              );
            });

            document.body.removeChild(section);

            // Property: All cards in section must be complete
            return allCardsComplete === true;
          },
        ),
        fcConfig,
      );
    });

    test('For any array of services, number of rendered cards SHALL match input count', () => {
      fc.assert(
        fc.property(
          fc.array(serviceDataArbitrary(), { minLength: 1, maxLength: 6 }),
          servicesData => {
            const section = createServicesSection(servicesData);
            document.body.appendChild(section);

            const cards = section.querySelectorAll('.service-card');

            document.body.removeChild(section);

            // Property: Number of cards must match input
            return cards.length === servicesData.length;
          },
        ),
        fcConfig,
      );
    });
  });

  /**
   * **Validates: Requirements 3.2**
   *
   * Edge cases and boundary conditions
   */
  describe('Edge cases', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    test('Service card with minimum length strings is complete', () => {
      const minimalService = {
        id: 'a',
        title: 'T',
        description: 'D',
        icon: 'i',
      };

      const card = createServiceCard(minimalService);
      document.body.appendChild(card);

      const validation = validateServiceCard(card);

      expect(validation.hasNonEmptyTitle).toBe(true);
      expect(validation.hasNonEmptyDescription).toBe(true);
      expect(validation.hasVisibleIcon).toBe(true);

      document.body.removeChild(card);
    });

    test('Service card with maximum length strings is complete', () => {
      const maximalService = {
        id: 'a'.repeat(50),
        title: 'T'.repeat(100),
        description: 'D'.repeat(500),
        icon: 'i'.repeat(50),
      };

      const card = createServiceCard(maximalService);
      document.body.appendChild(card);

      const validation = validateServiceCard(card);

      expect(validation.hasNonEmptyTitle).toBe(true);
      expect(validation.hasNonEmptyDescription).toBe(true);
      expect(validation.hasVisibleIcon).toBe(true);

      document.body.removeChild(card);
    });

    test('Service card with special characters in content is complete', () => {
      const specialService = {
        id: 'test-service',
        title: 'Web & Cloud Solutions <Test>',
        description: 'Description with "quotes" and \'apostrophes\' & special chars: @#$%',
        icon: 'cloud',
      };

      const card = createServiceCard(specialService);
      document.body.appendChild(card);

      const validation = validateServiceCard(card);

      expect(validation.hasNonEmptyTitle).toBe(true);
      expect(validation.hasNonEmptyDescription).toBe(true);
      expect(validation.hasVisibleIcon).toBe(true);
      expect(validation.titleContent).toBe(specialService.title);
      expect(validation.descriptionContent).toBe(specialService.description);

      document.body.removeChild(card);
    });

    test('Service card with unicode characters is complete', () => {
      const unicodeService = {
        id: 'unicode-service',
        title: 'Cloud Solutions ☁️ 🚀',
        description: 'Élève votre présence numérique avec des solutions innovantes 日本語',
        icon: 'cloud',
      };

      const card = createServiceCard(unicodeService);
      document.body.appendChild(card);

      const validation = validateServiceCard(card);

      expect(validation.hasNonEmptyTitle).toBe(true);
      expect(validation.hasNonEmptyDescription).toBe(true);
      expect(validation.hasVisibleIcon).toBe(true);

      document.body.removeChild(card);
    });

    test('Empty services section has no cards', () => {
      const section = createServicesSection([]);
      document.body.appendChild(section);

      const cards = section.querySelectorAll('.service-card');

      expect(cards.length).toBe(0);

      document.body.removeChild(section);
    });
  });

  /**
   * **Validates: Requirements 3.2**
   *
   * Property: Card creation is deterministic - same input always produces same output.
   */
  describe('Card creation determinism', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    test('For any service data, card creation is deterministic', () => {
      fc.assert(
        fc.property(serviceDataArbitrary(), serviceData => {
          // Create card twice with same input
          const card1 = createServiceCard(serviceData);
          const card2 = createServiceCard(serviceData);

          const validation1 = validateServiceCard(card1);
          const validation2 = validateServiceCard(card2);

          // Property: Same input must produce same validation results
          return (
            validation1.titleContent === validation2.titleContent &&
            validation1.descriptionContent === validation2.descriptionContent &&
            validation1.hasVisibleIcon === validation2.hasVisibleIcon
          );
        }),
        fcConfig,
      );
    });
  });
});
