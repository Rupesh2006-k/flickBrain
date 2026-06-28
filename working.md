You are a technical writer and expert developer.

Write a complete, professional README.md file for "FlickBrain" — 
a Netflix + YouTube Recommendation Engine SaaS app.

## App Details
Name: FlickBrain
Tagline: Your personal AI-powered content recommendation engine
Type: Full-stack monolith SaaS web app
Purpose: Syncs user's Netflix and YouTube watch history, 
         analyzes taste using a scoring algorithm + Groq LLM,
         and recommends what to watch next on the dashboard daily.

## Tech Stack

### Backend
- Node.js + Express.js (ES Modules)
- MongoDB + Mongoose
- JWT authentication (httpOnly cookies)
- bcryptjs (password hashing)
- Google OAuth 2.0 (no passport — manual implementation)
- YouTube Data API v3 (liked videos + playlist sync)
- TMDB API (movie/show metadata enrichment)
- Groq API — llama-3.3-70b-versatile (LLM re-ranking)
- multer (Netflix CSV upload)
- csv-parse (CSV parsing)
- axios
- cors, cookie-parser, dotenv

### Frontend
- React 18 + Vite
- React Router DOM v6
- Axios (withCredentials: true)
- Tailwind CSS v3
- React Icons

## Features to document

### Auth
- Email + password register/login
- Google OAuth 2.0 login (single click — connects YouTube too)
- JWT stored in httpOnly cookie
- Role based access: user | admin

### Netflix Integration
- Search any movie/show → "I watched this" → saved instantly
- Or upload Netflix CSV export from netflix.com/settings
- TMDB enrichment: genre, poster, cast, details auto-fetched

### YouTube Integration  
- Connect via Google OAuth (same login flow)
- Syncs liked videos + playlist items (LL playlist)
- YouTube thumbnails auto-set (img.youtube.com/vi/{id}/mqdefault.jpg)
- Fallback: both API calls run with Promise.allSettled

### Recommendation Engine
- Weighted scoring algorithm:
    Genre match    30%
    Tag match      25%
    Title keywords 25%
    Recency bonus  15%
    Source bonus    5%
- Groq LLM re-ranking (llama-3.3-70b-versatile)
- "Because you watched X" reason per recommendation
- Dismiss → never show again
- Rate (1-5 stars) → algorithm learns taste
- Minimum score guarantee (never empty dashboard)

### Watchlist
- Add from dashboard recommendations
- "To Watch" and "Watched" tabs
- Priority: high | medium | low
- Mark as watched → moves to Watched tab

### Admin Panel
- /admin/stats → total users, content, recommendations
- /admin/users → manage users, upgrade plan, soft delete

### Plans
- Free tier
- Premium tier (upgradeable by admin)

# 📁 Project Structure

```text
project-root/
│
├── backend/
│   ├── src/
│   │
│   │   ├── config/
│   │   │   └── db.js                     # MongoDB Connection
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js        # Authentication Logic
│   │   │   ├── ingest.controller.js      # YouTube & TMDB Data Ingestion
│   │   │   ├── recommend.controller.js   # Recommendation APIs
│   │   │   ├── watchlist.controller.js   # Watchlist Management
│   │   │   └── admin.controller.js       # Admin Operations
│   │   │
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js        # JWT Authentication
│   │   │   └── role.middleware.js        # Role-based Authorization
│   │   │
│   │   ├── models/
│   │   │   ├── User.model.js             # User Schema
│   │   │   ├── Content.model.js          # Movies & YouTube Content
│   │   │   ├── WatchedItem.model.js      # Watch History
│   │   │   ├── Recommendation.model.js   # Saved Recommendations
│   │   │   └── Watchlist.model.js        # User Watchlist
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── ingest.routes.js
│   │   │   ├── recommend.routes.js
│   │   │   ├── watchlist.routes.js
│   │   │   └── admin.routes.js
│   │   │
│   │   ├── services/
│   │   │   ├── scorer.service.js         # Recommendation Scoring
│   │   │   ├── llmRanker.service.js      # LLM-based Ranking
│   │   │   └── tmdb.service.js           # TMDB API Service
│   │   │
│   │   ├── scripts/
│   │   │   └── fixYoutubeThumbnails.js   # Thumbnail Fix Script
│   │   │
│   │   └── utils/
│   │       └── apiResponse.js            # Standard API Responses
│   │
│   ├── index.js                          # Backend Entry Point
│   └── .env.example                      # Environment Variables Template
│
├── frontend/
│   ├── src/
│   │
│   │   ├── api/
│   │   │   └── axios.js                  # Axios Configuration
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx           # Authentication Context
│   │   │
│   │   ├── hooks/
│   │   │   └── useAuth.js                # Custom Auth Hook
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Watchlist.jsx
│   │   │   ├── Ingest.jsx
│   │   │   ├── Profile.jsx
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── AdminStats.jsx
│   │   │       └── AdminUsers.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ContentCard.jsx
│   │   │   ├── RatingStars.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AdminRoute.jsx
│   │   │
│   │   └── App.jsx                       # Main React Application
│   │
│   └── package.json
│
├── README.md
└── LICENSE
```

## 📂 Folder Overview

| Folder | Description |
|---------|-------------|
| **backend/** | Express.js Backend Server |
| **frontend/** | React.js Frontend Application |
| **config/** | Database & Configuration Files |
| **controllers/** | Business Logic for APIs |
| **middlewares/** | Authentication & Authorization |
| **models/** | MongoDB Mongoose Schemas |
| **routes/** | API Route Definitions |
| **services/** | External APIs & Recommendation Logic |
| **scripts/** | Utility Scripts |
| **utils/** | Helper Functions |
| **components/** | Reusable React Components |
| **pages/** | Application Pages |
| **context/** | React Context Providers |
| **hooks/** | Custom React Hooks |
| **api/** | Axios & API Configuration |
## API Endpoints to document

### Auth — /api/auth
POST   /register
POST   /login
POST   /logout
GET    /me
GET    /google
GET    /google/callback

### Ingest — /api/ingest
POST   /netflix          (multipart/form-data, field: file)
POST   /youtube
GET    /search?q=query
POST   /mark-watched

### Recommend — /api/recommend
GET    /
POST   /dismiss/:id
POST   /rate/:id

### Watchlist — /api/watchlist
GET    /
POST   /
PATCH  /:id
DELETE /:id

### Admin — /api/admin
GET    /users
GET    /users/:id
PATCH  /users/:id/plan
DELETE /users/:id
GET    /stats

## Environment Variables to document

### Backend .env
PORT=3000
MONGO_URI=mongodb://localhost:27017/flickbrain
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
CLIENT_URL=http://localhost:5173
TMDB_API_KEY=your_tmdb_api_key
GROQ_API_KEY=your_groq_api_key
YOUTUBE_API_KEY=your_youtube_api_key

### Frontend .env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id

## External API Setup Instructions to include

### Google Cloud Console
1. console.cloud.google.com → New Project → "FlickBrain"
2. APIs & Services → Library → Enable "YouTube Data API v3"
3. APIs & Services → Credentials → Create OAuth 2.0 Client ID
4. Application type: Web Application
5. Authorized redirect URIs: http://localhost:3000/api/auth/google/callback
6. Copy Client ID + Secret to .env

### TMDB API
1. themoviedb.org → Sign up → Settings → API → Request API key
2. Copy API key to TMDB_API_KEY in .env

### Groq API
1. console.groq.com → Sign up → API Keys → Create key
2. Copy to GROQ_API_KEY in .env (free tier available)

## Scripts to document
npm run dev              # Start backend with nodemon
npm run fix-thumbnails   # Fix missing YouTube thumbnails in DB

## README sections to include (in this order)
1. Hero section — app name, tagline, badges (Node.js, React, MongoDB, 
   Tailwind, Groq, License: MIT)
2. Features overview — bullet list with emojis
3. Tech Stack — table format, backend + frontend separate
4. How it works — simple numbered flow (5 steps max)
5. Project Structure — folder tree (backend + frontend)
6. Getting Started
   a. Prerequisites (Node 18+, MongoDB, accounts needed)
   b. Clone repo
   c. Backend setup (install, .env, run)
   d. Frontend setup (install, .env, run)
7. Environment Variables — full table with Variable | Description | Example
8. API Reference — grouped by resource, method + path + description
9. External API Setup — Google, TMDB, Groq step by step
10. How Recommendations Work — explain the algorithm simply
11. Scripts
12. Contributing
13. License (MIT)

