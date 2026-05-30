from fastapi import APIRouter, HTTPException, status

from database import fetch_one
from routers.auth import verify_password
from schemas import Admin, AdminLoginRequest, AdminLoginResponse

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/login", response_model=AdminLoginResponse)
def admin_login(payload: AdminLoginRequest):
    admin = fetch_one(
        """
        SELECT
            admin_id,
            username,
            display_name,
            password_hash
        FROM admin
        WHERE username = %s
        """,
        (payload.username,),
    )

    if admin and verify_password(payload.password, admin["password_hash"]):
        return {
            "message": "Admin login successful",
            "admin": Admin(**admin),
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="管理員帳號或密碼錯誤",
    )
