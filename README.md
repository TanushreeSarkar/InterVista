# InterVista - AI-Powered Mock Interview Platform

A comprehensive full-stack application for practicing interviews with AI-powered feedback, built with **Next.js 14**, **Express.js**, **TypeScript**, and **Firebase Firestore**.

## 🚀 Features

### Frontend
- ✨ Modern, responsive UI with Tailwind CSS + shadcn/ui
- 🎨 Smooth animations using Framer Motion
- 🔐 Complete authentication flow (sign-in, sign-up, reset password)
- 📊 Interactive dashboard with session management
- 📝 Text-based interview interface with question-by-question flow
- 📈 AI-generated detailed evaluation with per-question feedback
- 🎯 Animated landing page

### Backend
- 🔒 JWT-based authentication with bcrypt password hashing (httpOnly cookies)
- 🗄️ Firebase Firestore database (all collections)
- 📁 Audio file upload support (multer) with magic byte validation
- 🤖 **Real AI evaluation with Groq (Llama 3)**
- 🎙️ **Voice features with OpenAI (Whisper + TTS)**
- 🔄 RESTful API with typed responses
- 🛡️ Security with Helmet and CORS

## 📋 Prerequisites

- **Node.js v20+**
- npm or yarn
- Firebase project with Firestore enabled
- Groq API key and OpenAI API key

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

Create `.env` file from the example:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=4000
NODE_ENV=development
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
JWT_SECRET=your-super-secret-jwt-key-at-least-64-characters
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:3000
GROQ_API_KEY=gsk_your_groq_api_key
OPENAI_API_KEY=sk-your-openai-api_key
SMTP_USER=your-email@example.com
SMTP_PASS=your-smtp-password
```

**Firebase Setup:**
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Go to Project Settings → Service Accounts → Generate new private key
4. Copy the `project_id`, `client_email`, and `private_key` values into `.env`

### 3. Frontend Setup
```bash
cd web
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 🚀 Running the Application

### Start Backend
```bash
cd backend
npm run dev
```
Backend runs on http://localhost:4000

### Start Frontend
```bash
cd web
npm run dev
```
Frontend runs on http://localhost:3000

## 📁 Project Structure

```
InterVista/
├── backend/                 # Express.js + TypeScript backend
│   ├── src/
│   │   ├── config/         # Environment validation
│   │   ├── controllers/    # Auth, Session, Answer controllers
│   │   ├── db/             # Firestore initialization
│   │   ├── lib/            # AI (Anthropic Claude) integration
│   │   ├── middleware/     # JWT auth middleware
│   │   ├── routes/         # API route wiring
│   │   ├── types/          # TypeScript interfaces
│   │   └── server.ts       # Express app entry point
│   └── uploads/            # Audio file storage
│
└── web/                     # Next.js 14 (App Router)
    ├── src/
    │   ├── app/            # App router pages
    │   ├── components/     # React components (shadcn/ui)
    │   ├── contexts/       # Auth context
    │   └── lib/            # API client & utilities
    └── public/             # Static assets
```

## 🔐 Authentication Flow

1. User signs up → password hashed with bcrypt (12 rounds)
2. JWT token generated with a JTI and stored securely in an `httpOnly` cookie
3. Session is maintained via the cookie, which is sent with all `Credentials: "include"` requests
4. Sign out revokes the JWT using a Firestore blocklist
5. On 401 response → cookie cleared, redirect to sign-in
6. `GET /api/auth/me` validates token and returns user on page load

## 🤖 AI Integration

## 🤖 AI Integration

InterVista uses **Groq (Llama 3.3)** and **OpenAI** for:

- **Question Generation**: Groq generates 5 role-specific interview questions based on company, role, target difficulty and persona constraints
- **Answer Evaluation**: Groq evaluates all answers asynchronously (202 Accepted pattern) and returns:
  - Overall score (0-100)
  - Recommendation (Strong Hire / Hire / Consider / No Hire)
  - Skills assessment (Communication, Technical Knowledge, Problem Solving, Confidence)
  - Per-question feedback with strengths and areas for improvement
- **Transcription**: OpenAI Whisper transcribes candidate audio responses
- **Text-to-Speech**: OpenAI TTS brings the interviewer personas to life

## 📝 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/signin` | Sign in user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/reset-password` | Request password reset OTP | No |
| POST | `/api/auth/verify-reset` | Verify OTP and reset password | No |

### Sessions
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/sessions` | Create session + AI questions | Yes |
| GET | `/api/sessions` | List user's sessions | Yes |
| GET | `/api/sessions/:id` | Get session details | Yes |
| GET | `/api/sessions/:id/questions` | Get session questions | Yes |

### Answers
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/answers` | Submit answer (multipart) | Yes |
| GET | `/api/answers/evaluation/:sessionId` | Get/generate AI evaluation (async 202) | Yes |
| POST | `/api/answers/evaluation/:sessionId/retry` | Retry failed evaluation | Yes |
| POST | `/api/auth/signout` | Sign out and revoke token | Yes |

All responses follow: `{ data: payload }` on success, `{ error: string }` on failure.

## 🔧 Environment Variables

### Backend
| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port (default: 4000) | No |
| NODE_ENV | Environment | No |
| FIREBASE_PROJECT_ID | Firebase project ID | **Yes** |
| FIREBASE_CLIENT_EMAIL | Firebase service account email | **Yes** |
| FIREBASE_PRIVATE_KEY | Firebase service account private key | **Yes** |
| JWT_SECRET | JWT signing secret | **Yes** |
| JWT_EXPIRES_IN | Token expiration (default: 7d) | No |
| CORS_ORIGINS | Allowed origins (default: localhost:3000) | No |
| GROQ_API_KEY | Groq API key for Llama 3 | **Yes** |
| OPENAI_API_KEY | OpenAI API key for TTS/Whisper | **Yes** |
| SMTP_USER | SMTP username | No |
| SMTP_PASS | SMTP password | No |

### Frontend
| Variable | Description | Required |
|----------|-------------|----------|
| NEXT_PUBLIC_API_URL | Backend API URL | **Yes** |

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS v3, shadcn/ui, Framer Motion |
| **Backend** | Express.js, TypeScript, Node.js v20+ |
| **Database** | Firebase Firestore |
| **Auth** | JWT in httpOnly Cookies, bcrypt |
| **AI (LLM)** | Groq (llama-3.3-70b-versatile) |
| **AI (Audio)** | OpenAI (whisper-1, tts-1) |
| **File Upload** | Multer |

---

Made with ❤️ by the InterVista Team