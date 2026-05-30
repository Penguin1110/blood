import hashlib
import secrets

from fastapi import APIRouter, HTTPException, status

from database import fetch_one
from schemas import LoginRequest, LoginResponse, User

router = APIRouter(prefix="/auth", tags=["auth"])

PASSWORD_HASH_ITERATIONS = 100_000

#test

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PASSWORD_HASH_ITERATIONS,
    ).hex()
    return f"pbkdf2_sha256${PASSWORD_HASH_ITERATIONS}${salt}${password_hash}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt, expected_hash = stored_hash.split("$", 3)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    actual_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        int(iterations),
    ).hex()
    return secrets.compare_digest(actual_hash, expected_hash)


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    user = fetch_one(
        """
        SELECT
            donor_id,
            name,
            nickname,
            gender,
            birthday,
            blood_type,
            phone,
            email,
            last_date,
            spent_points,
            password_hash
        FROM `user`
        WHERE email = %s
        """,
        (payload.email,),
    )

    if user and verify_password(payload.password, user["password_hash"]):
        return {
            "message": "Login successful",
            "user": User(**user),
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Email 或密碼錯誤",
    )
