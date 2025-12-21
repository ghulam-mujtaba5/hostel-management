# HostelMate - Hostel Management System

A modern, mobile-first, multi-tenant duties management system for hostels, flats, and shared living spaces. Built with fairness and gamification at its core.

## ✨ Features

### Core Features
- **Task Management:** Create, assign, and track household tasks with categories and difficulty levels
- **Fairness Algorithm:** AI-powered task distribution ensuring everyone contributes fairly
- **Proof System:** Upload photos to verify task completion
- **Gamification:** Earn points, level up, and compete on the leaderboard
- **Space Management:** Create and manage multiple hostel/flat spaces
- **Invite System:** Share unique codes to invite flatmates

### User Experience
- **Mobile-First Design:** Optimized for phones and tablets
- **Dark/Light Theme:** System-aware theme with manual toggle
- **Accessibility:** WCAG 2.1 compliant with keyboard navigation and screen reader support
- **Progressive Web App:** Installable and works offline
- **Real-time Updates:** Live updates for tasks and leaderboard

### Admin Features
- **Admin Portal:** Manage feedback, users, and spaces
- **Feedback System:** Collect and respond to user feedback
- **Analytics:** Track space activity and user engagement

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone and Install:**
   ```bash
   cd hostel-management
   npm install
   ```

2. **Setup Supabase:**
   - Create a new project on [Supabase](https://supabase.com)
   - Go to SQL Editor and run `supabase/schema.sql`
   - Copy your credentials from Project Settings > API

3. **Configure Environment:**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ADMIN_PORTAL_PASSWORD=your-secure-admin-password
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

5. **Open the App:**
   Visit [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | Radix UI + shadcn/ui |
| Animations | Framer Motion |
| Backend | Supabase (Auth, Database, Storage) |
| State | React Context |
| Forms | React Hook Form + Zod |

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── (main)/            # Main app routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components
├── contexts/             # React contexts
├── lib/                  # Utility functions
│   ├── supabase.ts      # Supabase client
│   ├── hooks.ts         # Custom React hooks
│   ├── validation.ts    # Form validation
│   ├── accessibility.ts # A11y utilities
│   ├── performance.tsx  # Performance utilities
│   └── seo.ts           # SEO configuration
└── types/               # TypeScript types
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run e2e tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Configure environment variables
3. Deploy

### Manual Build
```bash
npm run build
npm start
```

## 🔒 Security

- HTTPS enforced in production
- Secure HTTP headers (CSP, HSTS, etc.)
- Row Level Security (RLS) in Supabase
- HMAC-signed admin sessions
- Input sanitization and validation
- Rate limiting on API endpoints

## ♿ Accessibility

- WCAG 2.1 Level AA compliant
- Keyboard navigation support
- Screen reader optimized
- Skip links for navigation
- Focus management
- Reduced motion support

## 📖 Documentation

- [User Guide](/guide) - How to use the app
- [Fairness Info](/fairness-info) - How the algorithm works
- [API Documentation](docs/API.md) - REST API reference

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Framer Motion](https://www.framer.com/motion/)

