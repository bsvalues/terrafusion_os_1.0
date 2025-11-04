# Ultimate AI-Powered RAG Drive FTP Hub

A comprehensive data management platform that combines intelligent data processing, multi-source connectivity, and an intuitive pipeline builder with robust AI capabilities.

## Features

- **Multi-source Data Connector**: Connect to SQL databases, APIs, cloud storage, and FTP servers
- **AI-Powered File Processing**: Leverage OpenAI for document analysis and RAG implementation
- **Intelligent Pipeline Builder**: Create and visualize data transformation pipelines
- **Comprehensive Dashboard**: Monitor usage metrics and system performance
- **Secure File Management**: Upload, organize, and process files with built-in security
- **User Authentication**: Secure account management with session persistence

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, Shadcn/UI, ReactFlow
- **Backend**: Node.js, Express, PostgreSQL, Drizzle ORM
- **AI Integration**: OpenAI, Retrieval-Augmented Generation (RAG)
- **Testing**: Vitest, React Testing Library, Coverage reporting
- **Logging**: Winston, optional Slack notifications

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL database
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the project root
   - Add the following variables:
     ```
     DATABASE_URL=postgres://username:password@localhost:5432/database
     OPENAI_API_KEY=your_openai_api_key
     ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:5000

### Testing

Run the test suite:
```bash
npm test
```

Generate coverage report:
```bash
npm run test:coverage
```

### Building for Production

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm run start
```

## Documentation

For detailed documentation, please refer to:

- [Deployment Guide](./deployment_guide.md)
- [Deployment Checklist](./deployment_checklist.md)
- [Verification Plan](./verification_plan.md)

## Architecture

The application follows a modern full-stack architecture:

- **Client**: React-based SPA with state management and API integration
- **Server**: Express.js REST API with authentication and file processing
- **Database**: PostgreSQL with Drizzle ORM for data modeling and migrations
- **Storage**: File system storage for uploaded files with metadata in the database
- **AI Services**: OpenAI integration for document analysis and RAG implementation

## Security

- Password hashing for user authentication
- Input validation with Zod schemas
- File type and size validation
- Authenticated API routes
- Parameterized SQL queries

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Shadcn/UI](https://ui.shadcn.com/) for the component library
- [ReactFlow](https://reactflow.dev/) for the pipeline visualization
- [OpenAI](https://openai.com/) for the AI capabilities
- [Drizzle ORM](https://orm.drizzle.team/) for the database ORM