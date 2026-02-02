# Lusk Cloud Landing Page

[![CI](https://github.com/LUSKTECH/lusk.cloud/actions/workflows/ci.yml/badge.svg)](https://github.com/LUSKTECH/lusk.cloud/actions/workflows/ci.yml)
[![Security](https://github.com/LUSKTECH/lusk.cloud/actions/workflows/security.yml/badge.svg)](https://github.com/LUSKTECH/lusk.cloud/actions/workflows/security.yml)
[![codecov](https://codecov.io/gh/LUSKTECH/lusk.cloud/branch/main/graph/badge.svg)](https://codecov.io/gh/LUSKTECH/lusk.cloud)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A modern, sky/cloud-themed landing page for Lusk.cloud - a web management consultancy.

## Features

- 🌤️ Beautiful cloud-themed design with smooth animations
- 📱 Fully responsive across all devices
- ♿ WCAG 2.1 AA accessibility compliant
- ⚡ Optimized performance with lazy loading
- 🔒 Security-first approach

## Getting Started

### Prerequisites

- Node.js 18+ (for development tools)
- A modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/LUSKTECH/lusk.cloud.git
cd lusk.cloud

# Install dependencies
cd lusk-cloud-landing-page
npm install
```

### Development

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

### Project Structure

```text
lusk-cloud-landing-page/
├── assets/
│   ├── images/          # SVG icons and graphics
│   └── videos/          # Video assets
├── css/
│   ├── components/      # Component-specific styles
│   ├── utilities/       # Variables, animations, responsive
│   └── styles.css       # Main stylesheet
├── js/
│   ├── animations.js    # Animation handlers
│   ├── form-validator.js # Form validation
│   ├── main.js          # Main entry point
│   ├── navigation.js    # Navigation logic
│   └── smooth-scroll.js # Smooth scrolling
├── tests/               # Jest test files
├── netlify.toml         # Netlify configuration
└── index.html           # Main HTML file
```

## Deployment

This site is configured for [Netlify](https://netlify.com) deployment:

1. Connect your GitHub repository to Netlify
2. Set the publish directory to `lusk-cloud-landing-page`
3. Deploy

The contact form uses Netlify Forms for email notifications. After deployment, configure email notifications in the Netlify dashboard under Forms → contact → Settings.

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## Security

For security concerns, please see our [Security Policy](SECURITY.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with these technologies:

- [HTML5](https://developer.mozilla.org/en-US/docs/Web/HTML) - Semantic markup
- [CSS3](https://developer.mozilla.org/en-US/docs/Web/CSS) - Styling and animations
- [JavaScript (ES6+)](https://developer.mozilla.org/en-US/docs/Web/JavaScript) - Interactivity
- [Jest](https://jestjs.io/) - Testing framework
- [fast-check](https://fast-check.dev/) - Property-based testing
- [ESLint](https://eslint.org/) - JavaScript linting
- [Stylelint](https://stylelint.io/) - CSS linting
- [Prettier](https://prettier.io/) - Code formatting
- [GitHub Actions](https://github.com/features/actions) - CI/CD workflows
- [Netlify](https://netlify.com) - Hosting and form handling
