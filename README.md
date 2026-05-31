# Blood

Frontend and backend starter project for a blood donation/inventory app.

## Structure

- `frontend/`: Vite React app
- `frontend/src/api/`: fetch helpers for backend calls
- `backend/`: FastAPI backend
- `backend/routers/`: users, health, donations, sites, and rewards routes
- `backend/mock_data.py`: hardcoded sample data

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend reads `VITE_API_URL` from `frontend/.env`.

## Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Copy `backend/.env.example` to `backend/.env` for local database settings. The real `.env` file is ignored by git.

## Admin Review

Admin accounts are stored separately in the `admin` table, not in `user`.

Seeded admin logins:

- `admin1@blood.local` / `**Admin123!**`
- `admin2@blood.local` / `Admin123!`
- `reviewer@blood.local` / `Review123!`

Admin page:

```text
http://localhost:5173/admin/login
```

Admins only use the donation-record review page. Regular users can view donation records, but cannot create, edit, or delete them.

This project currently uses localStorage-based login state. A production system should use server-issued tokens or sessions so the backend can verify every protected request without trusting ids sent by the browser.
