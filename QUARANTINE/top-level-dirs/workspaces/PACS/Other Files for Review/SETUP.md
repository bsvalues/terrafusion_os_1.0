.35# Setup Guide for Property Analysis & Valuation System

## Prerequisites Installation

### 1. Install Node.js and npm

1. Download Node.js from [https://nodejs.org/](https://nodejs.org/)
   - Choose the LTS (Long Term Support) version
   - This will install both Node.js and npm (Node Package Manager)

2. Verify the installation:
   ```bash
   node --version
   npm --version
   ```

### 2. Install Git (if not already installed)

1. Download Git from [https://git-scm.com/downloads](https://git-scm.com/downloads)
2. Follow the installation wizard
3. Verify the installation:
   ```bash
   git --version
   ```

## Project Setup

1. Create a new directory for your project:
   ```bash
   mkdir property-analysis-system
   cd property-analysis-system
   ```

2. Initialize a new Git repository:
   ```bash
   git init
   ```

3. Copy all project files into this directory:
   - components/
   - styles/
   - package.json
   - tsconfig.json
   - README.md

4. Install project dependencies:
   ```bash
   npm install
   ```

## Development Environment Setup

### Visual Studio Code (Recommended)

1. Download VS Code from [https://code.visualstudio.com/](https://code.visualstudio.com/)

2. Install recommended extensions:
   - ESLint
   - Prettier
   - TypeScript and JavaScript Language Features
   - styled-components-snippets

### Environment Configuration

1. Create a `.env.local` file in the project root:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

2. Configure ESLint and Prettier:
   ```bash
   npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-prettier
   ```

## Running the Project

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Troubleshooting Common Issues

### npm not recognized
If you see "npm is not recognized as an internal or external command":
1. Ensure Node.js is properly installed
2. Add Node.js to your system's PATH environment variable
3. Restart your terminal/command prompt

### TypeScript Errors
If you encounter TypeScript errors:
1. Ensure all dependencies are installed:
   ```bash
   npm install
   ```
2. Clear TypeScript cache:
   ```bash
   npm run clean
   ```
3. Rebuild the project:
   ```bash
   npm run build
   ```

### Styled Components Issues
If styled-components aren't working properly:
1. Install the babel plugin:
   ```bash
   npm install --save-dev babel-plugin-styled-components
   ```
2. Add to .babelrc:
   ```json
   {
     "plugins": ["babel-plugin-styled-components"]
   }
   ```

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Styled Components Documentation](https://styled-components.com/docs)

## Support

If you encounter any issues not covered in this guide:
1. Check the project's GitHub Issues
2. Consult the documentation
3. Reach out to the development team

Remember to keep all dependencies updated:
```bash
npm update
```

This setup guide should help you get started with the Property Analysis & Valuation System. For more detailed information about the system's features and usage, refer to the README.md file.
