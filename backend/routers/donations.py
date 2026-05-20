from fastapi import APIRouter

from database import fetch_all
from schemas import Donation

router = APIRouter(prefix="/donations", tags=["donations"])


@router.get("", response_model=list[Donation])
def list_donations():
    return fetch_all(
        """
        SELECT
            record_id,
            donor_id,
            donation_date,
            address,
            category
        FROM donation_record
        """
    )
