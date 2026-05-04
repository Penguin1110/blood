from fastapi import APIRouter

from mock_data import rewards
from schemas import Reward

router = APIRouter(prefix="/rewards", tags=["rewards"])


@router.get("", response_model=list[Reward])
def list_rewards():
    return rewards
