from fastapi import APIRouter, HTTPException, status

from database import fetch_one
from schemas import LoginRequest, LoginResponse, User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    user = fetch_one(
        """
        SELECT
            donor_id,
            name,
            gender,
            birthday,
            blood_type,
            phone,
            email,
            last_date,
            hold_points,
            location,
            weight,
            drugs_record,
            password_hash
        FROM `user`
        WHERE email = %s
        """,
        (payload.email,),
    )

    if user and user["password_hash"] == payload.password:
        return {
            "message": "Login successful",
            "user": User(**user),
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password",
    )
