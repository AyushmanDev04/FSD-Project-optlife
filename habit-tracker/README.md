# Habit Tracker

A beginner-friendly habit tracker built with React, Node.js, Express and MongoDB.
Routines use the If/Then format, with daily check-ins, readiness scores, streaks,
reminders, analytics, and backup/restore.

## Folder structure

    habit-tracker/
      backend/    Express API, Mongoose models, JWT auth
      frontend/   React app built with Vite

## Setup

### 1. MongoDB

Install MongoDB Community Server from https://www.mongodb.com/try/download/community
and start it. The default local address is `mongodb://127.0.0.1:27017`.
The database `habit_tracker` is created automatically when the app first saves data.

### 2. Backend

    cd backend
    npm install
    cp .env.example .env        (Windows: copy .env.example .env)

Open `.env` and change `JWT_SECRET` to a long random string. Then start the server:

    npm run dev        (or npm start)

The API runs at http://localhost:5000.

### 3. Frontend

Open a second terminal:

    cd frontend
    npm install
    npm run dev

Open http://localhost:5173 in your browser. Vite forwards `/api` requests to the backend.

### 4. First use

1. Click "Create an account" and register.
2. Go to Settings and click "Load Demo Data" to see sample routines, check-ins and charts.

## API overview

| Method | Route | Purpose |
|--------|-------|---------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Log in |
| GET | /api/auth/me | Current user |
| GET/POST | /api/routines | List or create routines |
| PUT/DELETE | /api/routines/:id | Edit or delete a routine |
| GET/POST | /api/checkins | List or create daily check-ins |
| PUT | /api/checkins/:id | Edit a check-in |
| GET/POST | /api/completions | List or record completions |
| DELETE | /api/completions/:id | Undo a completion |
| GET | /api/analytics | Statistics, streaks and charts data |
| GET | /api/data/export | Download data as JSON |
| POST | /api/data/import | Restore data from JSON |
| POST | /api/data/demo | Load demo data |

## Notes

- Reminders run while the app is open in a browser tab. A browser cannot
  send reminders when the app is fully closed.
- Passwords are hashed with bcryptjs, which is a pure-JavaScript version of bcrypt
  that installs without compiling native code.
