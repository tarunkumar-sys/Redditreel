# 🔒 Security Policy

## Overview

Reddit Reel AI implements comprehensive security measures to protect user data and prevent unauthorized access. This document outlines all security features, best practices, and quick reference guides.

---

## 🛡️ Security Features

### Authentication & Authorization
- ✅ **Auth.js v5** — Industry-standard authentication
- ✅ **JWT Tokens** — Stateless, secure session management
- ✅ **Secure Cookies** — HttpOnly, Secure, SameSite flags
- ✅ **bcryptjs** — Password hashing with 10+ salt rounds
- ✅ **RBAC** — Role-based access control (Admin/User)
- ✅ **CSRF Protection** — Built-in CSRF token validation

### API Security
- ✅ **Authentication Required** — All endpoints require valid session
- ✅ **Protected Endpoints** — `/api/reddit`, `/api/interpret`
- ✅ **Rate Limiting** — Prevents brute force attacks
- ✅ **Input Validation** — All inputs validated and sanitized

### Data Protection
- ✅ **No Console Logging** — Sensitive data never logged
- ✅ **Parameterized Queries** — SQL injection prevention
- ✅ **Row-Level Security** — Users access only their data
- ✅ **Encryption** — Passwords hashed, tokens in secure cookies

### Browser Security (Production)
- ✅ **Console Disabled** — `console.log()` and all methods disabled
- ✅ **Debugger Blocked** — Debugger access prevented
- ✅ **DevTools Blocked** — F12, Ctrl+Shift+I, etc. blocked
- ✅ **Right-Click Disabled** — Context menu disabled
- ✅ **Storage Protected** — Sensitive keys blocked from localStorage

### HTTP Security Headers
- ✅ `X-Frame-Options: DENY` — Prevents clickjacking
- ✅ `X-Content-Type-Options: nosniff` — Prevents MIME sniffing
- ✅ `X-XSS-Protection: 1; mode=block` — XSS protection
- ✅ `Referrer-Policy: strict-origin-when-cross-origin` — Referrer control
- ✅ `Content-Security-Policy` — Prevents inline scripts
- ✅ `Permissions-Policy` — Restricts browser features

---

## 🔐 Quick Reference

### What's Protected

#### ✅ API Endpoints
- `GET /api/reddit` — Requires authentication
- `POST /api/interpret` — Requires authentication
- All database operations — Require authentication

#### ✅ Routes
- `/dashboard` — User dashboard (requires login)
- `/admin` — Admin panel (requires admin role)

#### ✅ Data Access
- Users can only access their own data
- Admins can access all data
- Row-level security enforced

### What's Blocked

#### ❌ Unauthorized Users Cannot
- Access `/api/reddit` without auth
- Access `/api/interpret` without auth
- View other users' data
- Access admin dashboard
- Modify other users' data
- View console in production
- Use DevTools in production

#### ❌ Attacks Prevented
- XSS (Cross-Site Scripting)
- CSRF (Cross-Site Request Forgery)
- SQL Injection
- Clickjacking
- MIME sniffing
- Unauthorized API access
- Data leakage via console

---

## 🔧 Security Implementation

### Authentication
```typescript
// All API endpoints require auth
const authError = await requireAuth(request);
if (authError) return authError;
```

### Authorization
```typescript
// Check user session
const session = await auth();
if (!session?.user?.id) return error('Unauthorized');
```

### Admin Role Check
```typescript
// Admin-only operations
const session = await checkAdmin();
if (session?.user?.role !== 'ADMIN') throw new Error('Forbidden');
```

### Input Validation
```typescript
// Validate and sanitize input
const query = (input as string)?.trim().slice(0, 500);
if (!query) return error('Query required');
```

---

## 📋 Security Headers Reference

| Header | Value | Purpose |
|--------|-------|---------|
| X-Frame-Options | DENY | Prevents clickjacking |
| X-Content-Type-Options | nosniff | Prevents MIME sniffing |
| X-XSS-Protection | 1; mode=block | Enables XSS protection |
| Referrer-Policy | strict-origin-when-cross-origin | Controls referrer |
| Content-Security-Policy | [strict] | Prevents inline scripts |
| Permissions-Policy | [restrictive] | Disables browser features |

---

## 🧪 Testing Security

### Test Unauthorized Access
```bash
# Try to access API without auth
curl http://localhost:3000/api/reddit

# Expected: 401 Unauthorized
```

### Test Console in Production
```bash
# Build for production
npm run build && npm start

# Open browser console (F12)
# Expected: Console methods don't work
```

### Test Protected Routes
```bash
# Try to access dashboard without login
# Expected: Redirected to home with auth modal
```

---

## 🛠️ Developer Guidelines

### ✅ DO

```typescript
// ✅ Validate input
const query = (input as string)?.trim().slice(0, 500);

// ✅ Check authentication
const session = await auth();
if (!session?.user?.id) return error('Unauthorized');

// ✅ Use parameterized queries
const user = await prisma.user.findUnique({ where: { id } });

// ✅ Sanitize sensitive data
const safe = sanitizeForLogging(data);

// ✅ Use environment variables
const apiKey = process.env.REDDIT_CLIENT_ID;
```

### ❌ DON'T

```typescript
// ❌ Don't log sensitive data
console.log('Token:', token);

// ❌ Don't skip auth checks
const data = await fetchData();

// ❌ Don't use string concatenation for queries
const user = await db.query(`SELECT * FROM users WHERE id = ${id}`);

// ❌ Don't store tokens in localStorage
localStorage.setItem('token', token);

// ❌ Don't hardcode secrets
const apiKey = 'sk-1234567890';
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All dependencies updated
- [ ] Security headers configured
- [ ] HTTPS enabled
- [ ] Environment variables set
- [ ] Database backups configured
- [ ] Error tracking enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] Input validation tested
- [ ] Console disabled verified
- [ ] DevTools blocked verified
- [ ] Storage protected verified

### Environment Variables Required

```env
# Authentication
AUTH_SECRET=your-generated-secret

# Database
DATABASE_URL=file:./prisma/dev.db

# Optional - AI
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Optional - Reddit API
REDDIT_CLIENT_ID=your-id
REDDIT_CLIENT_SECRET=your-secret
```

---

## 📞 Reporting Security Issues

### How to Report
1. **Email:** security@example.com
2. **Include:**
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional)

### Response Time
- Initial response: 24-48 hours
- Fix timeline: Depends on severity
- Disclosure: Coordinated after fix

### Do NOT
- ❌ Publicly disclose
- ❌ Exploit the vulnerability
- ❌ Access other users' data
- ❌ Modify data

---

## ✅ Security Checklist

### For Users
- [ ] Use strong password (12+ characters)
- [ ] Don't share login credentials
- [ ] Log out on shared devices
- [ ] Report suspicious activity

### For Developers
- [ ] Validate all input
- [ ] Check authentication
- [ ] Check authorization
- [ ] Don't log sensitive data
- [ ] Use parameterized queries
- [ ] Sanitize user input
- [ ] Use environment variables
- [ ] Follow security guidelines

### For Admins
- [ ] Keep dependencies updated
- [ ] Monitor error logs
- [ ] Review audit logs
- [ ] Test security measures
- [ ] Backup data regularly
- [ ] Update security policies

---

## 📚 Related Documentation

- [README.md](./README.md) — Project overview
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Developer guidelines
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Deployment guide
- [lib/security.ts](./lib/security.ts) — Security utilities

---

**Last Updated:** March 27, 2026  
**Status:** ✅ Production-Ready
- ✅ **Length Limits** — Queries limited to 500 chars
- ✅ **Range Validation** — Numeric inputs bounded
- ✅ **Enum Validation** — Only allowed values accepted

#### User Input
- ✅ **HTML Sanitization** — XSS prevention
- ✅ **SQL Injection Prevention** — Parameterized queries
- ✅ **Command Injection Prevention** — No shell execution

### 7. CORS & Origin Validation

#### Cross-Origin Requests
- ✅ **Origin Validation** — Requests validated
- ✅ **CORS Headers** — Properly configured
- ✅ **Credentials** — Only sent to same origin

### 8. Audit Logging

#### Activity Tracking
- ✅ **User Actions Logged** — All important actions tracked
- ✅ **Search Queries Logged** — For analytics
- ✅ **Admin Actions Logged** — For compliance
- ✅ **Timestamps** — All logs timestamped

---

## 🔐 Security Best Practices

### For Developers

#### 1. Never Log Sensitive Data
```typescript
// ❌ BAD
console.log('User token:', token);

// ✅ GOOD
console.log('User authenticated');
```

#### 2. Always Validate Input
```typescript
// ❌ BAD
const query = request.query.q;

// ✅ GOOD
const query = (request.query.q as string)?.trim().slice(0, 500);
if (!query) return error('Query required');
```

#### 3. Use Parameterized Queries
```typescript
// ❌ BAD
const user = await db.query(`SELECT * FROM users WHERE id = ${id}`);

// ✅ GOOD
const user = await prisma.user.findUnique({ where: { id } });
```

#### 4. Check Authorization
```typescript
// ❌ BAD
const user = await prisma.user.findUnique({ where: { id } });

// ✅ GOOD
const session = await auth();
if (!session?.user?.id) return error('Unauthorized');
const user = await prisma.user.findUnique({ where: { id: session.user.id } });
```

#### 5. Use Environment Variables
```typescript
// ❌ BAD
const apiKey = 'sk-1234567890';

// ✅ GOOD
const apiKey = process.env.REDDIT_CLIENT_ID;
if (!apiKey) throw new Error('Missing API key');
```

### For Users

#### 1. Strong Passwords
- Use 12+ characters
- Mix uppercase, lowercase, numbers, symbols
- Avoid personal information
- Use unique passwords per site

#### 2. Secure Your Account
- Enable 2FA if available
- Keep password private
- Don't share login credentials
- Log out on shared devices

#### 3. Report Security Issues
- Don't publicly disclose vulnerabilities
- Email security@example.com
- Include detailed reproduction steps
- Allow time for fixes before disclosure

---

## 🚨 Incident Response

### Reporting Security Issues

**Email:** security@example.com  
**Response Time:** 24-48 hours  
**Disclosure:** Coordinated disclosure after fix

### What to Include
1. Description of vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (optional)
5. Your contact information

### What NOT to Do
- ❌ Don't publicly disclose
- ❌ Don't exploit the vulnerability
- ❌ Don't access other users' data
- ❌ Don't modify data

---

## 🔄 Security Updates

### Dependency Management
- ✅ Regular updates checked
- ✅ Security patches applied immediately
- ✅ Automated vulnerability scanning
- ✅ Changelog maintained

### Monitoring
- ✅ Error tracking (Sentry)
- ✅ Performance monitoring
- ✅ Security scanning
- ✅ Log analysis

---

## 📋 Compliance

### Standards
- ✅ OWASP Top 10 — Addressed
- ✅ GDPR Ready — User data protection
- ✅ CCPA Ready — Privacy controls
- ✅ SOC 2 — Security practices

### Data Protection
- ✅ Encryption in transit (HTTPS)
- ✅ Encryption at rest (database)
- ✅ Access controls (RBAC)
- ✅ Audit logs (activity tracking)

---

## 🧪 Security Testing

### Regular Testing
- ✅ Penetration testing
- ✅ Vulnerability scanning
- ✅ Code review
- ✅ Dependency audits

### Tools Used
- `npm audit` — Dependency vulnerabilities
- `eslint-plugin-security` — Code security
- OWASP ZAP — Web application scanning
- Snyk — Continuous vulnerability monitoring

---

## 📚 Resources

### Security Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Auth.js Security](https://authjs.dev/concepts/security)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/security)

### Tools & Services
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/)
- [OWASP ZAP](https://www.zaproxy.org/)
- [Sentry](https://sentry.io/)

---

## ✅ Security Checklist

Before deploying to production:

- [ ] All dependencies updated
- [ ] Security headers configured
- [ ] HTTPS enabled
- [ ] Environment variables set
- [ ] Database backups configured
- [ ] Error tracking enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] Input validation tested
- [ ] SQL injection tested
- [ ] XSS prevention tested
- [ ] CSRF protection tested
- [ ] Audit logs working
- [ ] Monitoring enabled

---

## 📞 Support

For security questions or concerns:
- **Email:** security@example.com
- **GitHub Issues:** [Security tag](https://github.com/yourusername/reddit-reel-ai/issues?q=label%3Asecurity)
- **Documentation:** [Security.md](./SECURITY.md)

---

**Last Updated:** March 27, 2026  
**Status:** ✅ Active
