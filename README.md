# InterVista - AI-Powered Mock Interview Platform

A comprehensive full-stack application for practicing interviews with AI-powered feedback, built with Next.js, Express, and Firebase.

## 🚀 Features

### Frontend
- ✨ Modern, responsive UI with vibrant light/dark themes
- 🎨 Smooth animations using GSAP and Framer Motion
- 🔐 Complete authentication flow (sign-in, sign-up, reset password)
- 📊 Interactive dashboard with session management
- 🎥 Zoom-like interview interface with AI avatar
- 📝 Real-time transcript panel
- 📈 Detailed evaluation and progress tracking
- 🎯 6-section animated landing page

### Backend
- 🔒 JWT-based authentication
- 🗄️ Firebase Firestore database
- 📁 Audio file upload and storage
- 🤖 AI evaluation system (mock implementation)
- 🔄 RESTful API with proper error handling
- 🛡️ Security with Helmet and CORS

## 📋 Prerequisites

- Node.js v20 or higher
- npm or yarn
- Firebase project (optional for development)

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd InterVista
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=4000
NODE_ENV=development

# Firebase Configuration (optional for development)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="your-private-key"

# JWT Secret (change in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=http://localhost:3000
```

**Note:** The backend will run in mock mode if Firebase credentials are not provided. For production, you need to:
1. Create a Firebase project at https://console.firebase.google.com
2. Download the service account key JSON file
3. Place it as `backend/serviceAccountKey.json` OR set environment variables

### 3. Frontend Setup

```bash
cd web
npm install
```

Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 🚀 Running the Application

### Start Backend
```bash
cd backend
npm run dev
```
Backend will run on http://localhost:4000

### Start Frontend
```bash
cd web
npm run dev
```
Frontend will run on http://localhost:3000

## 📁 Project Structure

```
InterVista/
├── backend/                 # Express.js backend
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth & error handling
│   │   ├── db/             # Firestore setup
│   │   ├── types/          # TypeScript types
│   │   └── config/         # Configuration
│   └── uploads/            # Audio file storage
│
└── web/                     # Next.js frontend
    ├── src/
    │   ├── app/            # App router pages
    │   ├── components/     # React components
    │   ├── contexts/       # React contexts
    │   └── lib/            # Utilities & API client
    └── public/             # Static assets
```

## 🎯 Key Pages

- `/` - Landing page with 6 animated sections
- `/sign-in` - User authentication
- `/sign-up` - User registration
- `/dashboard` - Session management and stats
- `/interview/[id]` - Interview interface (standard)
- `/interview/[id]/zoom-style-page` - Zoom-like interview interface
- `/evaluation/[id]` - Detailed evaluation results
- `/error/*` - Error pages (401, 403, 404, 500)

## 🔐 Authentication

The app uses JWT-based authentication:

1. User signs up with email/password
2. Password is hashed using bcrypt
3. JWT token is generated and returned
4. Token is stored in localStorage
5. All API requests include `Authorization: Bearer <token>` header
6. Backend validates token on protected routes

## 🎨 Theme

The application features a vibrant color scheme:

**Light Mode:**
- Primary: Blue (#3B82F6)
- Secondary: Purple (#8B5CF6)
- Success: Green (#10B981)
- Warning: Amber (#F59E0B)
- Error: Red (#EF4444)

**Dark Mode:**
- Primary: Light Blue (#60A5FA)
- Secondary: Light Purple (#A78BFA)
- Success: Light Green (#34D399)
- Warning: Light Amber (#FBBF24)
- Error: Light Red (#F87171)

## 🧪 Development

### Backend Development
```bash
cd backend
npm run dev          # Start with hot reload
npm run build        # Build for production
npm start            # Start production server
```

### Frontend Development
```bash
cd web
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## 📦 Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS v3
- **Components:** shadcn/ui
- **Animations:** Framer Motion, GSAP
- **Icons:** Lucide React
- **Language:** TypeScript

### Backend
- **Runtime:** Node.js v20
- **Framework:** Express.js
- **Database:** Firebase Firestore
- **Authentication:** JWT, bcrypt
- **File Upload:** Multer
- **Language:** TypeScript

## 🔧 Configuration

### Backend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port | No (default: 4000) |
| NODE_ENV | Environment | No (default: development) |
| FIREBASE_PROJECT_ID | Firebase project ID | No* |
| FIREBASE_CLIENT_EMAIL | Firebase client email | No* |
| FIREBASE_PRIVATE_KEY | Firebase private key | No* |
| JWT_SECRET | JWT signing secret | Yes |
| JWT_EXPIRES_IN | Token expiration | No (default: 7d) |
| CORS_ORIGINS | Allowed origins | No (default: *) |

*Required for production, optional for development (uses mock mode)

### Frontend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| NEXT_PUBLIC_API_URL | Backend API URL | Yes |

## 🚧 Known Limitations

- AI evaluation is currently mocked (needs real AI integration)
- Speech-to-text not implemented (needs integration)
- WebSocket for real-time evaluation not fully implemented
- File upload to Firebase Storage not implemented (uses local storage)
- Email service for password reset not implemented

## 🔮 Future Enhancements

- [ ] Real AI evaluation using OpenAI/Anthropic
- [ ] Speech-to-text integration
- [ ] Video recording support
- [ ] Screen sharing during interviews
- [ ] Multiple AI interviewer personas
- [ ] Custom question banks
- [ ] Team collaboration features
- [ ] Mobile app
- [ ] Admin panel
- [ ] Performance analytics over time

## 📝 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/reset-password` - Request password reset

### Sessions
- `POST /api/sessions` - Create interview session
- `GET /api/sessions` - Get user's sessions
- `GET /api/sessions/:id` - Get session details
- `GET /api/sessions/:id/questions` - Get session questions

### Answers
- `POST /api/answers` - Submit answer with audio
- `GET /api/answers/evaluation/:sessionId` - Get evaluation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- InterVista Team

## 🙏 Acknowledgments

- shadcn/ui for the beautiful component library
- Vercel for Next.js
- Firebase for backend services
- Lucide for icons

---

Made with ❤️ by the InterVista Team