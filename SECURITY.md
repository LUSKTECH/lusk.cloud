# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

1. **Do not** open a public issue
2. Email security concerns to [security@lusk.cloud](mailto:security@lusk.cloud)
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours of your report
- **Initial Assessment**: Within 5 business days
- **Resolution Timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: 90 days

### Disclosure Policy

- We follow responsible disclosure practices
- We will credit reporters (unless anonymity is requested)
- We will notify you when the vulnerability is fixed

## Security Best Practices

This project follows these security practices:

- Regular dependency updates via Dependabot
- Automated security scanning with CodeQL
- Input validation and sanitization
- Content Security Policy headers (when deployed)
- No sensitive data in client-side code

## Security Features

- Form validation with XSS prevention
- Safe DOM manipulation practices
- No eval() or innerHTML with user input
- Subresource Integrity (SRI) for external resources
