# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../web
npm install
```

### Step 2: Configure Environment

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

**Minimum configuration for development:**
```env
PORT=4000
JWT_SECRET=your-secret-key-here
CORS_ORIGINS=http://localhost:3000
```

**Note:** Firebase is optional for development. The app will run in mock mode without it.

#### Frontend (.env.local)
```bash
cd web
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local
```

### Step 3: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd web
npm run dev
```

### Step 4: Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Health Check:** http://localhost:4000/health

## 🎯 First Steps

1. **Visit the Landing Page**
   - Open http://localhost:3000
   - Explore the 6 animated sections

2. **Create an Account**
   - Click "Sign Up" or go to http://localhost:3000/sign-up
   - Enter your details (email, name, password)
   - You'll be automatically signed in

3. **Start Your First Interview**
   - From the dashboard, click "New Interview"
   - Select a role and experience level
   - Click "Start Interview"

4. **Experience the Zoom-like Interface**
   - Navigate to `/interview/[id]/zoom-style-page` for the enhanced interface
   - Use the control bar to manage mic, video, and transcript
   - Answer questions using the audio recorder

5. **View Your Evaluation**
   - After completing the interview, view detailed feedback
   - Track your progress over time

## 🔧 Troubleshooting

### Backend won't start
- **Issue:** Firebase credentials error
- **Solution:** This is expected in development. The app runs in mock mode. Ignore the warning.

### Frontend can't connect to backend
- **Issue:** CORS or connection errors
- **Solution:** Ensure backend is running on port 4000 and CORS_ORIGINS includes http://localhost:3000

### Port already in use
- **Backend (4000):** Change PORT in backend/.env
- **Frontend (3000):** Run `npm run dev -- -p 3001`

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for technical details
- Explore the codebase structure
- Customize the theme in `web/src/app/globals.css`
- Add your Firebase credentials for production use

## 🎨 Customization

### Change Colors
Edit `web/src/app/globals.css`:
```css
:root {
  --primary: 217 91% 60%;  /* Blue */
  --secondary: 262 83% 58%; /* Purple */
}
```

### Add New Interview Questions
Edit `backend/src/controllers/session.controller.ts`:
```typescript
const questionTemplates: Record<string, string[]> = {
  'Your Role': [
    'Your question here',
    // Add more questions
  ],
};
```

### Modify Landing Page Sections
Edit files in `web/src/components/landing/`

## 🐛 Common Issues

1. **"Module not found" errors**
   - Run `npm install` in the respective directory

2. **TypeScript errors**
   - Run `npm run build` to check for issues
   - Ensure all dependencies are installed

3. **Styling issues**
   - Clear browser cache
   - Restart the dev server

## 💡 Tips

- Use the Zoom-style interface for the best experience
- Enable dark mode using the theme toggle in the navbar
- Check the browser console for helpful debug information
- Backend runs in mock mode without Firebase (perfect for development)

## 🆘 Need Help?

- Check the [README.md](README.md) for detailed documentation
- Review error messages in the terminal
- Ensure all environment variables are set correctly

---

Happy coding! 🎉