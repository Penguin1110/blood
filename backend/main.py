from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import donations, health, rewards, sites, users

app = FastAPI(title="Blood API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(users.router)
app.include_router(donations.router)
app.include_router(sites.router)
app.include_router(rewards.router)


@app.get("/")
def read_root():
    return {"message": "Blood API is running"}
