# ResumeBoost

AI-powered resume analysis and optimization platform that helps job seekers improve their resumes and land better interviews.

## 🚀 Features

- **Resume Analysis**: Upload your resume and job description for AI-powered analysis
- **Personalized Recommendations**: Get specific, actionable advice to improve your resume
- **Portfolio Showcase**: Browse successful resume examples and case studies
- **Expert Consultation**: Book 1-on-1 sessions with career experts
- **Admin Dashboard**: Manage content and track analytics

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Architecture**: Atomic Design pattern
- **Testing**: Jest + React Testing Library
- **CI/CD**: GitHub Actions
- **Deployment**: AWS (planned)

## 📱 Mobile-First Design

Optimized for mobile devices with responsive breakpoints and touch-friendly interactions.

## 🏗️ Project Structure

```
src/
├── components/
│   ├── atoms/          # Smallest UI elements
│   ├── molecules/       # Groups of atoms
│   ├── organisms/       # Complex components
│   ├── templates/       # Page layouts
│   └── pages/          # Page components
├── app/                # Next.js app router
├── lib/               # Utilities and helpers
└── types/             # TypeScript definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd resumeboost

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

### Environment Variables

Create a `.env.local` file for local development:

```env
# AI Service
NEXT_PUBLIC_CLAUDE_API_KEY=your_claude_api_key

# AWS Services (for file storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=resumeboost-uploads

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL=your_database_url
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test --watch

# Run tests with coverage
npm test --coverage
```

## 📚 Documentation

- [Architecture Documentation](./docs/architecture.md)
- [API Documentation](./docs/api.md)
- [Component Library](./docs/components.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Live Demo](https://resumeboost.vercel.app)
- [Project Board](https://github.com/username/resumeboost/projects)
- [Issues](https://github.com/username/resumeboost/issues)

---

Built with ❤️ using Next.js and Tailwind CSS
