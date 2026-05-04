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
