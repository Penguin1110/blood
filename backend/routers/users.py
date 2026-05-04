from fastapi import APIRouter

from mock_data import users
from schemas import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[User])
def list_users():
    return users
