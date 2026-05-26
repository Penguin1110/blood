from fastapi import APIRouter, HTTPException, status

from database import fetch_all, fetch_one, get_connection
from schemas import HistoryLog, HistoryLogCreate, HistoryLogUpdate

router = APIRouter(prefix="/health", tags=["health"])


def _select_history_log(where_clause="", params=None):
    query = f"""
        SELECT
            log_id,
            donor_id,
            weight,
            location,
            drugs_record,
            hold_points,
            recorded_at
        FROM history_log
        {where_clause}
    """
    return fetch_one(query, params)


def _ensure_user_exists(donor_id: int):
    user = fetch_one(
        "SELECT donor_id FROM `user` WHERE donor_id = %s",
        (donor_id,),
    )

    if not user:
        raise HTTPException(status_code=404, detail="Donor not found")


@router.get("/status")
def health_check():
    return {"status": "ok"}


@router.get("", response_model=list[HistoryLog])
def list_health_logs():
    return fetch_all(
        """
        SELECT
            log_id,
            donor_id,
            weight,
            location,
            drugs_record,
            hold_points,
            recorded_at
        FROM history_log
        ORDER BY recorded_at DESC, log_id DESC
        """
    )


@router.get("/donor/{donor_id}", response_model=list[HistoryLog])
def list_health_logs_by_donor(donor_id: int):
    _ensure_user_exists(donor_id)

    return fetch_all(
        """
        SELECT
            log_id,
            donor_id,
            weight,
            location,
            drugs_record,
            hold_points,
            recorded_at
        FROM history_log
        WHERE donor_id = %s
        ORDER BY recorded_at DESC, log_id DESC
        """,
        (donor_id,),
    )


@router.get("/{log_id}", response_model=HistoryLog)
def get_health_log(log_id: int):
    log = _select_history_log(
        "WHERE log_id = %s",
        (log_id,),
    )

    if not log:
        raise HTTPException(status_code=404, detail="Health log not found")

    return log


@router.post("", response_model=HistoryLog, status_code=status.HTTP_201_CREATED)
def create_health_log(data: HistoryLogCreate):
    _ensure_user_exists(data.donor_id)

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO history_log
                (
                    donor_id,
                    weight,
                    location,
                    drugs_record,
                    hold_points
                )
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    data.donor_id,
                    data.weight,
                    data.location,
                    data.drugs_record,
                    data.hold_points,
                ),
            )
            connection.commit()
            new_log_id = cursor.lastrowid

    return _select_history_log(
        "WHERE log_id = %s",
        (new_log_id,),
    )


@router.put("/{log_id}", response_model=HistoryLog)
def update_health_log(log_id: int, data: HistoryLogUpdate):
    log = _select_history_log(
        "WHERE log_id = %s",
        (log_id,),
    )

    if not log:
        raise HTTPException(status_code=404, detail="Health log not found")

    fields = data.model_dump(exclude_unset=True)

    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{key} = %s" for key in fields)
    values = list(fields.values())
    values.append(log_id)

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                UPDATE history_log
                SET {set_clause}
                WHERE log_id = %s
                """,
                values,
            )
            connection.commit()

    return _select_history_log(
        "WHERE log_id = %s",
        (log_id,),
    )


@router.delete("/{log_id}")
def delete_health_log(log_id: int):
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "DELETE FROM history_log WHERE log_id = %s",
                (log_id,),
            )
            connection.commit()

            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Health log not found")

    return {"message": "Health log deleted"}
