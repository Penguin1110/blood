# Blood

Frontend and backend starter project for a blood donation/inventory app.

## Structure

- `frontend/`: Vite React app
- `frontend/src/api/`: fetch helpers for backend calls
- `backend/`: FastAPI backend
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
pip install fastapi uvicorn python-dotenv
uvicorn main:app --reload
```

The backend reads `DATABASE_URL` from `backend/.env`.
