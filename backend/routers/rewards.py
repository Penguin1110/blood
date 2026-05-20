from fastapi import APIRouter

from database import fetch_all
from schemas import Reward

router = APIRouter(prefix="/rewards", tags=["rewards"])


@router.get("", response_model=list[Reward])
def list_rewards():
    return fetch_all(
        """
        SELECT
            gift_id,
            gift_item,
            needed_points
        FROM gift
        """
    )
