from fastapi import APIRouter

from database import fetch_all
from schemas import DonationSite

router = APIRouter(prefix="/sites", tags=["sites"])


@router.get("", response_model=list[DonationSite])
def list_sites():
    return fetch_all(
        """
        SELECT
            site_id,
            loca_name,
            address,
            open_time,
            category
        FROM donation_site
        """
    )
