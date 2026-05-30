from fastapi import APIRouter, HTTPException, Query

from database import fetch_all, fetch_one, get_connection
from schemas import Donation, DonationRecord, DonationRecordCreate, DonationRecordUpdate

router = APIRouter(prefix="/donations", tags=["donations"])


def points_for_category(category: str | None) -> int:
    if category in {"血小板", "血小板血漿"}:
        return 60
    if category == "血漿":
        return 40
    return 50


def require_admin(admin_id: int):
    admin = fetch_one(
        "SELECT admin_id FROM admin WHERE admin_id = %s",
        (admin_id,),
    )
    if not admin:
        raise HTTPException(status_code=403, detail="需要管理員權限")


def refresh_last_date(cursor, donor_id: int):
    cursor.execute(
        """
        UPDATE `user`
        SET last_date = (
            SELECT MAX(donation_date)
            FROM donation_record
            WHERE donor_id = %s
        )
        WHERE donor_id = %s
        """,
        (donor_id, donor_id),
    )


def apply_points_delta(cursor, donor_id: int, delta: int):
    if delta == 0:
        return

    cursor.execute(
        """
        SELECT log_id
        FROM history_log
        WHERE donor_id = %s
        ORDER BY recorded_at DESC, log_id DESC
        LIMIT 1
        """,
        (donor_id,),
    )
    latest_log = cursor.fetchone()

    if latest_log:
        cursor.execute(
            """
            UPDATE history_log
            SET hold_points = hold_points + %s
            WHERE log_id = %s
            """,
            (delta, latest_log["log_id"]),
        )
    else:
        cursor.execute(
            """
            INSERT INTO history_log (donor_id, hold_points)
            VALUES (%s, %s)
            """,
            (donor_id, delta),
        )


@router.get("", response_model=list[Donation])
def list_donations(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    return fetch_all(
        """
        SELECT
            record_id,
            donor_id,
            donation_date,
            address,
            category
        FROM donation_record
        ORDER BY donation_date DESC, record_id DESC
        LIMIT %s OFFSET %s
        """,
        (limit, offset),
    )

@router.get("/user/{donor_id}", response_model=list[DonationRecord])
def get_donation_records_by_user(
    donor_id: int,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    records = fetch_all(
        """
        SELECT record_id, donor_id, donation_date, address, category
        FROM donation_record
        WHERE donor_id = %s
        ORDER BY donation_date DESC
        LIMIT %s OFFSET %s
        """,
        (donor_id, limit, offset),
    )
    return records

@router.get("/{record_id}", response_model=DonationRecord)
def get_donation_record(record_id: int):
    record = fetch_one(
        """
        SELECT record_id, donor_id, donation_date, address, category
        FROM donation_record
        WHERE record_id = %s
        """,
        (record_id,)
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

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO donation_record 
                (donor_id, donation_date, address, category)
                VALUES (%s, %s, %s, %s)
                """,
                (
                    record.donor_id,
                    record.donation_date,
                    record.address,
                    record.category
                )
            )

            new_id = cursor.lastrowid

            refresh_last_date(cursor, record.donor_id)
            apply_points_delta(cursor, record.donor_id, points_for_category(record.category))

            connection.commit()

    new_record = fetch_one(
        """
        SELECT record_id, donor_id, donation_date, address, category
        FROM donation_record
        WHERE record_id = %s
        """,
        (new_id,)
    )

    return new_record

@router.put("/{record_id}", response_model=DonationRecord)
def update_donation_record(
    record_id: int,
    record: DonationRecordUpdate,
    admin_id: int = Query(..., description="管理員 admin_id"),
):
    require_admin(admin_id)

    old_record = fetch_one(
        "SELECT * FROM donation_record WHERE record_id = %s",
        (record_id,)
    )

    if not old_record:
        raise HTTPException(status_code=404, detail="找不到捐血紀錄")

    new_donor_id = record.donor_id if record.donor_id is not None else old_record["donor_id"]
    if record.donor_id is not None:
        donor = fetch_one("SELECT donor_id FROM `user` WHERE donor_id = %s", (record.donor_id,))
        if not donor:
            raise HTTPException(status_code=404, detail="找不到捐血者")

    new_donation_date = record.donation_date if record.donation_date is not None else old_record["donation_date"]
    new_address = record.address if record.address is not None else old_record["address"]
    new_category = record.category if record.category is not None else old_record["category"]

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE donation_record
                SET donor_id = %s,
                    donation_date = %s,
                    address = %s,
                    category = %s
                WHERE record_id = %s
                """,
                (new_donor_id, new_donation_date, new_address, new_category, record_id)
            )

            old_donor_id = old_record["donor_id"]
            old_points = points_for_category(old_record["category"])
            new_points = points_for_category(new_category)

            if old_donor_id == new_donor_id:
                apply_points_delta(cursor, new_donor_id, new_points - old_points)
                refresh_last_date(cursor, new_donor_id)
            else:
                apply_points_delta(cursor, old_donor_id, -old_points)
                apply_points_delta(cursor, new_donor_id, new_points)
                refresh_last_date(cursor, old_donor_id)
                refresh_last_date(cursor, new_donor_id)

            connection.commit()

    updated_record = fetch_one(
        """
        SELECT record_id, donor_id, donation_date, address, category
        FROM donation_record
        WHERE record_id = %s
        """,
        (record_id,)
    )

    return updated_record

@router.delete("/{record_id}")
def delete_donation_record(
    record_id: int,
    admin_id: int = Query(..., description="管理員 admin_id"),
):
    require_admin(admin_id)

    old_record = fetch_one(
        "SELECT * FROM donation_record WHERE record_id = %s",
        (record_id,)
    )

    if not old_record:
        raise HTTPException(status_code=404, detail="找不到捐血紀錄")

    donor_id = old_record["donor_id"]

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "DELETE FROM donation_record WHERE record_id = %s",
                (record_id,)
            )

            refresh_last_date(cursor, donor_id)
            apply_points_delta(cursor, donor_id, -points_for_category(old_record["category"]))

            connection.commit()

    return {"message": "捐血紀錄刪除成功"}
