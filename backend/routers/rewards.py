from fastapi import APIRouter, HTTPException, Query, Response, status

from database import execute, fetch_all, fetch_one
from schemas import GiftCreate, GiftUpdate, Reward

router = APIRouter(prefix="/rewards", tags=["rewards"])


@router.get("", response_model=list[Reward])
def list_rewards(
    q: str | None = Query(default=None, description="Gift item keyword"),
    max_points: int | None = Query(default=None, ge=0),
):
    conditions = []
    params = []

    if q:
        conditions.append("gift_item LIKE %s")
        params.append(f"%{q}%")

    if max_points is not None:
        conditions.append("needed_points <= %s")
        params.append(max_points)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    return fetch_all(
        f"""
        SELECT
            gift_id,
            gift_item,
            needed_points
        FROM gift
        {where_clause}
        ORDER BY needed_points ASC, gift_id ASC
        """,
        tuple(params),
    )


@router.get("/donors/{donor_id}/eligible", response_model=list[Reward])
def list_eligible_rewards(donor_id: int):
    donor_points = fetch_one(
        """
        SELECT
            u.donor_id,
            COALESCE(SUM(h.hold_points), 0) AS points
        FROM `user` AS u
        LEFT JOIN history_log AS h
            ON h.donor_id = u.donor_id
        WHERE u.donor_id = %s
        GROUP BY u.donor_id
        """,
        (donor_id,),
    )

    if not donor_points:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor not found",
        )

    return fetch_all(
        """
        SELECT
            gift_id,
            gift_item,
            needed_points
        FROM gift
        WHERE needed_points <= %s
        ORDER BY needed_points ASC, gift_id ASC
        """,
        (donor_points["points"],),
    )


@router.get("/{gift_id}", response_model=Reward)
def get_reward(gift_id: int):
    reward = fetch_one(
        """
        SELECT
            gift_id,
            gift_item,
            needed_points
        FROM gift
        WHERE gift_id = %s
        """,
        (gift_id,),
    )

    if not reward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reward not found",
        )

    return reward


@router.post("", response_model=Reward, status_code=status.HTTP_201_CREATED)
def create_reward(payload: GiftCreate):
    gift_id = execute(
        """
        INSERT INTO gift (gift_item, needed_points)
        VALUES (%s, %s)
        """,
        (payload.gift_item, payload.needed_points),
    )

    return get_reward(gift_id)


@router.put("/{gift_id}", response_model=Reward)
def update_reward(gift_id: int, payload: GiftUpdate):
    get_reward(gift_id)
    execute(
        """
        UPDATE gift
        SET gift_item = %s,
            needed_points = %s
        WHERE gift_id = %s
        """,
        (payload.gift_item, payload.needed_points, gift_id),
    )

    return get_reward(gift_id)


@router.delete("/{gift_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reward(gift_id: int):
    get_reward(gift_id)
    execute(
        """
        DELETE FROM gift
        WHERE gift_id = %s
        """,
        (gift_id,),
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
