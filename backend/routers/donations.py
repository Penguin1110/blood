from fastapi import APIRouter

from mock_data import donations
from schemas import Donation

router = APIRouter(prefix="/donations", tags=["donations"])


@router.get("", response_model=list[Donation])
def list_donations():
    return donations
