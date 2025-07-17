# 🤝 Contributing to Nija Diia Dashboard

Thank you for your interest in contributing to the **Nija Diia Dashboard** - the world's most advanced AI-powered cryptocurrency trading system with Super Intelligent MCP Orchestration! 🚀

## 🌟 How to Contribute

### 🐛 Reporting Bugs

1. **Check existing issues** first to avoid duplicates
2. **Use the bug report template** when creating new issues
3. **Include detailed information**:
   - Operating system and version
   - Node.js and Rust versions
   - Steps to reproduce the issue
   - Expected vs actual behavior
   - Screenshots if applicable
   - Relevant log files

### 💡 Suggesting Features

1. **Check the roadmap** in README.md first
2. **Create a feature request** with detailed description
3. **Explain the use case** and potential benefits
4. **Consider implementation complexity**

### 🔧 Code Contributions

#### Prerequisites
- 🟢 Node.js 18.x or higher
- 🦀 Rust 1.70+ with Cargo
- 🎯 PM2 process manager
- 🔧 Git version control

#### Development Setup

1. **Fork the repository**
```bash
git clone https://github.com/YOUR_USERNAME/Diia.git
cd Diia
```

2. **Install dependencies**
```bash
# Backend dependencies
cd ui/dashboard-backend
npm install

# Frontend dependencies
cd ../dashboard
npm install

# Rust dependencies
cd ../../
cargo build
```

3. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

#### Code Standards

##### 🟢 JavaScript/Node.js
- Use **ES6+ syntax** and modern JavaScript features
- Follow **ESLint** configuration
- Use **async/await** for asynchronous operations
- Add **JSDoc comments** for functions
- Maintain **consistent indentation** (2 spaces)

##### ⚛️ React/Frontend
- Use **functional components** with hooks
- Follow **Material-UI** design patterns
- Implement **responsive design** principles
- Use **Framer Motion** for animations
- Maintain **accessibility** standards

##### 🦀 Rust
- Follow **Rust naming conventions**
- Use **cargo fmt** for formatting
- Run **cargo clippy** for linting
- Add **comprehensive documentation**
- Write **unit tests** for new functions

##### 🧠 MCP Integration
- Follow **Model Context Protocol** standards
- Implement **proper error handling**
- Use **caching** for performance optimization
- Add **rate limiting** for API calls

#### Testing Requirements

1. **Unit Tests**: Write tests for new functions
2. **Integration Tests**: Test API endpoints
3. **Performance Tests**: Ensure sub-700ms response times
4. **Security Tests**: Validate input sanitization

#### Commit Guidelines

Use **conventional commits** format:
```
type(scope): description

feat(mcp): add new sentiment analysis endpoint
fix(trading): resolve order execution bug
docs(readme): update installation instructions
style(ui): improve dashboard responsiveness
```

#### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass**
4. **Update CHANGELOG.md**
5. **Request review** from maintainers

### 🎨 UI/UX Contributions

- Follow **futuristic design** principles
- Use **quantum particle effects** appropriately
- Maintain **color coding** consistency:
  - 🟢 Green: Positive/Bullish
  - 🔴 Red: Negative/Bearish
  - 🟡 Yellow: Neutral/Warning
- Ensure **mobile responsiveness**

### 📚 Documentation Contributions

- Update **README.md** for new features
- Add **API documentation** for new endpoints
- Create **tutorials** for complex features
- Improve **code comments** and explanations

## 🚫 What NOT to Contribute

- ❌ Real API keys or sensitive credentials
- ❌ Production trading strategies
- ❌ Copyrighted material
- ❌ Malicious or harmful code
- ❌ Breaking changes without discussion

## 🏆 Recognition

Contributors will be:
- 📝 Listed in CONTRIBUTORS.md
- 🌟 Mentioned in release notes
- 🎖️ Given appropriate GitHub badges
- 🤝 Invited to join the core team (for significant contributions)

## 📞 Getting Help

- 💬 **Discord**: Join our community server
- 📧 **Email**: sandeep.savethem2@gmail.com
- 🐙 **GitHub Issues**: For technical questions
- 📚 **Documentation**: Check existing docs first

## 📋 Code of Conduct

- 🤝 Be respectful and inclusive
- 💡 Focus on constructive feedback
- 🎯 Stay on topic in discussions
- 🚫 No spam or self-promotion
- 🔒 Respect privacy and security

---

**Thank you for helping make Nija Diia Dashboard even more amazing! 🚀**

*Together, we're building the future of AI-powered trading technology.*
