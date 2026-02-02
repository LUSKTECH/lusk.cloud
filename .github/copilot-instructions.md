# Copilot Instructions for lusk.cloud

## Tech Stack & Architecture

- **Frontend:** Static HTML, CSS, and JavaScript.
- **Testing:** Jest (with jsdom environment), fast-check for property-based testing.
- **Node.js** is required for running tests.

## Key Files & Directories

- `index.html` — Main landing page.
- `css/` — Stylesheets for the site.
- `js/` — JavaScript files for interactivity.
- `assets/` — Images and other static assets.
- `tests/` — Jest test files.
- `jest.config.js` — Jest configuration.
- `package.json` — Project metadata, dependencies, and scripts.
- `node_modules/` — Installed dependencies (auto-generated).

## Build & Test Commands

- **Install dependencies:**  
  `npm install`
- **Run all tests:**  
  `npm test`
- **Watch tests:**  
  `npm run test:watch`
- **Test coverage:**  
  `npm run test:coverage`

## Conventions

- Place all tests in the `tests/` directory.
- Use Jest for all unit and integration tests.
- Keep static assets in the `assets/` directory.
- Use semantic versioning for releases.

## Notes

- No backend or build step; site is served as static files.
- No TypeScript or Python; this is a pure JS/HTML/CSS project.
- Contributions should follow the structure and conventions above.
