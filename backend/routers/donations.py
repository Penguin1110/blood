from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, Query

from database import fetch_all, fetch_one, get_connection
from schemas import Donation, DonationRecord, DonationRecordCreate, DonationRecordUpdate

router = APIRouter(prefix="/donations", tags=["donations"])

WHOLE_BLOOD_250 = "全血（250cc）"
WHOLE_BLOOD_500 = "全血（500cc）"
PLATELETS = "血小板"
PLASMA = "血漿"
PLATELETS_PLASMA = "血小板血漿（單採）"

VALID_CATEGORIES = {
    WHOLE_BLOOD_250,
    WHOLE_BLOOD_500,
    PLATELETS,
    PLASMA,
    PLATELETS_PLASMA,
}


def normalize_category(category: str | None) -> str:
    legacy_map = {
        "全血": WHOLE_BLOOD_250,
        "血小板血漿": PLATELETS_PLASMA,
    }
    normalized = legacy_map.get(category or "", category or "")
    if normalized not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail="請選擇有效的捐血種類")
    return normalized


def points_for_category(category: str | None) -> int:
    category = normalize_category(category)
    if category in {PLATELETS, PLATELETS_PLASMA}:
        return 60
    if category == PLASMA:
        return 40
    return 50


def interval_days_for_category(category: str | None) -> int:
    category = normalize_category(category)
    if category == WHOLE_BLOOD_250:
        return 60
    if category == WHOLE_BLOOD_500:
        return 90
    return 14


def require_admin(admin_id: int):
    admin = fetch_one(
        "SELECT admin_id FROM admin WHERE admin_id = %s",
        (admin_id,),
    )
    if not admin:
        raise HTTPException(status_code=403, detail="僅管理員可以審核捐血紀錄")


def refresh_last_donation(cursor, donor_id: int):
    cursor.execute(
        """
        SELECT donation_date, category
        FROM donation_record
        WHERE donor_id = %s
        ORDER BY donation_date DESC, record_id DESC
        LIMIT 1
        """,
        (donor_id,),
    )
    latest = cursor.fetchone()

    cursor.execute(
        """
        UPDATE `user`
        SET last_date = %s,
            last_category = %s
        WHERE donor_id = %s
        """,
        (
            latest["donation_date"] if latest else None,
            latest["category"] if latest else None,
            donor_id,
        ),
    )


def upsert_donation_points(cursor, donor_id: int, record_id: int, points: int, category: str):
    cursor.execute(
        """
        INSERT INTO point_transaction
            (donor_id, source_type, source_id, points_delta, description)
        VALUES (%s, 'donation_record', %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            donor_id = VALUES(donor_id),
            points_delta = VALUES(points_delta),
            description = VALUES(description)
        """,
        (donor_id, record_id, points, f"捐血紀錄加點：{category}"),
    )


def delete_donation_points(cursor, record_id: int):
    cursor.execute(
        """
        DELETE FROM point_transaction
        WHERE source_type = 'donation_record'
          AND source_id = %s
        """,
        (record_id,),
    )


def validate_weight(category: str, donor_weight: float | None):
    if donor_weight is None:
        raise HTTPException(status_code=400, detail="請輸入本次捐血者體重")
    if donor_weight <= 0:
        raise HTTPException(status_code=400, detail="體重必須大於 0")
    if category == WHOLE_BLOOD_500 and donor_weight < 60:
        raise HTTPException(status_code=400, detail="全血（500cc）需 60 公斤以上")
    if category == WHOLE_BLOOD_250 and donor_weight < 45:
        raise HTTPException(status_code=400, detail="全血（250cc）需 45 公斤以上")


def validate_donation_date(donation_date: date):
    if donation_date > date.today():
        raise HTTPException(status_code=400, detail="捐血日期不得為未來日期")


def ensure_interval_ok(
    donor_id: int,
    donation_date: date,
    category: str,
    exclude_record_id: int | None = None,
):
    params: list = [donor_id]
    exclude_clause = ""
    if exclude_record_id is not None:
        exclude_clause = "AND record_id <> %s"
        params.append(exclude_record_id)

    previous = fetch_one(
        f"""
        SELECT donation_date, category
        FROM donation_record
        WHERE donor_id = %s
          AND donation_date < %s
          {exclude_clause}
        ORDER BY donation_date DESC, record_id DESC
        LIMIT 1
        """,
        tuple([donor_id, donation_date] + ([exclude_record_id] if exclude_record_id is not None else [])),
    )

    next_record = fetch_one(
        f"""
        SELECT donation_date, category
        FROM donation_record
        WHERE donor_id = %s
          AND donation_date > %s
          {exclude_clause}
        ORDER BY donation_date ASC, record_id ASC
        LIMIT 1
        """,
        tuple([donor_id, donation_date] + ([exclude_record_id] if exclude_record_id is not None else [])),
    )

    same_day = fetch_one(
        f"""
        SELECT record_id
        FROM donation_record
        WHERE donor_id = %s
          AND donation_date = %s
          {exclude_clause}
        LIMIT 1
        """,
        tuple([donor_id, donation_date] + ([exclude_record_id] if exclude_record_id is not None else [])),
    )

    if same_day:
        raise HTTPException(status_code=400, detail="同一天已有捐血紀錄")

    if previous:
        allowed = previous["donation_date"] + timedelta(days=interval_days_for_category(previous["category"]))
        if donation_date < allowed:
            raise HTTPException(
                status_code=400,
                detail=f"距離上次 {previous['category']} 未達間隔，最早可捐日期為 {allowed}",
            )

    if next_record:
        allowed_next = donation_date + timedelta(days=interval_days_for_category(category))
        if next_record["donation_date"] < allowed_next:
            raise HTTPException(
                status_code=400,
                detail=f"此紀錄會讓下一筆捐血未達間隔，下一筆最早應為 {allowed_next}",
            )


def select_donation_sql(where_clause: str = "") -> str:
    return f"""
        SELECT
            record_id,
            donor_id,
            donation_date,
            address,
            category,
            donor_weight,
            created_by
        FROM donation_record
        {where_clause}
    """


@router.get("", response_model=list[Donation])
def list_donations(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    return fetch_all(
        select_donation_sql("ORDER BY donation_date DESC, record_id DESC LIMIT %s OFFSET %s"),
        (limit, offset),
    )


@router.get("/user/{donor_id}", response_model=list[DonationRecord])
def get_donation_records_by_user(
    donor_id: int,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    return fetch_all(
        select_donation_sql("WHERE donor_id = %s ORDER BY donation_date DESC, record_id DESC LIMIT %s OFFSET %s"),
        (donor_id, limit, offset),
    )


@router.get("/{record_id}", response_model=DonationRecord)
def get_donation_record(record_id: int):
    record = fetch_one(
        select_donation_sql("WHERE record_id = %s"),
        (record_id,),
    )
    if not record:
        raise HTTPException(status_code=404, detail="找不到捐血紀錄")
    return record


@router.post("", response_model=DonationRecord, status_code=201)
def create_donation_record(
    record: DonationRecordCreate,
    admin_id: int = Query(..., description="管理員 admin_id"),
):
    require_admin(admin_id)

    donor = fetch_one("SELECT donor_id FROM `user` WHERE donor_id = %s", (record.donor_id,))
    if not donor:
        raise HTTPException(status_code=404, detail="找不到捐血者")

    category = normalize_category(record.category)
    validate_donation_date(record.donation_date)
    validate_weight(category, record.donor_weight)
    ensure_interval_ok(record.donor_id, record.donation_date, category)

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO donation_record
                (donor_id, donation_date, address, category, donor_weight, created_by)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    record.donor_id,
                    record.donation_date,
                    record.address,
                    category,
                    record.donor_weight,
                    admin_id,
                ),
            )
            new_id = cursor.lastrowid
            refresh_last_donation(cursor, record.donor_id)
            upsert_donation_points(cursor, record.donor_id, new_id, points_for_category(category), category)
            connection.commit()

    return fetch_one(select_donation_sql("WHERE record_id = %s"), (new_id,))


@router.put("/{record_id}", response_model=DonationRecord)
def update_donation_record(
    record_id: int,
    record: DonationRecordUpdate,
    admin_id: int = Query(..., description="管理員 admin_id"),
):
    require_admin(admin_id)

    old_record = fetch_one("SELECT * FROM donation_record WHERE record_id = %s", (record_id,))
    if not old_record:
        raise HTTPException(status_code=404, detail="找不到捐血紀錄")

    new_donor_id = record.donor_id if record.donor_id is not None else old_record["donor_id"]
    if record.donor_id is not None:
        donor = fetch_one("SELECT donor_id FROM `user` WHERE donor_id = %s", (record.donor_id,))
        if not donor:
            raise HTTPException(status_code=404, detail="找不到捐血者")

    new_donation_date = record.donation_date if record.donation_date is not None else old_record["donation_date"]
    new_address = record.address if record.address is not None else old_record["address"]
    new_category = normalize_category(record.category if record.category is not None else old_record["category"])
    new_weight = record.donor_weight if record.donor_weight is not None else old_record["donor_weight"]

    validate_donation_date(new_donation_date)
    validate_weight(new_category, new_weight)
    ensure_interval_ok(new_donor_id, new_donation_date, new_category, exclude_record_id=record_id)

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE donation_record
                SET donor_id = %s,
                    donation_date = %s,
                    address = %s,
                    category = %s,
                    donor_weight = %s
                WHERE record_id = %s
                """,
                (new_donor_id, new_donation_date, new_address, new_category, new_weight, record_id),
            )

            old_donor_id = old_record["donor_id"]
            new_points = points_for_category(new_category)
            upsert_donation_points(cursor, new_donor_id, record_id, new_points, new_category)

            if old_donor_id == new_donor_id:
                refresh_last_donation(cursor, new_donor_id)
            else:
                refresh_last_donation(cursor, old_donor_id)
                refresh_last_donation(cursor, new_donor_id)

            connection.commit()

    return fetch_one(select_donation_sql("WHERE record_id = %s"), (record_id,))


@router.delete("/{record_id}")
def delete_donation_record(
    record_id: int,
    admin_id: int = Query(..., description="管理員 admin_id"),
):
    require_admin(admin_id)

    old_record = fetch_one("SELECT * FROM donation_record WHERE record_id = %s", (record_id,))
    if not old_record:
        raise HTTPException(status_code=404, detail="找不到捐血紀錄")

    donor_id = old_record["donor_id"]

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM donation_record WHERE record_id = %s", (record_id,))
            refresh_last_donation(cursor, donor_id)
            delete_donation_points(cursor, record_id)
            connection.commit()

    return {"message": "捐血紀錄已刪除"}
