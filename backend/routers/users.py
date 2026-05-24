from fastapi import APIRouter

from database import fetch_all
from schemas import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[User])
def list_users():
    return fetch_all(
        """
        SELECT
            donor_id,
            name,
            gender,
            birthday,
            blood_type,
            phone,
            email,
            last_date
        FROM `user`
        """
    )
