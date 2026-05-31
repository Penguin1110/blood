from fastapi import APIRouter, HTTPException, Query, Response, status

from database import execute, fetch_all, fetch_one, get_connection
from schemas import DonorRanking, GiftCreate, GiftUpdate, PointSummary, RedemptionCreate, RedemptionRecord, Reward, SiteGift, SiteGiftUpsert

router = APIRouter(prefix="/rewards", tags=["rewards"])


@router.get("/leaderboard", response_model=list[DonorRanking])
def list_donor_leaderboard(
    limit: int = Query(default=5, ge=1, le=20),
):
    rows = fetch_all(
        """
        SELECT
            donor_id,
            nickname,
            cumulative_points,
            current_points
        FROM donor_points_summary
        ORDER BY cumulative_points DESC, current_points DESC, donor_id ASC
        LIMIT %s
        """,
        (limit,),
    )

    return [
        {
            "rank": idx + 1,
            **row,
        }
        for idx, row in enumerate(rows)
    ]


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


@router.get("/donors/{donor_id}/points", response_model=PointSummary)
def get_donor_points(donor_id: int):
    donor_points = fetch_one(
        """
        SELECT
            donor_id,
            cumulative_points,
            current_points
        FROM donor_points_summary
        WHERE donor_id = %s
        """,
        (donor_id,),
    )
    if not donor_points:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到捐血者")
    return donor_points


@router.get("/donors/{donor_id}/eligible", response_model=list[Reward])
def list_eligible_rewards(donor_id: int):
    donor_points = get_donor_points(donor_id)

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
        (donor_points["current_points"],),
    )


@router.get("/donors/{donor_id}/redemptions", response_model=list[RedemptionRecord])
def list_redemptions_by_donor(
    donor_id: int,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    return fetch_all(
        """
        SELECT
            redemption_id,
            donor_id,
            gift_id,
            site_id,
            points_spent,
            redeemed_at
        FROM redemption_record
        WHERE donor_id = %s
        ORDER BY redeemed_at DESC, redemption_id DESC
        LIMIT %s OFFSET %s
        """,
        (donor_id, limit, offset),
    )


@router.post("/redeem", response_model=RedemptionRecord, status_code=status.HTTP_201_CREATED)
def redeem_reward(payload: RedemptionCreate):
    donor_points = get_donor_points(payload.donor_id)
    reward = get_reward(payload.gift_id)

    if donor_points["current_points"] < reward["needed_points"]:
        raise HTTPException(status_code=400, detail="目前點數不足")

    if payload.site_id is not None:
        site = fetch_one("SELECT site_id FROM donation_site WHERE site_id = %s", (payload.site_id,))
        if not site:
            raise HTTPException(status_code=404, detail="找不到兌換據點")
        site_gift = fetch_one(
            "SELECT site_gift_id, quantity FROM site_gift WHERE site_id = %s AND gift_id = %s",
            (payload.site_id, payload.gift_id),
        )
        if site_gift is not None and site_gift["quantity"] <= 0:
            raise HTTPException(status_code=400, detail="此據點贈品庫存不足")

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO redemption_record
                    (donor_id, gift_id, site_id, points_spent)
                VALUES (%s, %s, %s, %s)
                """,
                (payload.donor_id, payload.gift_id, payload.site_id, reward["needed_points"]),
            )
            redemption_id = cursor.lastrowid
            cursor.execute(
                """
                INSERT INTO point_transaction
                    (donor_id, source_type, source_id, points_delta, description)
                VALUES (%s, 'redemption_record', %s, %s, %s)
                """,
                (
                    payload.donor_id,
                    redemption_id,
                    -reward["needed_points"],
                    f"兌換贈品：{reward['gift_item']}",
                ),
            )
            if payload.site_id is not None:
                cursor.execute(
                    """
                    UPDATE site_gift
                    SET quantity = GREATEST(quantity - 1, 0)
                    WHERE site_id = %s AND gift_id = %s AND quantity > 0
                    """,
                    (payload.site_id, payload.gift_id),
                )
            connection.commit()

    return fetch_one(
        """
        SELECT
            redemption_id,
            donor_id,
            gift_id,
            site_id,
            points_spent,
            redeemed_at
        FROM redemption_record
        WHERE redemption_id = %s
        """,
        (redemption_id,),
    )


@router.get("/sites/{site_id}", response_model=list[SiteGift])
def list_site_gifts(site_id: int):
    site = fetch_one("SELECT site_id FROM donation_site WHERE site_id = %s", (site_id,))
    if not site:
        raise HTTPException(status_code=404, detail="找不到捐血據點")

    return fetch_all(
        """
        SELECT
            sg.site_gift_id,
            sg.site_id,
            sg.gift_id,
            g.gift_item,
            g.needed_points,
            sg.quantity
        FROM site_gift sg
        JOIN gift g ON g.gift_id = sg.gift_id
        WHERE sg.site_id = %s
        ORDER BY g.needed_points ASC, g.gift_id ASC
        """,
        (site_id,),
    )


@router.put("/sites/{site_id}/{gift_id}", response_model=SiteGift)
def upsert_site_gift(site_id: int, gift_id: int, payload: SiteGiftUpsert):
    site = fetch_one("SELECT site_id FROM donation_site WHERE site_id = %s", (site_id,))
    if not site:
        raise HTTPException(status_code=404, detail="找不到捐血據點")
    get_reward(gift_id)

    existing = fetch_one(
        "SELECT site_gift_id FROM site_gift WHERE site_id = %s AND gift_id = %s",
        (site_id, gift_id),
    )
    if existing:
        execute(
            "UPDATE site_gift SET quantity = %s WHERE site_id = %s AND gift_id = %s",
            (payload.quantity, site_id, gift_id),
        )
    else:
        execute(
            "INSERT INTO site_gift (site_id, gift_id, quantity) VALUES (%s, %s, %s)",
            (site_id, gift_id, payload.quantity),
        )

    return fetch_one(
        """
        SELECT sg.site_gift_id, sg.site_id, sg.gift_id, g.gift_item, g.needed_points, sg.quantity
        FROM site_gift sg JOIN gift g ON g.gift_id = sg.gift_id
        WHERE sg.site_id = %s AND sg.gift_id = %s
        """,
        (site_id, gift_id),
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
            detail="找不到獎品",
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
