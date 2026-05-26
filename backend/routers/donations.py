from fastapi import APIRouter, HTTPException, Query

from database import fetch_all, fetch_one, get_connection
from schemas import Donation, DonationRecord, DonationRecordCreate, DonationRecordUpdate

router = APIRouter(prefix="/donations", tags=["donations"])

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
def create_donation_record(record: DonationRecordCreate):
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
                (record.donor_id, record.donor_id)
            )

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
def update_donation_record(record_id: int, record: DonationRecordUpdate):
    old_record = fetch_one(
        "SELECT * FROM donation_record WHERE record_id = %s",
        (record_id,)
    )

    if not old_record:
        raise HTTPException(status_code=404, detail="找不到捐血紀錄")

    new_donation_date = record.donation_date if record.donation_date is not None else old_record["donation_date"]
    new_address = record.address if record.address is not None else old_record["address"]
    new_category = record.category if record.category is not None else old_record["category"]

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE donation_record
                SET donation_date = %s,
                    address = %s,
                    category = %s
                WHERE record_id = %s
                """,
                (new_donation_date, new_address, new_category, record_id)
            )

            donor_id = old_record["donor_id"]

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
                (donor_id, donor_id)
            )

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
def delete_donation_record(record_id: int):
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
                (donor_id, donor_id)
            )

            connection.commit()

    return {"message": "捐血紀錄刪除成功"}
