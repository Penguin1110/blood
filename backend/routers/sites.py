from fastapi import APIRouter

from mock_data import sites
from schemas import DonationSite

router = APIRouter(prefix="/sites", tags=["sites"])


@router.get("", response_model=list[DonationSite])
def list_sites():
    return sites
