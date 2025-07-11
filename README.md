# BlogSync - Multi-Platform Blog Publishing System

BlogSync is a modern content management system that allows you to write once and publish across multiple blog platforms with AI-powered optimization.

## Features

- 📝 Rich text editor with media support
- 🤖 AI-powered content optimization using Google Gemini
- 🌐 Multi-platform publishing (WordPress, Medium, and more)
- 📊 Analytics dashboard with cross-platform metrics
- 🔄 Real-time publishing status updates
- 🔐 Secure authentication with JWT tokens
- 📱 Responsive design for all devices

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Vercel KV (Redis)
- **Styling**: Tailwind CSS
- **Authentication**: JWT with refresh tokens
- **AI**: Google Gemini API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Vercel account
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/blogsync.git
cd blogsync
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
# Database
POSTGRES_PRISMA_URL="your-postgres-url"
POSTGRES_URL_NON_POOLING="your-postgres-url-non-pooling"

# Authentication
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# APIs
GEMINI_API_KEY="your-gemini-api-key"

# Encryption
ENCRYPTION_KEY="your-32-char-encryption-key"
```

5. Run database migrations:
```bash
npx prisma migrate dev
```

6. Start the development server:
```bash
npm run dev
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

The app will automatically:
- Set up Vercel Postgres
- Configure Vercel KV for caching
- Set up cron jobs for analytics

## Project Structure

```
src/
├── app/              # Next.js app router pages and API routes
├── components/       # Reusable React components
├── lib/             # Utility functions and configurations
├── types/           # TypeScript type definitions
└── prisma/          # Database schema and migrations
```

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/content` - List content
- `POST /api/content` - Create content
- `PUT /api/content/[id]` - Update content
- `POST /api/publish` - Publish to platforms
- `GET /api/analytics` - Get analytics data

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.