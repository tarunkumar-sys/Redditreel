# Contributing to Reddit Reel AI

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## 🎯 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## 🚀 Getting Started

### 1. Fork & Clone

```bash
git clone https://github.com/yourusername/reddit-reel-ai.git
cd reddit-reel-ai
npm install
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Use descriptive branch names:
- `feature/add-video-filters`
- `fix/audio-playback-issue`
- `docs/update-readme`

### 3. Make Your Changes

- Follow the existing code style
- Write clear, descriptive commit messages
- Keep commits atomic and focused
- Add comments for complex logic

### 4. Test Your Changes

```bash
npm run dev
# Test locally at http://localhost:3000
```

### 5. Commit & Push

```bash
git add .
git commit -m "feat: add video filters to reel feed"
git push origin feature/your-feature-name
```

### 6. Open a Pull Request

- Provide a clear description of changes
- Reference any related issues
- Include screenshots for UI changes
- Ensure all tests pass

## 📋 Commit Message Format

Follow conventional commits:

```
type(scope): subject

body

footer
```

**Types:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `style` — Code style (no logic change)
- `refactor` — Code refactoring
- `perf` — Performance improvement
- `test` — Tests

**Examples:**
```
feat(reels): add video quality selector
fix(auth): resolve login redirect issue
docs(readme): update installation steps
```

## 🏗 Project Structure

```
src/
├── app/              # Next.js app directory
├── components/       # React components
├── lib/              # Utilities
├── prisma/           # Database schema
└── public/           # Static assets
```

## 🎨 Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use meaningful variable names
- Keep functions small and focused
- Add JSDoc comments for public functions

### Example:

```typescript
/**
 * Fetches Reddit posts for a given query
 * @param query - Search query string
 * @param nsfw - Include NSFW content
 * @returns Array of ReelPost objects
 */
export async function fetchRedditPosts(
  query: string,
  nsfw: boolean
): Promise<ReelPost[]> {
  // Implementation
}
```

## 🧪 Testing

- Test locally before submitting PR
- Verify all features work as expected
- Test on different screen sizes
- Check console for errors

## 📝 Documentation

- Update README.md for new features
- Add comments to complex code
- Document API changes
- Include examples where helpful

## 🐛 Reporting Bugs

When reporting bugs, include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/videos if applicable
- Browser/OS information

## 💡 Feature Requests

When suggesting features:
- Explain the use case
- Describe the desired behavior
- Provide examples or mockups
- Consider performance impact

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Auth.js Documentation](https://authjs.dev)

## ✅ Before Submitting

- [ ] Code follows project style
- [ ] All tests pass
- [ ] No console errors/warnings
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] Branch is up to date with main

## 🎉 Thank You!

Your contributions make Reddit Reel AI better for everyone. We appreciate your time and effort!

---

**Questions?** Open an issue or reach out to the maintainers.
