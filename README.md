# Lusk Cloud Landing Page

[![CI](https://github.com/LUSKTECH/lusk.cloud/actions/workflows/ci.yml/badge.svg)](https://github.com/LUSKTECH/lusk.cloud/actions/workflows/ci.yml)
[![Security](https://github.com/LUSKTECH/lusk.cloud/actions/workflows/security.yml/badge.svg)](https://github.com/LUSKTECH/lusk.cloud/actions/workflows/security.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/454f4e3a-73ef-4373-9e6f-c66bd268e5bd/deploy-status)](https://app.netlify.com/projects/luskcloud/deploys)
[![codecov](https://codecov.io/gh/LUSKTECH/lusk.cloud/branch/main/graph/badge.svg)](https://codecov.io/gh/LUSKTECH/lusk.cloud)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=LUSKTECH_lusk.cloud&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=LUSKTECH_lusk.cloud)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=LUSKTECH_lusk.cloud&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=LUSKTECH_lusk.cloud)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=LUSKTECH_lusk.cloud&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=LUSKTECH_lusk.cloud)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=LUSKTECH_lusk.cloud&metric=bugs)](https://sonarcloud.io/summary/new_code?id=LUSKTECH_lusk.cloud)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=LUSKTECH_lusk.cloud&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=LUSKTECH_lusk.cloud)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=LUSKTECH_lusk.cloud&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=LUSKTECH_lusk.cloud)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=LUSKTECH_lusk.cloud&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=LUSKTECH_lusk.cloud)
![Uptime Robot status](https://img.shields.io/uptimerobot/status/m802465771-d937468e1c283e30712a0982)

A modern, sky/cloud-themed landing page for Lusk.cloud - a web management consultancy.

## Features

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=white)
![oxlint](https://img.shields.io/badge/oxlint-7C5CFC?logo=oxc&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?logo=prettier&logoColor=black)
![Stylelint](https://img.shields.io/badge/Stylelint-263238?logo=stylelint&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?logo=netlify&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=githubactions&logoColor=white)

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
2. Set the publish directory to `.` (root)
3. Deploy

The contact form uses Netlify Forms for email notifications. After deployment, configure email
notifications in the Netlify dashboard under Forms → contact → Settings.

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
- [oxlint](https://oxc.rs/docs/guide/usage/linter) - JavaScript linting
- [Stylelint](https://stylelint.io/) - CSS linting
- [Prettier](https://prettier.io/) - Code formatting
- [GitHub Actions](https://github.com/features/actions) - CI/CD workflows
- [Netlify](https://netlify.com) - Hosting and form handling

## AI Usage Disclaimer

Portions of this codebase were generated with the assistance of Large Language Models (LLMs). All
AI-generated code has been reviewed and tested to ensure quality and correctness.
